'use strict';
const express = require('express');
const router = express.Router();
const { getMysql } = require('../config/db');
const { readFlag } = require('../middleware/auth');

// GET /catalog?q= — VULN (C5): SQLi via string concat + verbose DB error
//                  VULN (C15): q echoed raw into HTML heading (reflected XSS)
router.get(['/catalog', '/'], async (req, res) => {
  const q = req.query.q || '';
  let products = [];
  let dbError = null;
  if (q) {
    try {
      const [rows] = await getMysql().query(
        `SELECT id, name, price, short_desc FROM products WHERE name LIKE '%${q}%' OR short_desc LIKE '%${q}%'`
      );
      products = rows;
    } catch (e) {
      dbError = e.message; // intentional: full SQL error surfaced to the client
    }
  } else {
    const [rows] = await getMysql().query('SELECT id, name, price, short_desc FROM products LIMIT 20');
    products = rows;
  }
  res.render('catalog', { products, q, dbError, flagComment: readFlag('c15') });
});

module.exports = router;
