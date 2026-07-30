const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT)");
});

// Người dùng gửi ticket
app.post('/api/submit-ticket', (req, res) => {
    const { name, email, message } = req.body;
    db.run("INSERT INTO tickets (name, email, message) VALUES (?, ?, ?)", [name, email, message], () => {
        res.json({ success: true, msg: "Ticket đã được gửi! Phán Quan sẽ xem xét trong giây lát." });
    });
});

// Admin Panel (Lỗ hổng Stored XSS)
app.get('/phanquan/dashboard', (req, res) => {
    db.all("SELECT * FROM tickets", [], (err, rows) => {
        let ticketRows = rows.map(row => `
            <div class="ticket-card">
                <div class="ticket-header">Ticket #${row.id} | Từ: ${row.name} (${row.email})</div>
                <div class="ticket-body">${row.message}</div> <!-- 🚨 CHẾT Ở ĐÂY: Render trực tiếp -->
            </div>
        `).join('');

        res.send(`
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { background: #050a15; color: #f1f5f9; font-family: sans-serif; padding: 20px; }
                    .ticket-card { background: #0f172a; border: 1px solid #1e293b; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
                    .ticket-header { color: #00f3ff; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #334155; padding-bottom: 5px; }
                    .ticket-body { color: #cbd5e1; line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>⚖️ BẢNG ĐIỀU KHIỂN CỦA PHÁN QUAN</h1>
                <p>Chào mừng Ngài, các báo cáo vi phạm đang chờ Ngài phê duyệt.</p>
                <div id="tickets">${ticketRows}</div>
            </body>
            </html>
        `);
    });
});

// Kiểm tra Flag
app.post('/api/verify-flag', (req, res) => {
    if (req.body.flag === "VULN{XSS_St34l_C00ki3_&_LS_2026}") {
        return res.json({ success: true, msg: "Tuyệt vời! Bạn đã có mật chỉ!" });
    }
    res.json({ success: false, msg: "Sai rồi anh bạn!" });
});

app.listen(3000, '0.0.0.0', () => console.log("Lab XSS Ready on Port 3000"));
