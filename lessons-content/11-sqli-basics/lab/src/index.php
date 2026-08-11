<?php
$db = new mysqli('db', 'labuser', 'labpass', 'lab_db');
if ($db->connect_error) die('DB connection failed: ' . $db->connect_error);

// Seed data
$db->query("CREATE TABLE IF NOT EXISTS products (id INT PRIMARY KEY, name VARCHAR(100), price DECIMAL(10,2))");
$db->query("INSERT IGNORE INTO products VALUES (1,'phone',500),(2,'laptop',1200),(3,'keyboard',30)");
$db->query("CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY, username VARCHAR(50), password VARCHAR(100))");
$db->query("INSERT IGNORE INTO users VALUES (1,'admin','flag_placeholder'),(2,'guest','guest123')");

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html><head><title>VULNLAB Shop</title>
<style>body{font-family:sans-serif;background:#1a1a2e;color:#eee;padding:2em}input{padding:.5em;margin:.3em}button{padding:.5em 1em;cursor:pointer}</style>
</head>
<body>
<h1>VULNLAB Shop (dính SQLi)</h1>
<form action="search.php" method="get">
  Tìm sản phẩm: <input type="text" name="q" placeholder="vd: phone">
  <button type="submit">Search</button>
</form>
<form action="login.php" method="post">
  <h3>Login (admin)</h3>
  Username: <input type="text" name="user"><br>
  Password: <input type="password" name="pass"><br>
  <button type="submit">Login</button>
</form>
<hr>
<p>Lab: <b>boolean / error / union / login bypass</b></p>
</body></html>
