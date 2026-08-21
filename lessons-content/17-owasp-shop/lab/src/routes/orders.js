'use strict';
const express = require('express');
const router = express.Router();
const { getMongo } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.get('/orders', requireAuth, async (req, res) => {
  const orders = await getMongo().collection('orders').find({ owner: req.user.id }).toArray();
  res.render('orders', { orders });
});

// VULN (C7): no ownership check — any authenticated user can read any order by ID
router.get('/orders/:id', requireAuth, async (req, res) => {
  const order = await getMongo().collection('orders').findOne({ id: Number(req.params.id) });
  if (!order) return res.status(404).render('404');
  res.render('order', { order });
});

module.exports = router;
