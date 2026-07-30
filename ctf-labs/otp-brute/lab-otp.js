const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const BASE_URL = '/labs-env/otp';

app.use(bodyParser.urlencoded({ extended: true }));

const styleUI = `
<style>
    body { background-color: #050505; color: #33ff33; font-family: 'Consolas', monospace; text-align: center; margin-top: 50px; }
    .container { border: 1px solid #33ff33; padding: 30px; width: 450px; margin: 0 auto; box-shadow: 0 0 20px rgba(51, 255, 51, 0.2); background: #0a0a0a; position: relative;}
    .container::before { content: "TOP SECRET"; position: absolute; top: -10px; left: 20px; background: #050505; padding: 0 10px; font-size: 12px;}
    input { width: 90%; padding: 12px; margin: 10px 0; background: #000; border: 1px solid #33ff33; color: #33ff33; outline: none; text-align: center; font-size: 16px; letter-spacing: 2px;}
    button { background: #33ff33; color: #000; border: none; padding: 12px 20px; font-weight: bold; cursor: pointer; width: 96%; margin-top: 15px; font-size: 16px; transition: 0.2s;}
    button:hover { background: #fff; box-shadow: 0 0 15px #fff; }
    h2 { color: #fff; letter-spacing: 1px; text-transform: uppercase;}
    .error { color: #ff003c; text-shadow: 0 0 8px #ff003c; border-bottom: 1px solid #ff003c; padding-bottom: 10px;}
    .success { color: #ffcc00; text-shadow: 0 0 10px #ffcc00; font-size: 22px; }
    a { color: #33ff33; text-decoration: none; border-bottom: 1px dashed #33ff33; }
    a:hover { color: #fff; border-bottom: 1px solid #fff; }
    .hidden-hint { display: none; }
</style>
`;

// =====================================
// 1. TRANG CHỦ & TRICK LỎ TÌM ENDPOINT
// =====================================
app.get('/', (req, res) => {
    res.send(`
        ${styleUI}
        <div class="container">
            <h2>Ghedahaui Main Gate</h2>
            <p>Hệ thống đang khóa.</p>
             <!-- ..thử nghiệm  /verify-v2-beta :)) -->
            <form action="${BASE_URL}/login" method="POST">
                <input type="text" name="username" placeholder="Username" disabled value="guest">
                <input type="password" name="password" placeholder="Password" disabled value="*******">
                <button type="submit" disabled>LOGIN BLOCKED</button>
            </form>
            <br><br>
            <p style="font-size: 14px;">Khôi phục quyền truy cập? <a href="${BASE_URL}/reset?user=guest">Cấp lại mã PIN</a></p>
        </div>
        `);
});

// =====================================
// 2. ẢI GET: THAO TÚNG URL
// =====================================
app.get('/reset', (req, res) => {
    const user = req.query.user;
    if (!user) return res.send(`${styleUI}<div class="container"><h2 class="error">LỖI THAM SỐ</h2><p>Thiếu parameter 'user'</p></div>`);

    if (user === 'admin') {
        res.send(`
            ${styleUI}
            <div class="container">
                <h2 style="color: #00ffff">SYSTEM OVERRIDE</h2>
                <p>Cảnh báo: Đã gửi mã PIN <b>4 CHỮ SỐ</b> vào thiết bị cá nhân của ADMIN.</p>
                <a href="${BASE_URL}/verify"><button>MỞ CỔNG XÁC THỰC</button></a>
            </div>
        `);
    } else {
        res.send(`
            ${styleUI}
            <div class="container">
                <h2 class="error">QUYỀN HẠN THẤP</h2>
                <p>Mã PIN đã gửi cho: <b>${user}</b>.</p>
                <p>Lưu ý: User '${user}' không có quyền truy xuất dữ liệu mật.</p>
                <a href="${BASE_URL}/"><button>QUAY LẠI</button></a>
            </div>
        `);
    }
});

// =====================================
// 3. ẢI POST 1: BRUTE-FORCE 4 SỐ (V1)
// =====================================
const OTP_V1 = "4092"; 

app.get('/verify', (req, res) => {
    res.send(`
        ${styleUI}
        <div class="container">
            <h2>Xác Thực Cơ Bản (V1)</h2>
            <form action="${BASE_URL}/verify" method="POST">
                <input type="hidden" name="username" value="admin">
                <input type="text" name="otp" placeholder="Nhập PIN (4 số)" required pattern="[0-9]{4}">
                <button type="submit">KIỂM TRA</button>
            </form>
        </div>
    `);
});

app.post('/verify', (req, res) => {
    const { username, otp } = req.body;
    if (username === 'admin' && otp === OTP_V1) {
        res.send(`
            ${styleUI}
            <div class="container">
                <h2 class="success">ACCESS LEVEL 1 GRANTED</h2>
                <p>Bạn đã bẻ khóa thành công hệ thống V1.</p>
                <p style="font-size: 20px; font-weight: bold; border: 1px solid #ffcc00; padding: 10px;">FLAG part 1: {Brut3_F0rc3</p>
                <br>
                <p style="color: #666; font-size: 12px;">Hệ thống lõi (V2) đòi hỏi bảo mật cao hơn.</p>
            </div>
        `);
    } else {
        res.send(`${styleUI}<div class="container"><h2 class="error">SAI MÃ PIN</h2><a href="${BASE_URL}/verify"><button>THỬ LẠI</button></a></div>`);
    }
});

// =====================================
// 4. ẢI POST 2: ENDPOINT ẨN & BRUTE 6 SỐ (V2)
// =====================================
const OTP_V2 = "087415"; // Phải dùng tool chạy cho nhanh

app.get('/verify-v2-beta', (req, res) => {
    res.send(`
        ${styleUI}
        <div class="container" style="border-color: #ff00ff; box-shadow: 0 0 20px rgba(255, 0, 255, 0.2);">
            <h2 style="color: #ff00ff">Xác Thực Lõi (V2-BETA)</h2>
            <p>Hệ thống đang thử nghiệm chuẩn bảo mật mới.</p>
            <form action="${BASE_URL}/verify-v2-beta" method="POST">
                <input type="hidden" name="username" value="admin">
                <input type="text" name="otp" placeholder="Nhập PIN BẢO MẬT (6 số)" required pattern="[0-9]{6}">
                <button type="submit" style="background: #ff00ff; color: #fff;">XUYÊN THỦNG</button>
            </form>
        </div>
    `);
});

app.post('/verify-v2-beta', (req, res) => {
    const { username, otp } = req.body;
    if (username === 'admin' && otp === OTP_V2) {
        res.send(`
            ${styleUI}
            <div class="container" style="border-color: #ffcc00;">
                <h2 class="success">SYSTEM COMPROMISED</h2>
                <p>Sức mạnh bạo lực đã chiến thắng. Bạn đã phá sập hoàn toàn hệ thống 6 số.</p>
                <p style="font-size: 20px; font-weight: bold; border: 1px solid #ffcc00; padding: 10px;">FLAG part 2: _1s_N0t_D34d}</p>
            </div>
        `);
    } else {
        // Trả về lỗi tĩnh lược để tool chạy nhanh hơn
        res.status(403).send("INVALID_PIN");
    }
});

app.listen(port, () => {
    console.log(`[+] Lab OTP Brute-force Hardcore đang chạy tại cổng ${port}`);
});
