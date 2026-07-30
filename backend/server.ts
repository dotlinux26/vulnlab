import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import { initDb, User, Lab, Submission, Certificate, Lesson } from './src/db';
import crypto from 'crypto'; // Dùng để gen mã Hash
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 6667;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ADMIN_EMAIL = '0206canh@gmail.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET khong hop le');
  process.exit(1);
}
const CERT_SALT = process.env.CERT_SALT || 'default_salt_if_missing';

const tokenBlocklist = new Set<string>();

const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});


interface AuthenticatedRequest extends Request {
    user?: any;
}

const getRank = (level: number): string => {
    if (level > 10) return 'Elite Hacker';
    if (level > 9) return 'Legendary Hacker';
    if (level > 8) return 'Master Hacker';
    if (level > 7) return 'Senior Hacker';
    if (level > 6) return 'Advanced Hacker';
    if (level > 5) return 'Intermediate Hacker';
    if (level > 4) return 'Junior Hacker';
    if (level > 3) return 'Apprentice';
    if (level > 2) return 'Beginner';
    if (level > 1) return 'Script Kiddie';
    return 'Novice';
};

// ✅ FIX: Dùng __dirname để lấy path tương đối từ thư mục server.ts
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const userReq = req as AuthenticatedRequest;
        cb(null, `user_${userReq.user?.id}_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const DANGEROUS_EXTS = ['.php', '.phtml', '.sh', '.js', '.exe', '.bat', '.py', '.jar'];
        const filename = file.originalname.toLowerCase();
        
        // 1. Chặn đứng các file có chứa đuôi nguy hiểm ở bất cứ đâu (ví dụ shell.php.rar)
        if (DANGEROUS_EXTS.some(ext => filename.includes(ext))) {
            return cb(new Error('File co chua ky tu hoac duoi mo rong nguy hiem!'));
        }

        // 2. Chỉ cho phép các MimeType an toàn
        const allowedTypes = [
            'application/pdf', 
            'application/zip', 
            'application/x-zip-compressed', 
            'application/x-rar-compressed', 
            'application/vnd.rar',
            'application/octet-stream' // Cần thiết cho một số file RAR/ZIP
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Dinh dang file khong hop le!'));
        }
    }
});

async function startServer() {
    await initDb();

    // 1. Sử dụng Helmet để bảo mật header tổng thể
	app.use(helmet({
	  crossOriginResourcePolicy: { policy: "cross-origin" },
	  contentSecurityPolicy: false, // Bạn đã tự cấu hình CSP bên dưới nên có thể tắt cái mặc định của helmet
	}));

	// 2. Tạo limiter riêng cho việc nộp Flag/Bài thi (Chống Brute-force)
	const submitLimiter = rateLimit({
	  windowMs: 1 * 60 * 1000, // 1 phút
	  max: 5, // Chỉ cho phép nộp 5 lần/phút
	  message: { success: false, message: "Bạn nộp quá nhanh, vui lòng đợi 1 phút!" }
	});

	// 3. Fix Header bảo mật
	app.use((_req, res, next) => {
	  res.setHeader('X-Content-Type-Options', 'nosniff');
	  res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // THAY CHO ALLOWALL
	  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://vuln.ghedahaui.online");
	  next();
	});

    app.use(cors({
        origin: 'https://vuln.ghedahaui.online',
        credentials: true,
    }));

    app.use(express.json());
    app.use(cookieParser());

    app.use('/uploads', (req, res, next) => {
	    res.header('Access-Control-Allow-Origin', 'https://vuln.ghedahaui.online');
	    res.header('Access-Control-Allow-Credentials', 'true');
	    next();
	}, express.static(uploadDir));


    const publicPath = path.resolve(__dirname, 'public');
    app.use(express.static(publicPath));

    app.get('/test-lab', (req, res) => {
        res.sendFile(path.join(publicPath, 'labs/ffuftest.html'));
    });

    const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	    const sessionToken = req.cookies.session_token;
	    if (!sessionToken) {
	        return res.status(401).json({ error: 'Unauthorized' });
	    }
	    
	    try {
	        // GIẢI MÃ & KIỂM TRA ISSUER
	        const decoded: any = jwt.verify(sessionToken, JWT_SECRET, {
	            algorithms: ['HS256'],
	            issuer: 'vuln.ghedahaui.online' // Bắt buộc Token phải do đúng nhà mình cấp
	        });

	        // 🛑 BƯỚC CHẶN CHÍ MẠNG: Kiểm tra xem Token này đã bị Logout chưa
	        if (decoded.jti && tokenBlocklist.has(decoded.jti)) {
	            console.log(`[!] Bắt quả tang dùng token đã bị revoke (jti: ${decoded.jti})`);
	            return res.status(401).json({ error: 'Token has been revoked' });
	        }

	        const user = await User.findByPk(decoded.id);
	        if (!user) {
	            return res.status(401).json({ error: 'Unauthorized' });
	        }
	        
	        req.user = user;
	        next();
	    } catch (error) {
	        // Ném cổ mấy thằng giả mạo Cookie ra ngoài
	        console.error("[-] Bắt quả tang Cookie fake:", error);
	        return res.status(401).json({ error: 'Invalid Token' });
	    }
	};

    const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Forbidden: Bạn không phải là Admin!' });
        }
    };

    app.post('/api/auth/verify', authLimiter, async (req: Request, res: Response) => {
        try {
            const { token } = req.body;
            if (!token) return res.status(400).json({ success: false, message: 'Missing token' });
	    
            

            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload: any = await response.json();
            if (!payload || payload.error || !payload.email) {
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }

            const email = payload.email.toLowerCase();
            const userId = payload.sub;
            let user = await User.findByPk(userId);
            
            if (!user) {
		    user = await User.create({
		        id: userId,
		        email,
		        name: payload.name || email.split('@')[0],
		        picture: payload.picture || '',
		        role: 'student', // BẤT CỨ AI ĐĂNG KÝ MỚI ĐỀU LÀ STUDENT
		        joinDate: new Date().toISOString().split('T')[0],
		        xp: 0,
		        voucherXp: 0,
		        level: 1,
		        rank: 'Novice',
		    });
		}

		// BƯỚC BẢO VỆ KÉP: Kể cả có là user cũ, nếu là mail admin thì mới ép quyền (để phòng nó sửa database đổi role)
		if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
		    user.role = 'admin';
		    await user.save();
		}

            // THAY VÌ LƯU THẲNG user.id, TA BỌC NÓ VÀO JWT
		const tokenPayload = {
		  id: user.id,
		  role: user.role,
		  name: user.name,        // ✅ thêm
		  picture: user.picture,  // ✅ thêm (QUAN TRỌNG)
		  jti: uuidv4(),
		  iss: 'vuln.ghedahaui.online'
		}

		const signedToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' }); // Sống 7 ngày		

		res.cookie('session_token', signedToken, { 
		    httpOnly: true, 
		    secure: true, 
		    sameSite: 'none', 
		    maxAge: 7 * 24 * 60 * 60 * 1000 
		});
            return res.json({ success: true, user });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Đổi _req thành req để có thể đọc cookie
	app.post('/api/auth/logout', (req: Request, res: Response) => {
	    const sessionToken = req.cookies.session_token;
	    
	    // Nếu có token gửi lên, đưa nó vào "Danh sách đen"
	    if (sessionToken) {
	        try {
	            // Chỉ decode để lấy jti (không cần verify hạn nữa vì đằng nào cũng vứt)
	            const decoded = jwt.decode(sessionToken) as any;
	            if (decoded && decoded.jti) {
	                tokenBlocklist.add(decoded.jti);
	                console.log(`[AUTH] Đã thu hồi Token (jti: ${decoded.jti}) của User: ${decoded.id}`);
	            }
	        } catch (e) {
	            console.error("[-] Lỗi khi revoke token:", e);
	        }
	    }

	    res.clearCookie('session_token', { httpOnly: true, secure: true, sameSite: 'none' });
	    res.json({ success: true, message: 'Đăng xuất và thu hồi phiên thành công.' });
	});

    app.get('/api/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
        res.json(req.user);
    });

    // 1. CẬP NHẬT API PROFILE (Lọc Exam đã Pass thành Certificate)
app.get('/api/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        const submissions = await Submission.findAll({ where: { userId: user.id }, include: [Lab] });
        const totalLabs = await Lab.count({ where: { isExam: false } });

        const solvedLabs = submissions
            .filter((s: any) => s.lab && !s.lab.isExam && s.status === 'solved')
            .map((s: any) => s.toJSON().lab);

        // ✅ LẤY TRỰC TIẾP TỪ BẢNG CERTIFICATE MỚI TẠO (Không tự băm nữa)
        const certs = await Certificate.findAll({
            where: { userId: user.id },
            include: [{ model: Lab, attributes: ['title'] }]
        });

        // Xử lý dữ liệu trả về cho Frontend
        const certificatesData = certs.map((c: any) => ({
            id: c.examId,
            title: c.lab?.title || 'Unknown Certificate',
            hash: c.hash, // LẤY ĐÚNG CÁI HASH TRONG DATABASE
            issueDate: c.issueDate
        }));

        const skills: Record<string, number> = { Web: 0, Crypto: 0, Pwn: 0, Forensics: 0, Reverse: 0, OSINT: 0, Network: 0 };
        solvedLabs.forEach((lab: any) => {
            if (skills[lab.category] !== undefined) skills[lab.category] += lab.points;
            else skills[lab.category] = lab.points;
        });

        res.json({
            ...user.toJSON(),
            solvedLabsCount: solvedLabs.length,
            totalLabs,
            history: solvedLabs,
            skills,
            certificates: certificatesData // Gắn mảng cert chuẩn vào đây
        });
    } catch (error) {
        console.error("Lỗi lấy Profile:", error);
        res.status(500).json({ success: false });
    }
});

app.get('/api/verify/:hash', async (req: Request, res: Response) => {
    try {
        const cert: any = await Certificate.findOne({ 
            where: { hash: req.params.hash },
            include: [
                { model: User, attributes: ['name', 'picture', 'email'] },
                { model: Lab, attributes: ['title', 'category', 'difficulty'] },
                { model: Submission, attributes: ['status', 'createdAt'] }
            ]
        });
        
        if (!cert) {
            return res.status(404).json({ success: false, message: 'Mã định danh không tồn tại trên hệ thống.' });
        }
        
        // Cần check lại xem nhỡ bài thi bị admin chuyển về failed nhưng quên xóa cert
        if (cert.submission?.status !== 'passed') {
            return res.status(400).json({ success: false, message: 'Chứng chỉ này đang bị tạm khóa hoặc thu hồi.' });
        }
        
        // Trả đúng object có bọc key "cert" để Frontend dễ parse
        res.json({ 
            success: true, 
            cert: {
                hash: cert.hash,
                signedName: cert.signedName || cert.user?.name,
                title: cert.lab?.title,
                type: cert.type === 'badge' ? 'BADGE' : 'CERTIFICATION',
                issueDate: cert.issueDate,
                fileUrl: cert.fileUrl
            } 
        });
    } catch (error) {
        console.error('❌ Lỗi Verify Cert:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi truy xuất dữ liệu.' });
    }
});

    app.get('/api/stats', async (_req, res) => {
        try {
            const totalLabs = await Lab.count({ where: { isExam: false } });
            const totalUsers = await User.count();
            const allLabs: any = await Lab.findAll({ where: { isExam: false } });
            const uniqueCategories = new Set(allLabs.map((l: any) => l.category)).size;
            
            res.json({ success: true, labs: totalLabs, users: totalUsers, categories: uniqueCategories || 6 });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    });

    app.get('/api/labs', authenticate, async (req: AuthenticatedRequest, res: Response) => {
	    try {
	        // ✅ FIX: Ép mảng attributes, TUYỆT ĐỐI không lấy 'flag', 'description', 'contentUrl'
	        const labs = await Lab.findAll({ 
	            where: { isExam: false },
	            attributes: ['id', 'title', 'category', 'difficulty', 'points', 'solves'] 
	        });
	        
	        const submissions = await Submission.findAll({ where: { userId: req.user.id } });
	        const solvedLabIds = new Set(submissions.map((s: any) => s.labId));
	        
	        const labsWithStatus = labs.map((lab: any) => ({
	            ...lab.toJSON(),
	            status: solvedLabIds.has(lab.id) ? 'solved' : 'unsolved',
	        }));
	        
	        res.json(labsWithStatus);
	    } catch (error) {
	        res.status(500).json({ error: 'Lỗi tải Lab' });
	    }
	});
    app.get('/api/labs/:id', authenticate, async (req: Request, res: Response) => {
	    try {
	        // ✅ FIX: Dùng thuộc tính exclude để chặn trường 'flag' bị lộ ra ngoài
	        const lab = await Lab.findByPk(req.params.id, {
	            attributes: { exclude: ['flag'] }
	        });
	        
	        if (!lab) return res.status(404).json({ error: 'Lab not found' });
	        res.json(lab);
	    } catch (error) {
	        res.status(500).json({ error: 'Lỗi server' });
	    }
	});

    app.post('/api/labs/:id/submit', authenticate, submitLimiter, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { flag } = req.body;
            const lab: any = await Lab.findByPk(req.params.id);
            if (!lab) return res.status(404).json({ error: 'Lab not found' });

            if (flag === lab.flag) {
                const [submission, created] = await Submission.findOrCreate({
                    where: { userId: req.user.id, labId: lab.id },
                    defaults: { status: 'solved' },
                });

                if (created) {
                    const user = req.user;
                    user.xp += lab.points;
                    user.level = Math.floor(user.xp / 1000) + 1;
                    user.rank = getRank(user.level);
                    await user.save();
                    lab.solves += 1;
                    await lab.save();
                }
                return res.json({ success: true, message: 'Correct flag!' });
            }
            return res.json({ success: false, message: 'Incorrect flag' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Lỗi nộp flag' });
        }
    });

    app.get('/api/exams', authenticate, async (req: AuthenticatedRequest, res: Response) => {
	    try {
	        const exams = await Lab.findAll({ 
	            where: { isExam: true },
	            // CHỈ LẤY CÁC TRƯỜNG CÔNG KHAI, KHÔNG LẤY FLAG, KHÔNG LẤY DESCRIPTION (TẠM THỜI)
	            attributes: ['id', 'title', 'category', 'difficulty', 'price', 'duration','contentUrl']
	        });
	        
	        const submissions = await Submission.findAll({ where: { userId: req.user.id } });
	        const unlockedExamIds = new Set(
	            submissions
	                .filter((s: any) => ['unlocked', 'taking', 'pending', 'passed', 'failed'].includes(s.status))
	                .map((s: any) => s.labId)
	        );

	        const examsData = await Promise.all(exams.map(async (exam: any) => {
	            const userSubmission = submissions.find((s: any) => s.labId === exam.id);
	            const isUnlocked = unlockedExamIds.has(exam.id);
	            
	            // NẾU ĐÃ MỞ KHÓA, MỚI QUERY LẤY THÊM DESCRIPTION VÀ CONTENT_URL
	            let secureContent = '';
	            let secureUrl = '';
	            if (isUnlocked) {
	                const fullExam: any = await Lab.findByPk(exam.id, { attributes: ['description', 'downloadUrl'] });
	                if (fullExam) {
	                    secureContent = fullExam.description;
	                    secureUrl = fullExam.downloadUrl;
	                }
	            }

	            return {
	                id: exam.id,
	                title: exam.title,
	                category: exam.category,
	                difficulty: exam.difficulty,
	                price: exam.price || 0,
	                duration: (exam.duration || 60) * 60,
	                isUnlocked: isUnlocked,
	                status: userSubmission?.status || 'locked',
	                // NẾU CHƯA MỞ KHÓA THÌ TRẢ VỀ RỖNG ĐỂ CHỐNG LỘ ĐỀ
	                content: secureContent,
                        contentUrl: exam.contentUrl,
	                downloadUrl: secureUrl
	            };
	        }));

	        res.json({ success: true, exams: examsData, submissions });
	    } catch (error) {
	        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách Exam.' });
	    }
	});

    // API Mở khóa (Chỉ trừ tiền, trạng thái 'unlocked')
    app.post('/api/exams/:id/unlock', authenticate, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const examId = req.params.id;
            const user: any = await User.findByPk(req.user.id);
            const exam: any = await Lab.findOne({ where: { id: examId, isExam: true } });

            if (!exam) return res.status(404).json({ success: false, message: 'Không tìm thấy bài thi!' });

            const existingSub = await Submission.findOne({ where: { userId: user.id, labId: examId } });
            if (existingSub) return res.status(400).json({ success: false, message: 'Bạn đã mở khóa bài thi này rồi!' });

            const price = exam.price || 0;
            const currentVoucher = user.voucherXp || 0;
            
            if (currentVoucher < price) return res.status(400).json({ success: false, message: `Cần ${price} Voucher.` });

            user.voucherXp = currentVoucher - price;
            await user.save();

            await Submission.create({
                userId: user.id, labId: exam.id, status: 'unlocked', flags: '', fileUrl: ''
            });

            res.json({ success: true, message: `Đã mở khóa! Trừ ${price} Voucher.`, remainingXP: user.voucherXp });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
        }
    });

    // 🎯 API MỚI: BẤM BẮT ĐẦU THI TRÊN SERVER (Khóa mốc thời gian)
    app.post('/api/exams/:id/start', authenticate, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const sub: any = await Submission.findOne({ where: { userId: req.user.id, labId: req.params.id } });
            if (!sub) return res.status(404).json({ success: false, message: 'Bạn chưa mở khóa bài thi này!' });
            
            if (sub.status === 'taking') return res.json({ success: true, startTime: sub.startTime }); // Nếu đang thi rồi thì trả về giờ cũ
            if (sub.status !== 'unlocked') return res.status(400).json({ success: false, message: 'Bài thi đã hoàn thành hoặc đang chờ chấm!' });

            sub.status = 'taking';
            sub.startTime = new Date();
            await sub.save();
            
            res.json({ success: true, startTime: sub.startTime });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server.' });
        }
    });

    // 🎯 CHỐNG HACK API SUBMIT: KIỂM TRA THỜI GIAN KHẮT KHE TRÊN SERVER
    app.post('/api/exams/submit', authenticate, submitLimiter, upload.single('report'), async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { examId, flags } = req.body;
            const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';

	            // ✅ VALIDATE INPUT
	    if (!examId || typeof examId !== 'string') {
	      return res.status(400).json({ success: false, message: '❌ examId bắt buộc và phải là chuỗi' });
	    }

	    const sub: any = await Submission.findOne({ where: { userId: req.user.id, labId: examId } });
	    const exam: any = await Lab.findByPk(examId);

	    // ✅ CHECK EXIST
	    if (!sub) {
	      return res.status(404).json({ success: false, message: '❌ Bạn chưa mở khóa bài thi này!' });
	    }
	    if (!exam) {
	      return res.status(404).json({ success: false, message: '❌ Bài thi không tồn tại!' });
	    }

	    // ✅ CHECK TRẠNG THÁI
	    if (sub.status !== 'taking') {
	      return res.status(400).json({ 
	        success: false, 
	        message: `❌ Chỉ được nộp khi đang làm bài! Trạng thái hiện tại: ${sub.status}` 
	      });
	    }

	    // ✅ CHECK STARTTIME TỒN TẠI
	    if (!sub.startTime) {
	      return res.status(400).json({ success: false, message: '❌ Thời gian bắt đầu không hợp lệ. Vui lòng bấm "Bắt đầu thi" lại!' });
	    }

            

            // KIỂM TRA THỜI GIAN TRÊN SERVER
            const now = new Date().getTime();
            const start = new Date(sub.startTime).getTime();
            const diffSeconds = (now - start) / 1000;
            const maxSecondsAllowed = (exam.duration * 60) + 30; // Cho thêm 30 giây mạng lag

            if (diffSeconds > maxSecondsAllowed) {
		    await sub.update({ status: 'failed', adminComment: 'Hệ thống tự động đánh TRƯỢT do nộp bài QUÁ THỜI GIAN quy định.' });
		    // Trả về 200 OK để Frontend không ném lỗi mạng, nhưng success = false để hiển thị thông báo
		    return res.status(200).json({ success: false, message: 'Đã hết hạn nộp bài! Bài thi bị đánh TRƯỢT.' });
		}

            if (!flags?.trim() && !req.file) {
	            return res.status(400).json({ success: false, message: '❌ Phải nhập Flag hoặc tải lên Report' });
	        }


            // HỢP LỆ -> CHO PENDING CHỜ CHẤM
            await sub.update({
                status: 'pending',
                flags: flags || '',
                fileUrl: fileUrl
            });

            res.json({ success: true, message: 'Nộp bài thành công! Vui lòng chờ Admin chấm điểm.' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message || 'Lỗi server khi nộp bài.' });
        }
    });

    // 🎯 API MỚI: THỬ SỨC LẠI (RESET TRẠNG THÁI FAILED VỀ LOCKED)
	app.post('/api/exams/:id/retry', authenticate, async (req: AuthenticatedRequest, res: Response) => {
	    try {
	        const examId = req.params.id;
	        const userId = req.user.id;

	        const sub = await Submission.findOne({ where: { userId, labId: examId } });
	        
	        if (!sub) {
	            return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu bài thi!' });
	        }

	        if (sub.status !== 'failed') {
	            return res.status(400).json({ success: false, message: 'Chỉ có thể thử lại các bài thi đã bị đánh TRƯỢT (Failed)!' });
	        }

	        // Xóa hoàn toàn record submission cũ để hệ thống nhận diện là "Chưa mua (Locked)"
	        await sub.destroy();

	        res.json({ success: true, message: 'Đã reset bài thi! Bạn có thể dùng Voucher để mở khóa lại.' });
	    } catch (error: any) {
	        console.error('❌ Lỗi reset bài thi:', error);
	        res.status(500).json({ success: false, message: 'Lỗi server khi reset bài thi.' });
	    }
	});


    // =========================================================
    // Lesson APIs
    // =========================================================
    app.get('/api/lessons', authenticate, async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { category, difficulty, level } = req.query;
        const where: any = {};
        if (category) where.category = category;
        if (difficulty) where.difficulty = difficulty;
        if (level) where.level = level;

        const lessons = await Lesson.findAll({
          where,
          attributes: ['id', 'title', 'description', 'category', 'difficulty', 'level', 'imageUrl', 'orderIndex'],
          order: [['orderIndex', 'ASC']]
        });
        res.json(lessons);
      } catch (error) {
        res.status(500).json({ error: 'Lỗi tải bài học' });
      }
    });

    app.get('/api/lessons/:id', authenticate, async (req: Request, res: Response) => {
      try {
        const lesson = await Lesson.findByPk(req.params.id);
        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
        res.json(lesson);
      } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
      }
    });

    app.get('/api/admin/lessons', authenticate, requireAdmin, async (req: Request, res: Response) => {
      try {
        const lessons = await Lesson.findAll({ order: [['orderIndex', 'ASC']] });
        res.json(lessons);
      } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách bài học.' });
      }
    });

    app.post('/api/admin/lessons/upload', authenticate, requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Chưa chọn file!' });
        const url = `/uploads/${req.file.filename}`;
        res.json({ success: true, url });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi upload ảnh' });
      }
    });

    app.post('/api/admin/lessons', authenticate, requireAdmin, async (req: Request, res: Response) => {
      try {
        const { id, title, description, category, difficulty, level, content, imageUrl, orderIndex } = req.body;
        const existing = await Lesson.findByPk(id);
        if (existing) return res.status(400).json({ success: false, message: 'ID bài học này đã tồn tại!' });

        const newLesson = await Lesson.create({
          id, title, description, category, difficulty, level, content, imageUrl: imageUrl || '', orderIndex: orderIndex || 0
        });
        res.json({ success: true, message: 'Tạo bài học thành công!', lesson: newLesson });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo.' });
      }
    });

    app.put('/api/admin/lessons/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
      try {
        const { title, description, category, difficulty, level, content, imageUrl, orderIndex } = req.body;
        const lesson: any = await Lesson.findByPk(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học!' });

        await lesson.update({ title, description, category, difficulty, level, content, imageUrl: imageUrl || '', orderIndex: orderIndex || 0 });
        res.json({ success: true, message: 'Cập nhật thành công!', lesson });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi sửa.' });
      }
    });

    app.delete('/api/admin/lessons/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
      try {
        const lesson = await Lesson.findByPk(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học!' });
        await lesson.destroy();
        res.json({ success: true, message: 'Đã xóa thành công.' });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa.' });
      }
    });

    // GET /api/admin/submissions - Lấy danh sách bài đã nộp
app.get('/api/admin/submissions', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const submissions = await Submission.findAll({
      where: { status: ['pending', 'passed', 'failed'] },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Lab, attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const submissionsData = submissions.map((sub: any) => ({
      id: sub.id,
      examId: sub.labId,
      studentName: sub.user?.name || 'Unknown',
      email: sub.user?.email || 'Unknown',
      status: sub.status,
      flags: sub.flags,
      fileUrl: sub.fileUrl,
      submittedAt: new Date(sub.createdAt).toLocaleString('vi-VN'),
      adminComment: sub.adminComment || ''
    }));

    res.json({ success: true, submissions: submissionsData });
  } catch (error) {
    console.error('❌ Lỗi lấy submissions:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách bài nộp.' });
  }
});

// Tìm đến API này và sửa đoạn tạo Certificate thành thế này:
app.put('/api/admin/submissions/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { status, adminComment } = req.body;
        const subId = req.params.id;

        if (!['passed', 'failed'].includes(status)) {
            return res.status(400).json({ success: false, message: '❌ Trạng thái không hợp lệ' });
        }

        const sub: any = await Submission.findByPk(subId);
        if (!sub) return res.status(404).json({ success: false, message: '❌ Bài nộp không tồn tại!' });

        if (status === 'passed' && sub.status !== 'passed') {
            const user: any = await User.findByPk(sub.userId);
            const exam: any = await Lab.findByPk(sub.labId);

            if (user && exam) {
                user.xp += exam.points;
                user.level = Math.floor(user.xp / 1000) + 1;
                user.rank = getRank(user.level);
                await user.save();

                // ✅ TẠO HASH MỘT LẦN DUY NHẤT (sử dụng sub.id + userId)
                if (exam.isExam) {
                    const existingCert = await Certificate.findOne({ where: { submissionId: sub.id } });
                    if (!existingCert) {
                        const rawString = `${sub.id}-${sub.userId}-${CERT_SALT}`;
			const secureHash = crypto.createHash('sha256').update(rawString).digest('hex');
                        await Certificate.create({
                            hash: secureHash,
                            userId: user.id,
                            examId: exam.id,
                            submissionId: sub.id,
                            signedName: user.name,
                            issueDate: new Date().toISOString().split('T')[0],
                            fileUrl: ''
                        });
                    }
                }
            }
        }

        await sub.update({ status: status, adminComment: adminComment || '' });
        res.json({ success: true, message: `✅ Đã ${status === 'passed' ? 'PASS' : 'FAIL'} bài thi!`, submission: sub });
    } catch (error: any) {
        console.error('❌ Lỗi chấm bài:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

	// API Xác minh chứng chỉ công khai (Không cần token)
	app.get('/api/verify/:hash', async (req: Request, res: Response) => {
	    try {
	        // ✅ LẤY TỪ CERTIFICATE TABLE (chứ không phải tính lại)
	        const cert: any = await Certificate.findOne({
	            where: { hash: req.params.hash },
	            include: [
	                { model: User, attributes: ['name', 'picture', 'email'] },
	                { model: Lab, attributes: ['title', 'category', 'difficulty'] },
	                { model: Submission, attributes: ['status', 'createdAt'] }
	            ]
	        });

	        if (!cert) {
	            return res.status(404).json({ success: false, message: 'Mã định danh không tồn tại trên hệ thống.' });
	        }

	        if (cert.submission?.status !== 'passed') {
	            return res.status(400).json({ success: false, message: 'Chứng chỉ này đang bị tạm khóa hoặc thu hồi.' });
	        }

	        res.json({ success: true, cert });
	    } catch (error) {
	        console.error('❌ Lỗi Verify Cert:', error);
	        res.status(500).json({ success: false, message: 'Lỗi server khi truy xuất dữ liệu.' });
	    }
	});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'picture', 'xp', 'level', 'rank'],
            order: [['xp', 'DESC']],
            limit: 50
        });
        // Sếp có thể join thêm bảng Submission để đếm cert ở đây nếu cần
        res.json(users);
    } catch (e) {
        res.status(500).json([]);
    }
});

  // Thêm vào server.ts, trước các endpoint khác
app.get('/api/admin/labs', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const labs = await Lab.findAll();
    res.json(labs);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách Lab.' });
  }
});


  app.post('/api/admin/labs', authenticate, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { id, title, description, difficulty, category, points, flag, contentUrl, isExam, downloadUrl, price, duration } = req.body;
            const existingLab = await Lab.findByPk(id);
            if (existingLab) return res.status(400).json({ success: false, message: 'ID Lab này đã tồn tại!' });

            const newLab = await Lab.create({
                id, title, description, difficulty, category, points, flag, contentUrl, solves: 0,
                isExam: isExam || false, downloadUrl: downloadUrl || '',
                price: price || 0, duration: duration || 60
            });
            res.json({ success: true, message: 'Tạo thành công!', lab: newLab });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server khi tạo.' });
        }
    });

    app.put('/api/admin/labs/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { title, description, difficulty, category, points, flag, contentUrl, isExam, downloadUrl, price, duration } = req.body;
            const lab: any = await Lab.findByPk(req.params.id);
            if (!lab) return res.status(404).json({ success: false, message: 'Không tìm thấy Lab!' });

            await lab.update({ 
                title, description, difficulty, category, points, flag, contentUrl,
                isExam: isExam || false, downloadUrl: downloadUrl || '',
                price: price || 0, duration: duration || 60
            });
            res.json({ success: true, message: 'Cập nhật thành công!', lab });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server khi sửa.' });
        }
    });


    app.delete('/api/admin/labs/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
	    try {
	        const labId = req.params.id;
	        const lab = await Lab.findByPk(labId);
	        if (!lab) return res.status(404).json({ success: false, message: 'Không tìm thấy Lab!' });

	        // FIX: Bắt buộc phải xóa Submission (Con) trước khi xóa Lab (Bố)
	        await Submission.destroy({ where: { labId: labId } });
	        await lab.destroy();

	        res.json({ success: true, message: 'Đã xóa thành công.' });
	    } catch (error) {
	        console.error("[-] Lỗi xóa Lab:", error);
	        res.status(500).json({ success: false, message: 'Lỗi server khi xóa.' });
	    }
	});

    app.get('/api/admin/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
        try {
            const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role', 'xp', 'voucherXp', 'level', 'rank'] });
            res.json(users);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server.' });
        }
    });

    app.post('/api/admin/users/:id/adjust-xp', authenticate, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { amount, reason } = req.body;
            if (!amount || isNaN(amount)) return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ.' });

            const user: any = await User.findByPk(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy User!' });

            user.xp += Number(amount);
            if (user.xp < 0) user.xp = 0;
            user.level = Math.floor(user.xp / 1000) + 1;
            user.rank = getRank(user.level);
            await user.save();

            res.json({ success: true, message: `Đã cập nhật XP cho ${user.email}.`, user: { xp: user.xp, level: user.level, rank: user.rank } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật XP.' });
        }
    });

    app.post('/api/admin/users/:id/adjust-voucher', authenticate, requireAdmin, async (req: Request, res: Response) => {
        try {
            const { amount, reason } = req.body;
            if (!amount || isNaN(amount)) return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ.' });

            const user: any = await User.findByPk(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy User!' });

            user.voucherXp = (user.voucherXp || 0) + Number(amount);
            if (user.voucherXp < 0) user.voucherXp = 0;
            await user.save();

            res.json({ success: true, message: `Đã cập nhật Voucher cho ${user.email}.`, user: { xp: user.xp, voucherXp: user.voucherXp, level: user.level, rank: user.rank } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật Voucher.' });
        }
    });

    app.delete('/api/admin/users/:id/voucher', authenticate, requireAdmin, async (req: Request, res: Response) => {
        try {
            const user: any = await User.findByPk(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy User!' });

            user.voucherXp = 0;
            await user.save();

            res.json({ success: true, message: `Đã reset Voucher của ${user.email} về 0.`, user: { xp: user.xp, voucherXp: user.voucherXp } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server khi xóa Voucher.' });
        }
    });

    const ROUTES_FILE_PATH = path.resolve(process.cwd(), '../ctf-labs/lab-routes.json');

    app.get('/api/admin/gateway/routes', authenticate, requireAdmin, (req: Request, res: Response) => {
        try {
            if (!fs.existsSync(ROUTES_FILE_PATH)) {
                return res.json({ success: true, data: "{\n  \"message\": \"File chưa tồn tại\"\n}" });
            }
            const data = fs.readFileSync(ROUTES_FILE_PATH, 'utf8');
            res.json({ success: true, data: data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đọc file routing.' });
        }
    });

    app.post('/api/admin/gateway/routes', authenticate, requireAdmin, (req: Request, res: Response) => {
        try {
            const { routesContent } = req.body;
            JSON.parse(routesContent);
            fs.writeFileSync(ROUTES_FILE_PATH, routesContent, 'utf8');
            res.json({ success: true, message: 'Đã cập nhật Bảng định tuyến!' });
        } catch (error: any) {
            res.status(400).json({ success: false, message: 'Lỗi: JSON không hợp lệ!' });
        }
    });
   
    // =========================================================
    // 🛠 TỰ ĐỘNG CẤP BÙ CHỨNG CHỈ CHO CÁC HỌC VIÊN ĐÃ PASS TRƯỚC ĐÂY
    // =========================================================
    // Automatic Certificate generation
	try {
	    const passedSubmissions: any = await Submission.findAll({
	        where: { status: 'passed' },
	        include: [
	            { model: Lab, where: { isExam: true } },
	            { model: User }
	        ]
	    });

	    let count = 0;
	    for (const sub of passedSubmissions) {
	        const certExists = await Certificate.findOne({ where: { submissionId: sub.id } });
	        if (!certExists) {
	            // ✅ DÙNG CÔNG THỨC HASH NHẤT QUÁN
	            // Sửa dòng 608 thành:
		    const rawString = `${sub.id}-${sub.userId}-${CERT_SALT}`;
	            const secureHash = crypto.createHash('sha256').update(rawString).digest('hex');

	            await Certificate.create({
	                hash: secureHash,
	                userId: sub.userId,
	                examId: sub.labId,
	                submissionId: sub.id,
	                signedName: sub.user?.name || 'Học viên',
	                issueDate: new Date(sub.updatedAt).toISOString().split('T')[0],
	                fileUrl: ''
	            });
	            count++;
	        }
	    }
	    if (count > 0) console.log(`[+] Đã quét và cấp bù thành công ${count} Chứng chỉ bị thiếu!`);
	} catch (err) {
	    console.error('❌ Lỗi khi cấp bù chứng chỉ:', err);
	}


    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({ 
	        server: { 
	            middlewareMode: true,
                    // CHÌA KHÓA Ở ĐÂY: Cho phép host của sếp
                    allowedHosts: ["vuln.ghedahaui.online"]
	            // THÊM DÒNG DƯỚI ĐÂY ĐỂ BỊT LỖI BLOCKED
	        }, 
	        appType: 'spa' 
	    });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), '../frontend/dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            if (req.path.startsWith('/labs/')) return res.status(404).send('Lab file not found');
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

startServer().catch((err) => {
    console.error('Failed to start server:', err);
});
