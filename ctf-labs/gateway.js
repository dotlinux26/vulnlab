const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 7777;
const ROUTES_FILE = path.join(__dirname, 'lab-routes.json');

// Biến toàn cục lưu trữ danh sách các lab đang chạy
let activeProxies = {};

// 1. Hàm đọc cấu hình từ file JSON (An toàn, có xử lý lỗi)
function loadRoutes() {
    try {
        const rawData = fs.readFileSync(ROUTES_FILE, 'utf8');
        return JSON.parse(rawData);
    } catch (err) {
        console.error("[-] Lỗi khi đọc file lab-routes.json! Đang dùng cấu hình rỗng.", err.message);
        return {};
    }
}

// 2. Tải cấu hình lần đầu
activeProxies = loadRoutes();

// 3. MIDDLEWARE ĐIỀU HƯỚNG TRẠNG THÁI ĐỘNG (Phép màu ở đây)
app.use((req, res, next) => {
    // Tìm kiếm xem cái URL của người dùng (/jwt/login) nó match với cái Prefix nào (/jwt)
    const matchedPath = Object.keys(activeProxies).find(route => req.url.startsWith(route));

    if (matchedPath) {
        // NẾU TÌM THẤY: Tạo Proxy "bay" luôn (Tạo On-the-fly)
        const targetUrl = activeProxies[matchedPath];
        
        const dynamicProxy = createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: { [`^${matchedPath}`]: '' },
            ws: true,
            logLevel: 'silent' // Tắt log rác của thư viện
        });
        
        return dynamicProxy(req, res, next);
    } else {
        // NẾU KHÔNG THẤY LAB
        return res.status(404).send('Không tìm thấy bài Lab này (Hoặc cổng Gateway chưa được cấu hình).');
    }
});

// 4. THEO DÕI SỰ THAY ĐỔI CỦA FILE JSON (Hot Reload)
fs.watch(ROUTES_FILE, (eventType, filename) => {
    if (filename && eventType === 'change') {
        console.log(`[*] Cảnh báo: File ${filename} đã bị thay đổi!`);
        // Đọc lại file json và cập nhật bộ nhớ
        setTimeout(() => { // Dùng timeout nhỏ để tránh lỗi đọc file khi đang ghi
            const newRoutes = loadRoutes();
            activeProxies = newRoutes;
            console.log("[+] Đã cập nhật lại bảng định tuyến mới nhất:", activeProxies);
        }, 100); 
    }
});

app.listen(PORT, () => {
    console.log(`[+] Lab Gateway đang điều phối tại cổng ${PORT}. Luồng đi: vuln.ghedahaui.online/labs-env/jwt -> 7777 -> 7001 (Docker)`);
    console.log(`[+] Đang theo dõi sự thay đổi của file: ${ROUTES_FILE}`);
});
