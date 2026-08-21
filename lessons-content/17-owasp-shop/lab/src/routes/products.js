'use strict';
const express = require('express');
const router = express.Router();
const { getMysql, getMongo } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /product/:id — reviews rendered RAW (<%- %>) → stored XSS sink (C14)
router.get('/product/:id', async (req, res) => {
  const [rows] = await getMysql().query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).render('404');
  const reviews = await getMysql().query(
    'SELECT author, text, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
    [req.params.id]
  ).then(([r]) => r);
  res.render('product', { product: rows[0], reviews });
});

// POST /product/:id/review — stores raw text, no sanitization (C14)
router.post('/product/:id/review', requireAuth, async (req, res) => {
  const text = String(req.body.text || '').slice(0, 2000);
  await getMysql().query(
    'INSERT INTO reviews (product_id, author, text) VALUES (?, ?, ?)',
    [req.params.id, req.user.name || req.user.id, text]
  );
  res.redirect(`/product/${req.params.id}`);
});

module.exports = router;
