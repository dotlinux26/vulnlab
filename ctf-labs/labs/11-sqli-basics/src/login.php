<?php
$db = new mysqli('db', 'labuser', 'labpass', 'lab_db');
if ($db->connect_error) die('DB connection failed');

$user = $_POST['user'] ?? '';
$pass = $_POST['pass'] ?? '';
// LỖI CỐ Ý: nối chuỗi trực tiếp vào SQL login
$sql = "SELECT * FROM users WHERE username = '$user' AND password = '$pass'";
$result = $db->query($sql);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "<h1>Welcome " . htmlspecialchars($row['username']) . "!</h1>";
    if ($row['username'] === 'admin') {
        echo "<p>FLAG=" . file_get_contents('/flag.txt') . "</p>";
    }
} else {
    echo "<p style='color:#f66'>Login failed. Wrong username or password.</p>";
}
echo "<p><a href='/'>Back</a></p>";
?>
