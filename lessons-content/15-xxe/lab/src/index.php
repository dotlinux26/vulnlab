<?php
// XXE Lab - Vulnerable XML Parser
header('Content-Type: text/html; charset=utf-8');

$flag = file_exists('/flag.txt') ? file_get_contents('/flag.txt') : 'FLAG{xxe-lab-flag}';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['xml'])) {
    $xml = $_POST['xml'];
    
    // Vulnerable: External entity parsing enabled
    libxml_disable_entity_loader(false);
    $dom = new DOMDocument();
    $dom->loadXML($xml, LIBXML_NOENT | LIBXML_DTDLOAD);
    
    $result = $dom->saveXML();
    echo "<h3>Kết quả parse:</h3>";
    echo "<pre>" . htmlspecialchars($result) . "</pre>";
}
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>XXE Lab</title>
    <style>
        body { font-family: monospace; max-width: 800px; margin: 50px auto; padding: 20px; background: #1a1a2e; color: #eee; }
        textarea { width: 100%; height: 200px; background: #0f0f23; color: #0f0; border: 1px solid #333; padding: 10px; }
        button { background: #e94560; color: white; border: none; padding: 10px 20px; cursor: pointer; font-size: 16px; }
        button:hover { background: #ff6b6b; }
        .flag-hint { color: #666; font-size: 12px; margin-top: 20px; }
        pre { background: #0f0f23; padding: 10px; border: 1px solid #333; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔬 XXE Lab - XML External Entity Injection</h1>
    <p>Gửi XML payload để test XXE vulnerability.</p>
    
    <form method="POST">
        <textarea name="xml" placeholder='<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>'><?php echo isset($_POST['xml']) ? htmlspecialchars($_POST['xml']) : ''; ?></textarea>
        <br><br>
        <button type="submit">Parse XML</button>
    </form>

    <div class="flag-hint">
        <p>Gợi ý: Flag ở <code>/flag.txt</code></p>
        <p>Payload test: <code><!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///flag.txt"> ]><foo>&xxe;</foo></code></p>
    </div>
</body>
</html>
