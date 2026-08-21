const express = require('express');
const { OBJECTIVES, findByFlag, localize } = require('../data/objectives');

const router = express.Router();

router.get('/', (req, res) => {
  const lang = res.locals.lang;
  res.render('objectives', { objectives: OBJECTIVES.map((o) => localize(o, lang)), result: null });
});

router.post('/check', (req, res) => {
  const lang = res.locals.lang;
  const value = (req.body && req.body.flag) || '';
  const found = findByFlag(value);
  const result = found
    ? { ok: true, objective: localize(found, lang) }
    : { ok: false, value };
  res.render('objectives', { objectives: OBJECTIVES.map((o) => localize(o, lang)), result });
});

module.exports = router;
