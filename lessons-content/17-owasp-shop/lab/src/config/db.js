'use strict';
const { MongoClient } = require('mongodb');
const mysql = require('mysql2/promise');

let mongoDb = null;
let mysqlPool = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connectDbs() {
  // Retry loop: containers may still be booting when web starts
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      // MongoDB: users, orders
      const client = new MongoClient(process.env.MONGO_URL || 'mongodb://mongo:27017/cybershop');
      await client.connect();
      mongoDb = client.db();

      // MySQL: catalog + reviews (+ mirrored shopusers for the SQLi exercise)
      mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'mysql',
        user: process.env.MYSQL_USER || 'shopuser',
        password: process.env.MYSQL_PASS || 'shoppass2024',
        database: process.env.MYSQL_DB || 'cybershop',
        waitForConnections: true,
        connectionLimit: 10,
      });
      await mysqlPool.query('SELECT 1');
      console.log('[CyberShop] Mongo + MySQL connected');
      return;
    } catch (e) {
      console.error(`[CyberShop] DB connect attempt ${attempt}/10 failed: ${e.message}`);
      if (attempt === 10) throw e;
      await sleep(3000);
    }
  }
}

function getMongo() { return mongoDb; }
function getMysql() { return mysqlPool; }

async function seedMongo() {
  const users = mongoDb.collection('users');
  const count = await users.countDocuments();
  if (count > 0) return;

  await users.insertMany([
    {
      email: 'admin@cybershop.vn', name: 'Administrator', role: 'admin',
      password: 'Admin#1337',
      secretNote: 'FLAG{c2}',
      apiKey: 'sk_live_admin_9f3ac21e77',
    },
    {
      email: 'demo@cybershop.vn', name: 'Demo User', role: 'customer',
      password: 'demo123',
    },
    {
      email: 'john@cybershop.vn', name: 'John Tran', role: 'customer',
      password: 'jordan23', // rockyou: yes — crackable after SQLi dump
    },
    {
      email: 'bob@cybershop.vn', name: 'Bob Le', role: 'customer',
      password: 'monkey', // rockyou top-20 — crackable after SQLi dump
    },
  ]);

  const orders = mongoDb.collection('orders');
  await orders.insertMany([
    { id: 1001, owner: 'john@cybershop.vn', items: [{ name: 'USB Rubber Ducky', qty: 1, price: 45 }], total: 45, status: 'delivered', note: 'Gift wrap please' },
    { id: 1002, owner: 'demo@cybershop.vn', items: [{ name: 'WiFi Pineapple', qty: 1, price: 99 }], total: 99, status: 'shipping', note: '' },
    { id: 1042, owner: 'bob@cybershop.vn', items: [{ name: 'Proxmark3 Kit', qty: 1, price: 299 }], total: 299, status: 'processing', note: 'Internal audit note: FLAG{c7}' },
  ]);

  const notes = mongoDb.collection('notes');
  await notes.insertOne({ text: 'Welcome to CyberShop public feedback box!', createdAt: new Date() });

  console.log('[CyberShop] Mongo seeded');
}

module.exports = { connectDbs, seedMongo, getMongo, getMysql };
