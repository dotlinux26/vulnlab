<?php
/**
 * GHEDAHAUI SYSTEM - EMERGENCY LOG FLUSHER
 * Dùng để khôi phục tệp access.log của Apache khi bị "đầu độc" sai cú pháp PHP.
 */

// Trỏ thẳng vào file log gốc của hệ thống Apache
$log_file = '/var/log/apache2/access.log';

// Viết lại một dòng log tiêu chuẩn của Apache để file không bị trống hoàn toàn
$clean_content = '127.0.0.1 - - [' . date('d/M/Y:H:i:s O') . '] "GET / SYSTEM_FLUSH HTTP/1.1" 200 1337 "-" "Ghedahaui-Emergency-Cleanser/1.0"' . "\n";

// Thực hiện ghi đè (truncate) để dọn sạch rác PHP
if (@file_put_contents($log_file, $clean_content)) {
    $msg = "HỒI SINH ACCESS LOG THÀNH CÔNG!";
    $desc = "Toàn bộ mã độc PHP trong Apache Log đã được dọn sạch. Bạn có thể bắt đầu đầu độc lại từ đầu.";
    $color = "#3fb950";
} else {
    $msg = "LỖI QUYỀN TRUY CẬP (PERMISSION DENIED)!";
    $desc = "Không thể ghi đè /var/log/apache2/access.log. Hãy báo cho Admin kiểm tra lại quyền chmod trong Docker!";
    $color = "#ff7b72";
}
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Hệ Thống Hồi Sinh Access Log - Ghedahaui</title>
    <style>
        body { background-color: #0d1117; color: #c9d1d9; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #161b22; border: 1px solid #30363d; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 0 30px rgba(0,0,0,0.5); max-width: 600px; }
        h1 { color: <?php echo $color; ?>; text-transform: uppercase; letter-spacing: 2px; }
        p { color: #8b949e; margin-top: 20px; line-height: 1.6; }
        .btn { display: inline-block; margin-top: 30px; padding: 10px 25px; border: 1px solid #58a6ff; color: #58a6ff; text-decoration: none; border-radius: 6px; font-weight: bold; transition: 0.3s; }
        .btn:hover { background: rgba(88, 166, 255, 0.1); }
    </style>
</head>
<body>
    <div class="card">
        <h1><?php echo $msg; ?></h1>
        <p><?php echo $desc; ?></p>
        <a href="index.php" class="btn">QUAY LẠI HỆ THỐNG</a>
    </div>
</body>
</html>
