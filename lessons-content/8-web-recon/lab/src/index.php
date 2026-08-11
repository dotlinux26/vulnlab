<?php
$title = "Welcome to DOTBank";
?>
<!DOCTYPE html>
<html>
<head>
  <title><?php echo $title; ?></title>
  <style>
    body { font-family: Arial; background: #0b3d91; color: #fff; padding: 3em; max-width: 800px; margin: auto; }
    a { color: #ffd700; }
  </style>
</head>
<body>
  <h1><?php echo $title; ?></h1>
  <p>Ngân hàng trực tuyến tin cậy của bạn.</p>
  <!-- TODO: thay mat khau admin mac dinh truoc khi ra mat -->
  <!-- dev notes: /dev_notes.txt -->
  <nav>
    <a href="?page=home">Home</a> |
    <a href="?page=about">About</a> |
    <a href="?page=contact">Contact</a>
  </nav>
  <hr>
  <?php
  $page = $_GET['page'] ?? 'home';
  $safe_pages = ['home', 'about', 'contact'];
  if (in_array($page, $safe_pages)) {
      echo "<h2>".ucfirst($page)."</h2>";
      echo "<p>Nội dung trang $page.</p>";
  } else {
      echo "<h2>404</h2><p>Trang không tồn tại.</p>";
  }
  ?>
  <footer><small>&copy; 2026 DOTBank — secure banking</small></footer>
</body>
</html>
