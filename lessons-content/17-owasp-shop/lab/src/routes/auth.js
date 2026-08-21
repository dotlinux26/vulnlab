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
    res.cookie('token', token, { httpOnly: true });
    // Legacy moderation console caches the key in a cookie for "quick access".
    // NOT httpOnly (C14 teaching point: sloppy companion cookie leaks to XSS
    // even though the session token itself is protected).
    if (user.role === 'admin') {
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

// OTP flow — VULN (C6): no rate limiting on verification
router.get('/auth/otp', (req, res) => res.render('otp', { result: null }));
router.post('/auth/otp-verify', (req, res) => {
  const { email, code } = req.body;
  // Seed: demo@cybershop.vn has OTP 1337. No attempt counter, no lockout, no delay.
  if (email === 'demo@cybershop.vn' && String(code) === '1337') {
    return res.render('otp', { result: { ok: true, msg: `OTP verified. Recovery link sent. Flag: ${readFlag('c6')}` } });
  }
  res.render('otp', { result: { ok: false, msg: 'Invalid or expired OTP' } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('moderation_key');
  res.redirect('/catalog');
});

module.exports = router;
