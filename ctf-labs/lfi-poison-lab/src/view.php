<?php
$page = isset($_GET['page']) ? $_GET['page'] : 'about';
$BASE = '/labs-env/lfi';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Đọc Văn Bản - Ghedahaui</title>
    <style>
        body { background-color: #0b0f19; color: #c9d1d9; font-family: monospace; margin: 0; padding: 40px; line-height: 1.6; }
        .doc-container { max-width: 800px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .doc-header { border-bottom: 2px dashed #58a6ff; padding-bottom: 20px; margin-bottom: 30px; }
        .doc-header h2 { color: #58a6ff; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
        .doc-content { font-size: 16px; color: #8b949e; }
        .back-btn { display: inline-block; margin-top: 40px; padding: 10px 20px; background: #21262d; border: 1px solid #30363d; color: #58a6ff; text-decoration: none; border-radius: 4px; transition: 0.2s; }
        .back-btn:hover { background: #30363d; color: #fff; }
    </style>
</head>
<body>
    <div class="doc-container">
        <div class="doc-header">
            <h2>[SYSTEM VIEWER]</h2>
            <p style="margin: 5px 0 0 0; color: #8b949e;">Đang tải tệp tin nội bộ...</p>
        </div>
        <div class="doc-content">
            <?php include("pages/" . $page . ".php"); ?>
        </div>
        <a href="<?php echo $BASE; ?>/index.php" class="back-btn">&larr; Quay lại Bảng điều khiển</a>
    </div>
</body>
</html>
