'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Weak hardcoded secret on purpose (crackable offline after source leak)
const JWT_SECRET = process.env.JWT_SECRET || 'cybershop-secret-2024';

const b64u = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

function sign(payload) {
  const h = b64u({ alg: 'HS256', typ: 'JWT' });
  const p = b64u({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 });
  const s = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${s}`;
}

// VULNERABLE (C3): hand-rolled verification accepts "alg":"none" unsigned tokens
function verify(token) {
  try {
    const [h, p, s] = String(token).split('.');
    const header = JSON.parse(Buffer.from(h, 'base64url').toString());
    if (header.alg === 'none' && (s === '' || s === undefined)) {
      return JSON.parse(Buffer.from(p, 'base64url')); // trust unsigned payload
    }
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
    if (expected !== s) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Flags are stored under hashed filenames (/app/.state/<md5(name)>.txt) so a
// single file-read primitive cannot enumerate the whole set by name guessing.
function readFlag(name) {
  try {
    const hash = crypto.createHash('md5').update(name).digest('hex');
    return fs.readFileSync(path.join(__dirname, '..', '.state', `${hash}.txt`), 'utf8').trim();
  } catch {
    return `FLAG{${name}_missing}`;
  }
}

// Session middleware: JWT cookie for identity + custom insecure shop_state cookie (C13)
function sessionMiddleware(req, res, next) {
  req.user = null;
  if (req.cookies.token) {
    const payload = verify(req.cookies.token);
    if (payload) req.user = payload;
  }
  // Expose to views here (AFTER decoding), not in i18n — i18n runs before this
  // middleware and would otherwise always see req.user as undefined.
  res.locals.user = req.user;

  // C13: legacy client-state cookie parsed by insecure custom serializer.
  // First visit gets a default state so the cookie's existence + CSPACK v1
  // format are discoverable in devtools (decode base64 to inspect).
  res.locals.stateDebug = null;
  if (req.cookies.shop_state) {
    const { hydrate } = require('../lib/serializer');
    const result = hydrate(req.cookies.shop_state);
    if (result && result.debug && result.debug.length) {
      res.locals.stateDebug = result.debug.join('\n');
    }
  } else {
    const { pack } = require('../lib/serializer');
    res.cookie('shop_state', pack({ cart: 'empty', theme: 'dark', currency: 'VND' }), { httpOnly: false });
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).redirect('/login');
  next();
}

module.exports = { sign, verify, readFlag, sessionMiddleware, requireAuth, JWT_SECRET };
