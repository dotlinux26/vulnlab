'use strict';
const express = require('express');
const router = express.Router();
const { getMongo } = require('../config/db');
const { requireAuth, readFlag } = require('../middleware/auth');

// GET /profile — password change form WITHOUT CSRF token (C16) + avatar URL fetcher (C11)
// Bio is rendered RAW but only to its owner → classic SELF-XSS (low impact alone)
router.get('/profile', requireAuth, async (req, res) => {
  const user = await getMongo().collection('users').findOne({ email: req.user.id }, { projection: { _id: 0, password: 0 } });
  res.render('profile', { profile: user || {}, csrfFlagComment: readFlag('c16'), avatarResult: null });
});

router.post('/profile/bio', requireAuth, async (req, res) => {
  const bio = String(req.body.bio || '').slice(0, 500);
  await getMongo().collection('users').updateOne({ email: req.user.id }, { $set: { bio } });
  res.redirect('/profile');
});

// VULN (C4): mass assignment — every body field is written onto the user doc,
// including "role". PUT/POST /api/profile {"role":"admin"} = instant privilege escalation.
async function updateProfile(req, res) {
  const users = getMongo().collection('users');
  await users.updateOne({ email: req.user.id }, { $set: req.body });
  const updated = await users.findOne({ email: req.user.id }, { projection: { _id: 0 } });
  // Extended payload only meaningful for admins (reward for the C4 path)
  if (updated.role === 'admin') {
    updated.extended = { apiKey: updated.apiKey || null, flag: readFlag('c4') };
  }
  res.json(updated);
}
router.put('/api/profile', requireAuth, updateProfile);
router.post('/api/profile', requireAuth, updateProfile);

router.get('/api/profile', requireAuth, async (req, res) => {
  const users = getMongo().collection('users');
  const user = await users.findOne({ email: req.user.id }, { projection: { _id: 0 } });
  if (user && user.role === 'admin') {
    user.extended = { apiKey: user.apiKey || null, flag: readFlag('c4') };
  }
  res.json(user);
});

// VULN (C11): server-side request forgery — fetches arbitrary URL from user input,
// returns first 500 chars of the response body. Internal network reachable.
router.post('/profile/avatar', requireAuth, async (req, res) => {
  const url = String(req.body.url || '');
  let result;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const text = await resp.text();
    result = { ok: true, status: resp.status, preview: text.slice(0, 500) };
  } catch (e) {
    result = { ok: false, error: e.message };
  }
  const user = await getMongo().collection('users').findOne({ email: req.user.id }, { projection: { _id: 0, password: 0 } });
  res.render('profile', { profile: user || {}, csrfFlagComment: readFlag('c16'), avatarResult: result });
});

// VULN (C16): no CSRF token, no SameSite enforcement, no referer check
router.post('/profile/password', requireAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.redirect('/profile');
  await getMongo().collection('users').updateOne({ email: req.user.id }, { $set: { password } });
  const user = await getMongo().collection('users').findOne({ email: req.user.id }, { projection: { _id: 0, password: 0 } });
  res.render('profile', {
    profile: user || {},
    csrfFlagComment: readFlag('c16'),
    avatarResult: null,
    pwChanged: true,
  });
});

module.exports = router;
