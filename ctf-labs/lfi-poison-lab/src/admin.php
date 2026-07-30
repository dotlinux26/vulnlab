<?php
$log_file = isset($_GET['log']) ? $_GET['log'] : 'system.log';
$BASE = '/labs-env/lfi';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ROOT ACCESS - Log Viewer</title>
    <style>
        body { background-color: #050505; color: #ff3333; font-family: "Courier New", Courier, monospace; margin: 0; padding: 20px; }
        .terminal { background: #0a0a0a; border: 1px solid #ff3333; border-radius: 4px; padding: 20px; box-shadow: 0 0 20px rgba(255, 51, 51, 0.2); }
        .term-header { border-bottom: 1px solid #ff3333; padding-bottom: 10px; margin-bottom: 20px; font-weight: bold; letter-spacing: 1px; }
        pre { white-space: pre-wrap; word-wrap: break-word; color: #a3a3a3; font-size: 14px; }
        .blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }
        a { color: #ffcc00; text-decoration: none; border-bottom: 1px dashed #ffcc00; }
        a:hover { color: #fff; border-bottom-style: solid; }
    </style>
</head>
<body>
    <div class="terminal">
        <div class="term-header">
            root@ghedahaui-server:~# cat <?php echo htmlspecialchars($log_file); ?> <span class="blink">_</span>
        </div>
        <pre><?php include($log_file); ?></pre>
        <div style="margin-top: 30px; border-top: 1px solid #333; padding-top: 15px;">
            <a href="<?php echo $BASE; ?>/index.php">[Bấm vào đây để NGẮT KẾT NỐI]</a>
        </div>
    </div>
</body>
</html>
