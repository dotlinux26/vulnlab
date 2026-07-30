import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sanitizeHtml from 'sanitize-html';
import { User, initDb } from './src/db';
import cookieParser from 'cookie-parser';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import { PayOS } from '@payos/node'; 
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import path from 'path';
import cors from 'cors';

// PHẢI GỌI config() NGAY ĐẦU TIÊN
dotenv.config(); 

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Mỗi IP chỉ được tạo 10 đơn hàng/15p
  message: { success: false, message: "Bạn tạo đơn quá nhanh, vui lòng đợi!" }
});

const app = express();
app.set('trust proxy', 1); // THÊM DÒNG NÀY ĐỂ FIX LỖI PM2 LOG
app.use(cors({
    origin: process.env.DOMAIN || "https://vuln.ghedahaui.online",
    credentials: true
}));

app.use(cookieParser());
app.use(express.json()); // Bắt buộc phải có

// ==========================================
// 1. KHỞI TẠO PAYOS (Dùng tên biến: payos)
// ==========================================
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.DOMAIN || "https://vuln.ghedahaui.online",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const JWT_SECRET = process.env.JWT_SECRET || "";

const PORT = 6668;
const lastChatTime = new Map<string, number>();
const db = new sqlite3.Database('./chat.sqlite');

// Hàm lưu log (Sửa lại cột cho chuẩn với database)
function savePaymentLog(orderCode: string, userId: string, amount: number, status: string, description: string) {
  db.run(`INSERT INTO PaymentLogs (orderCode, userId, amount, status, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
    [String(orderCode), userId, amount, status, description, Date.now()]);
}

function validateUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? url : "";
  } catch {
    return "";
  }
}

// ==========================================
// 2. KHỞI TẠO BẢNG
// ==========================================
async function startChatServer() {
  try { await initDb(); } catch (e) { console.error("[!] initDb error (non-fatal):", e); }
  db.run(`CREATE TABLE IF NOT EXISTS GlobalChat (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, userName TEXT, userAvatar TEXT, content TEXT, time TEXT, timestamp INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS PaymentLogs (id INTEGER PRIMARY KEY AUTOINCREMENT, orderCode TEXT, userId TEXT, amount INTEGER, status TEXT, description TEXT, timestamp INTEGER)`);

  io.use((socket, next) => {
	    // Lấy token từ nhiều nguồn: handshake.auth hoặc cookie
	    const cookie = socket.handshake.headers?.cookie || '';
	    const match = cookie.match(/(?:^|;\s*)session_token=([^;]+)/);
	    const token = socket.handshake.auth?.token || (match ? match[1] : null);
	    
	    if (!token) {
	        return next(new Error("Authentication error: No token provided"));
	    }

	    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
	        if (err) return next(new Error("Authentication error: Invalid token"));
	        (socket as any).user = decoded;
	        next();
	    });
	});

  io.on("connection", (socket) => {
    console.log("[+] New connection:", socket.id);
    db.all(`SELECT * FROM GlobalChat ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
      if (!err && rows) socket.emit("load_history", rows.reverse());
    });
    // ... logic chat cũ giữ nguyên ...
    socket.on("send_message", async (data) => {
	  try {
	    const userId = (socket as any).user.id;

            const dbUser = await User.findByPk(userId);
            if (!dbUser) return;
	    const { content } = data;

	    if (typeof content !== "string") return;

	    const now = Date.now();
	    const lastTime = lastChatTime.get(userId) || 0;

	    if (now - lastTime < 3000) {
	      socket.emit("error_msg", "Spam ít thôi sếp ơi! Đợi 3s nhé.");
	      return;
	    }

	    lastChatTime.set(userId, now);

	    let cleanContent = sanitizeHtml(content, {
	      allowedTags: [],
	      allowedAttributes: {}
	    }).trim();
	    if (!cleanContent) return;

	    // Bước 2: Link hóa một cách an toàn (Dùng encodeURI để chặn phá thẻ <a>)
	    const urlRegex = /(https?:\/\/[^\s"']+)/g; // Thêm " và ' vào blacklist của regex
	    cleanContent = cleanContent.replace(urlRegex, (url) => {
	        const safeUrl = encodeURI(url); // Mã hóa các ký tự nguy hiểm trong URL
	        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${safeUrl}</a>`;
	    });

          const msgObject = {
            userId: userId,
            userName: sanitizeHtml(dbUser.name, {
		  allowedTags: [],
		  allowedAttributes: {}
		}),
	    userAvatar: validateUrl(dbUser.picture),
            content: cleanContent,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: now
          };
          db.run(`INSERT INTO GlobalChat (userId, userName, userAvatar, content, time, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
            [msgObject.userId, msgObject.userName, msgObject.userAvatar, msgObject.content, msgObject.time, msgObject.timestamp],
            function(err) {
              if (!err) io.emit("receive_message", { id: this.lastID, ...msgObject });
            });
        } catch (err) { console.error("[-] Chat Error:", err); }
      });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 CHAT & PAYMENT SERVER đang bay ở port ${PORT}`);
  });
}

// ==========================================
// 3. API TẠO QR (Gửi mỗi UserId vào description)
// ==========================================
app.post('/api/payment/create', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "Thiếu UserId" });

    const orderCode = Number(String(Date.now()).slice(-6));
    const paymentData = {
      orderCode: orderCode,
      amount: 100000, // Đang để 2k test
      description: `${userId}`, // CHỈ ĐỂ ID, KHÔNG THÊM CHỮ NÀO KHÁC (MAX 25 KÝ TỰ)
      cancelUrl: `${process.env.DOMAIN}/subscription`,
      returnUrl: `${process.env.DOMAIN}/subscription`,
    };

    const paymentLink = await payos.paymentRequests.create(paymentData);
    console.log(`[PAYMENT] Đã tạo đơn ${orderCode} cho User: ${userId}`);
    res.json({ success: true, data: { orderCode, checkoutUrl: paymentLink.checkoutUrl } });
  } catch (error: any) {
    console.error("[-] Lỗi tạo QR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. WEBHOOK HỨNG TIỀN (Update database.sqlite)
// ==========================================
app.post('/api/payment/webhook', async (req: Request, res: Response) => {
  console.log(">>> NHẬN WEBHOOK GỐC:", JSON.stringify(req.body));
  
  try {
    const webhookBody = req.body;
        
        // PayOS verify sẽ throw error nếu chữ ký sai
    const verifiedData = payos.webhooks.verify(webhookBody); 
        
    const orderCode = String(verifiedData.data.orderCode);
        const userId = String(verifiedData.data.description);
        const amount = verifiedData.data.amount;

    if (verifiedData.data.code === '00') {
      
      // 🛑 CHỐNG NHÂN ĐÔI: Check trong PaymentLogs xem orderCode này đã SUCCESS chưa
      // Dùng SQL thuần vì db đang trỏ vào chat.sqlite
      const isAlreadyProcessed: any = await new Promise((resolve) => {
        db.get(`SELECT id FROM PaymentLogs WHERE orderCode = ? AND status = 'SUCCESS'`, [orderCode], (err, row) => {
          if (err) resolve(null);
          resolve(row);
        });
      });

      if (isAlreadyProcessed) {
        console.log(`[!] Đơn ${orderCode} này sếp đã cộng tiền rồi, không chơi hack nhé!`);
        return res.status(200).send('OK');
      }

      console.log(`[TING TING] Khớp lệnh: User ${userId} nạp ${amount} VNĐ`);

      // 3. Cập nhật database.sqlite (Sequelize)
      const userRecord: any = await User.findByPk(userId);
      
      if (userRecord) {
        const oldVoucher = userRecord.voucherXp || 0;
        userRecord.voucherXp = oldVoucher + 2; 
        await userRecord.save(); 

        console.log(`[DB SUCCESS] ${userRecord.name}: ${oldVoucher} -> ${userRecord.voucherXp} Voucher`);
        
        // 4. GHI LOG VÀO chat.sqlite LÀM BẰNG CHỨNG
        db.run(`INSERT INTO PaymentLogs (orderCode, userId, amount, status, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
          [orderCode, userId, amount, "SUCCESS", "Đã nạp 2 Voucher", Date.now()]);

        // 5. Báo Realtime
        io.emit("payment_success", { userId, orderCode, message: "Voucher đã bay vào túi!" });
      } else {
        console.error(`[!!!] LỖI: Không tìm thấy User ID ${userId} trong DB!`);
        db.run(`INSERT INTO PaymentLogs (orderCode, userId, amount, status, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
          [orderCode, userId, amount, "USER_NOT_FOUND", `ID ${userId} không khớp`, Date.now()]);
      }
      
      return res.status(200).send('OK');
    }
  } catch (error: any) {
    console.error("[-] Lỗi Webhook:", error.message);
    return res.status(400).send('Invalid webhook');
  }
});

startChatServer().catch(console.error);
