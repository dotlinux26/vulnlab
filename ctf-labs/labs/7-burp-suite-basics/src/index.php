<?php
// Lab Burp Basics — echo request back
$name = $_GET['name'] ?? 'world';
$flag = file_get_contents('/flag.txt');
?>
<!DOCTYPE html>
<html>
<head>
  <title>Burp Echo Lab</title>
  <style>
    body { font-family: monospace; background: #111; color: #0f0; padding: 2em; }
    .box { border: 1px solid #0f0; padding: 1em; margin: 1em 0; }
  </style>
</head>
<body>
  <h1>Echo Lab</h1>
  <div class="box">
    <p>Hello, <b><?php echo $name; ?></b>! (echo trực tiếp — không escape)</p>
    <p>Tham số của bạn: <?php echo htmlspecialchars($_SERVER['QUERY_STRING']); ?></p>
  </div>
  <p>Flag ẩn: <?php echo substr($flag, 0, 12); ?>... (hãy tìm cách đọc full flag)</p>
</body>
</html>
