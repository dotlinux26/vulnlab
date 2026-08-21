'use strict';
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { getMongo, getMysql } = require('../config/db');
const { requireAuth, readFlag } = require('../middleware/auth');

// Admin dashboard (any M1 path lands here)
router.get('/admin', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).render('403');
  res.render('admin/dashboard');
});

// C3 reward: audit log visible to any valid admin session
router.get('/admin/api/audit', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const lines = [
    '[2024-11-02 09:14Z] backup job: /.backup/db-seed.js.bak rotated',
    '[2024-12-19 22:41Z] WARN: 5 failed logins for admin@cybershop.vn from 10.0.7.31',
    '[2025-01-08 03:02Z] otp service: rate limiting module disabled by legacy config',
    `[2025-01-15 11:20Z] moderation key rotated: ${readFlag('c3')}`,
  ];
  res.render('admin/audit', { lines });
});

// VULN (C8-family / supports M2): function-level authorization missing —
// only requires ANY logged-in session, not the admin role.
router.get('/api/admin/users', requireAuth, async (req, res) => {
  const mongoUsers = await getMongo().collection('users')
    .find({}, { projection: { _id: 0, email: 1, name: 1, role: 1 } }).toArray();
  let mysqlUsers = [];
  try {
    [mysqlUsers] = await getMysql().query('SELECT email, password_hash FROM shopusers');
  } catch {}
  res.json({ note: 'legacy endpoint — authz pending (TICKET-4021)', mongoUsers, mysqlUsers });
});

// VULN (C11): command injection in network diagnostics (admin only)
router.get('/admin/tools/diag', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).render('403');
  res.render('admin/diag', { output: null });
});
router.post('/admin/tools/diag', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).render('403');
  const target = String(req.body.target || '');
  // sink: user input concatenated into a shell command
  exec(`sh -c "getent hosts ${target} || echo 'cannot resolve ${target}'"`, { timeout: 5000 }, (err, stdout, stderr) => {
    const output = (stdout || '') + (stderr || '') + (err ? `\n[exit] ${err.message}` : '');
    res.render('admin/diag', { output });
  });
});

// Stored XSS target page — visited automatically by xss-bot with a MODERATOR session.
// Moderators (bot's role) may access this page — that's what makes the stolen
// bot token useful for an attacker (session hijacking → read moderation data).
router.get('/admin/reviews', requireAuth, async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) return res.status(403).render('403');
  const reviews = await getMysql().query(
    'SELECT product_id, author, text, created_at FROM reviews ORDER BY created_at DESC LIMIT 500'
  ).then(([r]) => r);
  res.render('admin/reviews', { reviews, moderationKey: readFlag('c14') });
});

module.exports = router;
