<?php
$ip = $_GET['ip'] ?? '';

$page = '<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Web Ping Tool</title>
<style>body{font-family:monospace;max-width:760px;margin:40px auto;padding:0 16px}
input{font-family:monospace;padding:6px;width:320px}button{padding:6px 14px}
pre{background:#111;color:#4f8;padding:12px;border-radius:4px;overflow-x:auto}</style>
</head><body>
<h1>Web Ping Tool</h1>
<form method="get"><input name="ip" placeholder="8.8.8.8" value="%s">
<button type="submit">Ping</button></form>
<pre>%s</pre></body></html>';

if ($ip === '') {
    printf($page, htmlspecialchars($ip), "Use ?ip=8.8.8.8");
    exit;
}

// LỖI CỐ Ý: input nối trực tiếp vào lệnh shell
$cmd = "ping -c 1 " . $ip;
$output = [];
exec($cmd, $output);
$result = implode("\n", $output);

printf($page, htmlspecialchars($ip), htmlspecialchars($result));
?>
