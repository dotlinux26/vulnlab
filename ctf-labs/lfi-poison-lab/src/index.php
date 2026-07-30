<?php 
$lang = isset($_GET['language']) ? $_GET['language'] : 'lang/vi.php';
$BASE = '/labs-env/lfi';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ghedahaui Financial Portal</title>
    <style>
        body { background-color: #0b0f19; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
        .header { background: #161b22; padding: 15px 30px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 24px; font-weight: bold; color: #58a6ff; letter-spacing: 2px; }
        .lang-switch a { color: #8b949e; text-decoration: none; padding: 5px 10px; border: 1px solid #30363d; border-radius: 6px; margin-left: 10px; transition: 0.2s; }
        .lang-switch a:hover { background: #30363d; color: #fff; }
        .layout { display: flex; min-height: calc(100vh - 65px); }
        .sidebar { width: 250px; background: #161b22; border-right: 1px solid #30363d; padding: 20px; }
        .sidebar-menu { list-style: none; padding: 0; margin: 0; }
        .sidebar-menu li { margin-bottom: 10px; }
        .sidebar-menu a { color: #c9d1d9; text-decoration: none; display: block; padding: 10px 15px; border-radius: 6px; transition: 0.2s; }
        .sidebar-menu a:hover { background: #21262d; color: #58a6ff; }
        .main-content { flex-grow: 1; padding: 40px; }
        .greeting-box { background: rgba(88, 166, 255, 0.1); border: 1px solid rgba(88, 166, 255, 0.4); padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .fake-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .fake-table th, .fake-table td { border: 1px solid #30363d; padding: 12px; text-align: left; }
        .fake-table th { background: #21262d; color: #8b949e; }
        .badge-danger { background: rgba(248, 81, 73, 0.1); color: #ff7b72; padding: 2px 8px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(248, 81, 73, 0.4); }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">GHEDAHAUI.FI</div>
        <div class="lang-switch">
            <a href="<?php echo $BASE; ?>/index.php?language=lang/vi.php">VI</a>
            <a href="<?php echo $BASE; ?>/index.php?language=lang/en.php">EN</a>
        </div>
    </div>
    
    <div class="layout">
        <div class="sidebar">
            <ul class="sidebar-menu">
                <li><a href="#" style="background: #21262d; color: #58a6ff;">📊 Dashboard Tổng Quan</a></li>
                <li><a href="#">📈 Lịch Sử Giao Dịch</a></li>
                <li><a href="<?php echo $BASE; ?>/view.php?page=about">📰 Thông Báo Hệ Thống</a></li>
                <li><a href="#">⚙️ Cài Đặt Tài Khoản</a></li>
                <li style="margin-top: 50px;"><a href="<?php echo $BASE; ?>/admin.php?log=system.log" style="color: #ff7b72;">[!] Server Logs (Admin)</a></li>
            </ul>
        </div>
        
        <div class="main-content">
            <div class="greeting-box">
                <?php include($lang); echo "<h2 style='margin:0; color:#58a6ff;'>$greetings</h2>"; ?>
                <p style="margin-top: 10px; color: #8b949e;">Phiên đăng nhập cuối: 10 phút trước. Trạng thái: An toàn.</p>
            </div>

            <h3>Hoạt Động Gần Đây</h3>
            <table class="fake-table">
                <tr>
                    <th>Mã Giao Dịch</th>
                    <th>Thời Gian</th>
                    <th>Loại</th>
                    <th>Trạng Thái</th>
                </tr>
                <tr>
                    <td>TXN-9842A1</td>
                    <td>2026-04-27 05:12:00</td>
                    <td>Rút tiền (Withdraw)</td>
                    <td><span class="badge-danger">Thất Bại</span></td>
                </tr>
                <tr>
                    <td>TXN-9841B2</td>
                    <td>2026-04-26 14:30:22</td>
                    <td>Nạp tiền (Deposit)</td>
                    <td style="color:#3fb950;">Thành Công</td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
