-- CyberShop MySQL schema + seed (auto-run by official mysql image on first boot)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  short_desc VARCHAR(500) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  author VARCHAR(120) DEFAULT 'guest',
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- XML imports land here (moderation staging) — keeps the public catalog clean
-- so one student's XXE exercise never spoils answers for others.
CREATE TABLE IF NOT EXISTS imported_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200),
  price DECIMAL(10,2) DEFAULT 0,
  short_desc VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mirrored user table for the SQLi exercise (MD5 on purpose — crackable)
CREATE TABLE IF NOT EXISTS shopusers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(200) NOT NULL,
  password_hash CHAR(32) NOT NULL,
  role VARCHAR(20) DEFAULT 'customer'
);

INSERT INTO products (name, price, short_desc) VALUES
 ('USB Rubber Ducky', 45.00, 'HID keystroke injection tool'),
 ('WiFi Pineapple', 99.00, 'Wireless penetration testing platform'),
 ('Proxmark3 Kit', 299.00, 'RFID/NFC security research suite'),
 ('HackRF One', 129.00, 'Software defined radio (1 MHz - 6 GHz)'),
 ('Bus Pirate v4', 39.50, 'Multi-protocol serial debugging probe'),
 ('ChameleonMini RevE', 75.00, 'NFC card emulation & sniffing'),
 ('LAN Turtle', 59.00, 'Covert network implant for ethernet'),
 ('Key Croc', 399.00, 'Keystroke logging & payload arsenal');

INSERT INTO reviews (product_id, author, text) VALUES
 (1, 'John Tran', 'Works exactly as advertised. Fast shipping!'),
 (2, 'Demo User', 'Great range coverage, setup took a while.'),
 (3, 'Bob Le', 'Solid kit for RFID research.');

INSERT INTO shopusers (email, password_hash, role) VALUES
 ('admin@cybershop.vn', MD5('Admin#1337'), 'admin'),   -- leakable via /.backup source, not via wordlist
 ('demo@cybershop.vn',  MD5('demo123'),    'customer'),
 ('john@cybershop.vn',  MD5('jordan23'),   'customer'), -- rockyou: yes
 ('bob@cybershop.vn',   MD5('monkey'),     'customer'), -- rockyou: yes (top 20)
 ('flaguser@cybershop.vn', 'FLAG{c5}', 'vault');
