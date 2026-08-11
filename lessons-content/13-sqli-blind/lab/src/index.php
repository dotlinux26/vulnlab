<?php
$db = new mysqli('db', 'labuser', 'labpass', 'lab_db');
if ($db->connect_error) die('DB connection failed');

// Seed: bảng secret_data chứa flag (flag thật đọc từ /flag.txt khi khởi tạo)
$db->query("CREATE TABLE IF NOT EXISTS secret_data (id INT PRIMARY KEY, flag VARCHAR(100))");
$flag = trim(file_get_contents('/flag.txt'));
$db->query("INSERT IGNORE INTO secret_data VALUES (1, '$flag')");
$db->query("CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY, username VARCHAR(50))");
$db->query("INSERT IGNORE INTO users VALUES (1,'admin'),(2,'guest')");

$id = $_GET['id'] ?? '';
if ($id === '') { echo "Use ?id=1"; exit; }

// LỖI CỐ Ý: nối chuỗi + KHÔNG hiện kết quả/lỗi (blind)
$sql = "SELECT * FROM users WHERE id = '$id'";
$result = @$db->query($sql);   // @ : nuốt mọi error message

if ($result && $result->num_rows > 0) {
    echo "User exists";
} else {
    echo "User not found";
}
?>
