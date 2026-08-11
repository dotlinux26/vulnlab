const express = require('express');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const uri = 'mongodb://db:27017';
const dbName = 'lab_db';
const client = new MongoClient(uri);

async function seed() {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  await users.deleteMany({});
  await users.insertMany([
    { username: 'admin', password: 'pa55w0rd_admin' },
    { username: 'guest', password: 'guest123' }
  ]);
}

app.get('/', (_req, res) => {
  res.type('text/plain').send(
    'NoSQL Injection Lab\n\nPOST /api/login with JSON body:\n{"username":"...","password":"..."}\n'
  );
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  // LỖI CỐ Ý: username & password được đưa thẳng vào query (có thể là object operator)
  const db = client.db(dbName);
  const user = await db.collection('users').findOne({ username, password });

  if (user) {
    const flag = user.username === 'admin' ? fs.readFileSync('/flag.txt', 'utf8').trim() : null;
    return res.json({ success: true, role: user.username, flag });
  }
  res.status(401).json({ success: false, error: 'invalid credentials' });
});

seed()
  .then(() => app.listen(3000, '0.0.0.0', () => console.log('[+] lab listening on :3000')))
  .catch((err) => { console.error('seed failed:', err); process.exit(1); });
