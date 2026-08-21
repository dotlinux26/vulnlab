'use strict';
const express = require('express');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const router = express.Router();
const { getMysql, getMongo } = require('../config/db');
const { readFlag, JWT_SECRET } = require('../middleware/auth');

// Language switch
router.get('/lang/:l', (req, res) => {
  res.cookie('lang', req.params.l === 'en' ? 'en' : 'vi', { maxAge: 30 * 864e5 });
  res.redirect(req.get('referer') || '/catalog');
});

// VULN (C8): debug endpoint exposed in production + robots.txt points at it
router.get('/debug', (req, res) => {
  res.type('text/plain').send([
    '=== CyberShop DEBUG PANEL ===',
    `node: ${process.version}`,
    `cwd: ${process.cwd()}`,
    `mongo: ${process.env.MONGO_URL}`,
    `mysql host: ${process.env.MYSQL_HOST} db: ${process.env.MYSQL_DB}`,
    `jwt secret name: JWT_SECRET (value redacted — see /.backup/db-seed.js.bak)`,
    `flag-service: ${process.env.FLAG_SERVICE_URL}`,
    `netdiag allowlist secret: /opt/scripts/netdiag.secret`,
    `legacy otp rate-limit module: DISABLED`,
    `secret of the day: ${readFlag('c8')}`,
    '(this panel must never ship to production)',
  ].join('\n'));
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    'User-agent: *\nDisallow: /admin\nDisallow: /debug\nDisallow: /.backup/\nDisallow: /import\n' +
    '# Staff on-duty for content reports (TICKET-4033): hanh@cybershop.vn\n'
  );
});

// VULN (C8): directory listing on hidden backup folder
const BACKUP_DIR = path.join(__dirname, '..', '.backup');
router.get('/.backup/', (req, res) => {
  const files = fs.readdirSync(BACKUP_DIR);
  res.type('html').send(
    `<h1>Index of /.backup/</h1><ul>` +
    files.map((f) => `<li><a href="/.backup/${f}">${f}</a></li>`).join('') +
    `</ul>`
  );
});
router.get('/.backup/:file', (req, res) => {
  const file = path.join(BACKUP_DIR, req.params.file);
  if (!file.startsWith(BACKUP_DIR) || !fs.existsSync(file)) return res.status(404).render('404');
  res.sendFile(file);
});

// Public feedback box — unauthenticated write+read; doubles as XSS exfil receiver
// Invoice — VULN (C12): user-controlled string passed straight into ejs.render (SSTI)
router.get('/invoice/:id', async (req, res) => {
  const order = await getMongo().collection('orders').findOne({ id: Number(req.params.id) }) || { id: 0, items: [], total: 0 };
  const tpl = String(req.query.tpl || '');
  let html;
  // pass res.locals (t, lang, user) so templates can use helpers; order last = cannot be overridden
  const locals = { ...res.locals, user: req.user || {}, order };
  if (tpl) {
    try {
      html = ejs.render(tpl, locals); // sink: template code execution
    } catch (e) {
      html = `<pre>template error: ${ejs.escapeXML(e.message)}</pre>`;
    }
  } else {
    try {
      html = ejs.render(fs.readFileSync(path.join(__dirname, '..', 'views', 'invoice-default.ejs'), 'utf8'), locals);
    } catch (e) {
      html = `<pre>template error: ${ejs.escapeXML(e.message)}</pre>`;
    }
  }
  res.render('invoice', { inner: html });
});

// Product XML import — VULN (C10): external entities resolved by the "parser"
// (simulated vulnerable libxml2 behavior for training purposes)
function resolveEntities(xml, depth = 0) {
  if (depth > 5) return xml;
  const declRe = /<!ENTITY\s+(\w+)\s+SYSTEM\s+"([^"]+)">\s*/g;
  const entities = {};
  let m;
  while ((m = declRe.exec(xml)) !== null) entities[m[1]] = m[2];
  if (!Object.keys(entities).length) return xml;
  let out = xml.replace(declRe, ''); // strip declarations like a DTD-aware parser would consume them
  for (const [name, system] of Object.entries(entities)) {
    let value = '';
    try {
      if (system.startsWith('file://')) value = fs.readFileSync(system.slice(7), 'utf8');
      else if (system.startsWith('http')) throw new Error('blocked by egress filter (http entities)');
      else value = fs.readFileSync(system, 'utf8');
    } catch (e) { value = `[entity error: ${e.message}]`; }
    out = out.split(`&${name};`).join(value);
  }
  return resolveEntities(out, depth + 1);
}

router.get('/import', (req, res) => res.render('import', { result: null }));
router.post('/import/xml', async (req, res) => {
  const raw = String(req.body.xml || '');
  const expanded = resolveEntities(raw); // XXE happens here
  const products = [];
  const itemRe = /<product>([\s\S]*?)<\/product>/g;
  let m;
  while ((m = itemRe.exec(expanded)) !== null) {
    const block = m[1];
    const tag = (t) => { const r = new RegExp(`<${t}>([\\s\\S]*?)</${t}>`).exec(block); return r ? r[1] : ''; };
    products.push({ name: tag('name'), price: Number(tag('price')) || 0, short_desc: tag('short_desc') });
  }
  let inserted = 0;
  for (const p of products) {
    if (!p.name) continue;
    // Staging table (moderation queue): proof of import shows in the parser
    // output below; the public catalog stays untouched.
    await getMysql().query('INSERT INTO imported_products (name, price, short_desc) VALUES (?, ?, ?)', [p.name, p.price, p.short_desc]);
    inserted++;
  }
  res.render('import', { result: { inserted, parsed: expanded.slice(0, 1500) } });
});

module.exports = router;
