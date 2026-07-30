const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Thêm vũ khí đọc Cookie

const app = express();
const port = 3000;
const SECRET_KEY = 'welcome'; 

app.use(express.json());
app.use(cookieParser()); // Kích hoạt vũ khí

// ==========================================
// API 0: Lấy Token (Tự động lưu vào Cookie)
// ==========================================
app.get('/login', (req, res) => {
    const token = jwt.sign({ username: 'juna_student', role: 'guest' }, SECRET_KEY);
    
    // Tự động nhét Token vào Cookie của trình duyệt (Tên cookie là 'auth_token')
    // httpOnly: false để học viên có thể dùng F12 sửa cookie dễ dàng
    res.cookie('auth_token', token, { httpOnly: false, maxAge: 86400000 }); 
    
    res.json({ 
        message: '[START] Đã cấp quyền Guest. Token đã được lén lút nhét vào Cookie của bạn!', 
        token: token 
    });
});

// ==========================================
// STAGE 1 & STAGE 2: Kiểm tra qua Cookie
// ==========================================
app.get('/student', (req, res) => {
    // 💡 LẤY TOKEN TỪ COOKIE THAY VÌ HEADER
    const token = req.cookies.auth_token;
    
    if (!token) return res.status(401).send('Ê, Cookie trống trơn! Vào /login để lấy Cookie đi đã!');

    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) return res.status(400).send('Token sai định dạng!');

    let payload = decodedToken.payload;

    if (decodedToken.header.alg.toLowerCase() === 'none') {
        // Bỏ qua verify
    } else {
        try {
            payload = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return res.status(403).send('Lỗi: Chữ ký không hợp lệ! Nghĩ mình lừa được ai?');
        }
    }

    if (payload.role === 'student') {
        res.send('🔓 STAGE 1 CLEAR! Bypass Alg:none thành công. FLAG part 1/2 LÀ: {Alg_N0n3');
    } else {
        res.send(`Quyền của bạn là '${payload.role}'. Lối này chỉ dành cho 'student'.`);
    }
});

app.get('/admin', (req, res) => {
    // 💡 LẤY TOKEN TỪ COOKIE THAY VÌ HEADER
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).send('Ê, Cookie đâu?');

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send('🛑 BỊ CHẶN! Hàm verify chuẩn đã tóm được bạn. Không dùng trò alg:none ở đây được đâu! Bắt buộc phải có Chữ ký đúng!');
        }

        if (decoded.role === 'admin') {
            res.send('🔓 STAGE 2 CLEAR! Bạn đã Crack được Secret Key! FLAG part 2/2 LÀ: _cR4ck_g0d}');
        } else {
            res.send(`Quyền của bạn là '${decoded.role}'. Khu vực này chỉ dành cho 'admin'.`);
        }
    });
});

app.listen(port, () => {
    console.log(`[+] Lab 2-Stage JWT (Cookie Edition) đang chạy tại http://localhost:${port}`);
});
