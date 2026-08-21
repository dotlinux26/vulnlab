'use strict';
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const { connectDbs, seedMongo } = require('./config/db');
const i18n = require('./middleware/i18n');
const { sessionMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const miscRoutes = require('./routes/misc');
const objectivesRoutes = require('./routes/objectives');

const app = express();
// Lab resilience: a malformed async request must not kill the whole container mid-class.
process.on('unhandledRejection', (err) => console.error('[CyberShop] unhandledRejection:', err));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));

// i18n + custom insecure session-state parser (C13 gadget output shown in footer)
app.use(i18n);
app.use(sessionMiddleware);

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.use('/', authRoutes);
app.use('/', catalogRoutes);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/', profileRoutes);
app.use('/', adminRoutes);
app.use('/', miscRoutes);
app.use('/objectives', objectivesRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Verbose error page (intentional info leak)
app.use((err, req, res, next) => {
  console.error('[CyberShop] Error:', err.message);
  res.status(500).send(`<h1>Server Error</h1><pre>${err.stack}</pre>`);
});

(async () => {
  await connectDbs();
  await seedMongo();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`[CyberShop] listening on :${PORT}`));
})();
