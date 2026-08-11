<?php
$db = new mysqli('db', 'labuser', 'labpass', 'lab_db');
if ($db->connect_error) die('DB connection failed');

$q = $_GET['q'] ?? '';
// LỖI CỐ Ý: nối chuỗi trực tiếp vào SQL
$sql = "SELECT id, name, price FROM products WHERE name LIKE '%$q%'";

$result = $db->query($sql);
echo "<h2>Search: " . htmlspecialchars($q) . "</h2>";

if (!$result) {
    // LỖI CỐ Ý: hiện error message của DB ra ngoài (error-based)
    echo "<p style='color:#f66'>SQL Error: " . $db->error . "</p>";
    exit;
}

if ($result->num_rows > 0) {
    echo "<table border='1' cellpadding='6'><tr><th>ID</th><th>Name</th><th>Price</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr><td>{$row['id']}</td><td>{$row['name']}</td><td>{$row['price']}</td></tr>";
    }
    echo "</table>";
} else {
    echo "<p>No results.</p>";
}
echo "<p><a href='/'>Back</a></p>";
?>
