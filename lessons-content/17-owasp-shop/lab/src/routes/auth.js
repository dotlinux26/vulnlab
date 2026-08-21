'use strict';
const express = require('express');
const router = express.Router();
const { getMongo } = require('../config/db');
const { sign, readFlag } = require('../middleware/auth');

// GET /login — VULN (C15-family): ?msg= echoed raw (reflected XSS sink #2)
router.get('/login', (req, res) => {
  res.render('login', { error: null, msg: req.query.msg || null });
});

// POST /login — VULN (C2): body values passed straight into Mongo query.
// JSON {"email":{"$ne":null},"password":{"$ne":null}} matches the first user (admin).
router.post('/login', async (req, res) => {
  try {
    const users = getMongo().collection('users');
    const user = await users.findOne({ email: req.body.email, password: req.body.password });
    if (!user) return res.status(401).render('login', { error: 'Invalid credentials' });

    const token = sign({ id: user.email, name: user.name, role: user.role });
    // Admin session: hardened with HttpOnly (teaching point — XSS cannot read it).
    // Moderator session: legacy console requires JS-readable cookie → NO HttpOnly
    // (C14 target: stolen token = full session hijacking of the bot account).
    const httpOnly = user.role !== 'moderator';
    res.cookie('token', token, { httpOnly });
    // Legacy moderation console caches the key in a cookie for "quick access".
    // NOT httpOnly either — sloppy companion cookie leaks to XSS.
    if (user.role === 'admin' || user.role === 'moderator') {
      res.cookie('moderation_key', readFlag('c14'), { httpOnly: false });
    }
    if (req.accepts('json') && (req.is('json') || typeof req.body.email === 'object')) {
      return res.json({ ok: true, user: { email: user.email, name: user.name, role: user.role } });
    }
    res.redirect('/catalog');
  } catch (e) {
    res.status(500).render('login', { error: e.message });
  }
});

// GET /register
router.get('/register', (req, res) => res.render('register', { error: null }));

router.post('/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.render('register', { error: 'Missing fields' });
  const users = getMongo().collection('users');
  const exists = await users.findOne({ email });
  if (exists) return res.render('register', { error: 'Email already registered' });
  await users.insertOne({ email, name: name || email.split('@')[0], role: 'customer', password });
  res.redirect('/login');
});

// GET /auth/me — returns full stored doc (VULN helper for C2 visibility post-bypass)
router.get('/auth/me', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'not logged in' });
  const doc = await getMongo().collection('users').findOne({ email: req.user.id }, { projection: { _id: 0 } });
  res.json(doc);
});

// Forgot-password flow — VULN (C6): 4-digit OTP, no rate limiting on
// verification (no attempt counter, no lockout, no delay) → brute-forceable.
router.get('/auth/forgot', (req, res) => res.render('forgot', { state: 'ask', email: '', msg: null }));
router.get('/auth/otp', (req, res) => res.redirect('/auth/forgot'));

router.post('/auth/forgot', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await getMongo().collection('users').findOne({ email });
  if (user) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    await getMongo().collection('otp_tokens').updateOne(
      { email },
      { $set: { code, expiresAt: Date.now() + 5 * 60 * 1000 } },
      { upsert: true }
    );
    // "Mail server" của lab: OTP nằm trong log container web
    console.log(`[mail] to ${email}: your password reset code is ${code} (valid 5 min)`);
  }
  // Thông báo chung chung bất kể email tồn tại hay không (tránh enumeration)
  res.render('forgot', { state: 'sent', email, msg: null });
});

router.post('/auth/otp-verify', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const rec = await getMongo().collection('otp_tokens').findOne({ email });
  if (rec && rec.code === code && Date.now() < rec.expiresAt) {
    return res.render('forgot', {
      state: 'verified', email, code,
      msg: { ok: true, text: `OTP verified. Flag: ${readFlag('c6')}` },
    });
  }
  res.render('forgot', {
    state: 'sent', email,
    msg: { ok: false, text: 'Invalid or expired OTP' },
  });
});

router.post('/auth/reset-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const password = String(req.body.password || '');
  const rec = await getMongo().collection('otp_tokens').findOne({ email });
  if (!(rec && rec.code === code && Date.now() < rec.expiresAt)) {
    return res.render('forgot', { state: 'ask', email: '', msg: { ok: false, text: 'OTP expired — start again' } });
  }
  if (password.length < 4) {
    return res.render('forgot', { state: 'verified', email, code, msg: { ok: false, text: 'Password too short (min 4)' } });
  }
  await getMongo().collection('users').updateOne({ email }, { $set: { password } });
  await getMongo().collection('otp_tokens').deleteOne({ email });
  res.render('forgot', { state: 'done', email: '', msg: { ok: true, text: 'Password updated. You can sign in now.' } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('moderation_key');
  res.redirect('/catalog');
});

module.exports = router;
