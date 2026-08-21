'use strict';
const express = require('express');
const router = express.Router();
const { getMysql, getMongo } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// In-memory carts keyed by user email (resets with container — fine for lab)
const carts = new Map();

function getCart(req) {
  const key = req.user ? req.user.id : 'guest';
  if (!carts.has(key)) carts.set(key, []);
  return carts.get(key);
}

router.post('/cart/add/:productId', async (req, res) => {
  const [rows] = await getMysql().query('SELECT id, name, price FROM products WHERE id = ?', [req.params.productId]);
  if (rows.length) getCart(req).push(rows[0]);
  res.redirect('/cart');
});

router.post('/cart/remove/:index', (req, res) => {
  const cart = getCart(req);
  cart.splice(Number(req.params.index), 1);
  res.redirect('/cart');
});

router.get('/cart', (req, res) => {
  const items = getCart(req);
  const total = items.reduce((s, i) => s + Number(i.price), 0);
  res.render('cart', { items, total });
});

router.post('/checkout', requireAuth, async (req, res) => {
  const items = getCart(req);
  if (!items.length) return res.redirect('/cart');
  const orders = getMongo().collection('orders');
  const maxDoc = await orders.find().sort({ id: -1 }).limit(1).next();
  let nextId = Math.max(1003, (maxDoc ? maxDoc.id : 1002) + 1);
  if (nextId === 1042) nextId++; // keep seeded IDOR order in place
  await orders.insertOne({
    id: nextId,
    owner: req.user.id,
    items,
    total: items.reduce((s, i) => s + Number(i.price), 0),
    status: 'processing',
    note: '',
  });
  carts.set(req.user.id, []);
  res.redirect(`/orders/${nextId}`);
});

module.exports = router;
