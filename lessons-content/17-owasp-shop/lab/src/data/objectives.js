// Objective registry — bilingual (vi/en).
// Student-facing titles stay neutral: they describe an OUTCOME, never a technique.
// Technique names appear only AFTER the student submits valid evidence (the flag),
// as confirmation of what they just demonstrated.
const OBJECTIVES = [
  {
    id: 'c1',
    flag: 'FLAG{c1}',
    title: {
      vi: 'Tìm file mà ứng dụng quên không bảo vệ',
      en: 'Find a file the application forgot to protect',
    },
    demo: {
      vi: ['Liệt kê được tài nguyên không có link dẫn tới', 'Nhận diện artifact backup bị lộ'],
      en: ['Enumerated non-linked resources', 'Recognized exposed backup artifacts'],
    },
    learned: { vi: 'Rò rỉ dữ liệu nhạy cảm / lộ mã nguồn', en: 'Sensitive data exposure / source disclosure' },
    next: {
      vi: 'Ghi lại cách bạn tìm thấy và kẻ tấn công đạt được gì.',
      en: 'Document how you found it and what an attacker gains from it.',
    },
  },
  {
    id: 'c2',
    flag: 'FLAG{c2}',
    title: {
      vi: 'Đăng nhập mà không cần mật khẩu của bất kỳ ai',
      en: 'Log in without knowing any password',
    },
    demo: {
      vi: ['Quan sát input đi vào truy vấn database', 'Chế tạo input làm thay đổi logic truy vấn'],
      en: ['Observed that input reaches a database query', 'Crafted input that changed query logic'],
    },
    learned: { vi: 'NoSQL operator injection', en: 'NoSQL operator injection' },
    next: {
      vi: 'Giải thích vì sao query nối chuỗi nguy hiểm cả ngoài SQL.',
      en: 'Explain why string-building queries are dangerous even outside SQL.',
    },
  },
  {
    id: 'c3',
    flag: 'FLAG{c3}',
    title: {
      vi: 'Chứng minh token phiên đăng nhập không đáng tin',
      en: 'Prove the session token cannot be trusted',
    },
    demo: {
      vi: ['Decode và phân tích cấu trúc token', 'Forge token mà server chấp nhận'],
      en: ['Decoded and inspected token structure', 'Forged a token the server accepted'],
    },
    learned: { vi: 'JWT nhầm lẫn thuật toán / verify chữ ký hỏng', en: 'JWT algorithm confusion / broken signature verification' },
    next: {
      vi: 'Nêu tên hàm/cấu hình thư viện đã ngăn được điều này.',
      en: 'State which library call would have prevented this.',
    },
  },
  {
    id: 'c4',
    flag: 'FLAG{c4}',
    title: {
      vi: 'Nâng đặc quyền thông qua trang chỉnh sửa hồ sơ',
      en: 'Gain privileges through profile editing',
    },
    demo: {
      vi: ['So sánh field request với schema phía server', 'Tiêm field mà UI không bao giờ gửi'],
      en: ['Compared request fields with server-side schema', 'Injected a field the UI never sends'],
    },
    learned: { vi: 'Mass assignment', en: 'Mass assignment' },
    next: {
      vi: 'Chỉ ra fix một dòng (whitelist field) trong report.',
      en: 'Show the one-line fix (field whitelist) in your report.',
    },
  },
  {
    id: 'c5',
    flag: 'FLAG{c5}',
    title: {
      vi: 'Rút được bản ghi nhạy cảm từ database phía sau',
      en: 'Extract records from the backend database',
    },
    demo: {
      vi: [
        'Input chạm tới câu SQL',
        'Xác định cấu trúc query qua error/behavior',
        'Xác định số cột cho UNION',
        'Trích xuất dữ liệu từ shopusers',
      ],
      en: [
        'Input reached SQL query',
        'Query structure identified via error/behavior',
        'UNION column count established',
        'Data extracted from shopusers',
      ],
    },
    learned: { vi: 'SQL injection — trích xuất kiểu UNION', en: 'SQL injection — union-based extraction' },
    next: {
      vi: 'Ghi root cause; giải thích parameterized query ngăn thế nào.',
      en: 'Document root cause; explain how parameterized queries prevent it.',
    },
  },
  {
    id: 'c6',
    flag: 'FLAG{c6}',
    title: {
      vi: 'Vượt qua một bước xác thực phụ',
      en: 'Defeat a secondary verification step',
    },
    demo: {
      vi: ['Nhận diện không gian bí mật có giới hạn', 'Tự động hóa lần thử xác thực không bị chặn'],
      en: ['Identified a bounded secret space', 'Automated verification attempts without blocking'],
    },
    learned: { vi: 'Thiếu rate limit / brute force', en: 'Missing rate limiting / brute force' },
    next: {
      vi: 'Đề xuất chính sách rate-limit cụ thể (số lần, cửa sổ, phạm vi).',
      en: 'Propose concrete rate-limit policy (attempts, window, scope).',
    },
  },
  {
    id: 'c7',
    flag: 'FLAG{c7}',
    title: {
      vi: 'Đọc dữ liệu thuộc về người khác',
      en: 'Read data that belongs to someone else',
    },
    demo: {
      vi: ['Thao túng tham chiếu object trong request', 'Truy cập bản ghi của người dùng khác'],
      en: ['Manipulated an object reference in a request', "Accessed another user's record"],
    },
    learned: { vi: 'IDOR / hỏng authorization cấp object', en: 'IDOR / broken object-level authorization' },
    next: {
      vi: 'Chỉ ra chỗ thiếu check ownership theo góc độ code.',
      en: 'Show the missing ownership check in code terms.',
    },
  },
  {
    id: 'c8',
    flag: 'FLAG{c8}',
    title: {
      vi: 'Khiến ứng dụng khai nhiều hơn mức nên nói',
      en: 'Make the application talk more than it should',
    },
    demo: {
      vi: ['Kích hoạt diagnostics chi tiết', 'Trích trạng thái nội bộ từ output debug'],
      en: ['Triggered verbose diagnostics', 'Extracted internal state from debug output'],
    },
    learned: { vi: 'Lộ interface debug', en: 'Debug interface exposure' },
    next: {
      vi: 'Liệt kê những gì config production phải tắt.',
      en: 'List what production config must disable.',
    },
  },
  {
    id: 'c9',
    flag: 'FLAG{c9}',
    title: {
      vi: 'Chạm tới service nội bộ không dành cho bạn',
      en: 'Reach an internal service never meant for you',
    },
    demo: {
      vi: ['Khiến server gửi request thay bạn', 'Pivot vào không gian mạng nội bộ'],
      en: ['Made the server issue requests on your behalf', 'Pivoted into internal network space'],
    },
    learned: { vi: 'SSRF', en: 'SSRF' },
    next: {
      vi: 'Liệt kê dải IP nội bộ trở nên với tới được và cách chặn.',
      en: 'Map which internal ranges became reachable and how to block them.',
    },
  },
  {
    id: 'c10',
    flag: 'FLAG{c10}',
    title: {
      vi: 'Đọc file tùy ý thông qua bộ xử lý tài liệu',
      en: 'Read arbitrary files through a document parser',
    },
    demo: {
      vi: ['Kiểm soát định nghĩa entity', 'Exfiltrate nội dung file qua response của parser'],
      en: ['Controlled an entity definition', 'Exfiltrated local file content via parser response'],
    },
    learned: { vi: 'XXE — lộ file', en: 'XXE — file disclosure' },
    next: {
      vi: 'Nêu các flag hardening của parser ngăn điều này.',
      en: 'Name the parser hardening flags that stop this.',
    },
  },
  {
    id: 'c11',
    flag: 'FLAG{c11}',
    title: {
      vi: 'Thực thi lệnh trên hệ điều hành của server',
      en: 'Execute operating-system commands',
    },
    demo: {
      vi: ['Thoát khỏi ngữ cảnh argument của shell', 'Nối thêm lệnh tùy ý'],
      en: ['Broke out of a shell argument context', 'Chained additional commands'],
    },
    learned: { vi: 'OS command injection → RCE', en: 'OS command injection → RCE' },
    next: {
      vi: 'So sánh API an toàn vs gọi shell trong report.',
      en: 'Contrast safe APIs vs shell invocation in your report.',
    },
  },
  {
    id: 'c12',
    flag: 'FLAG{c12}',
    title: {
      vi: 'Khiến server tính toán biểu thức của bạn',
      en: 'Make the server evaluate your expressions',
    },
    demo: {
      vi: ['Phát hiện template exec bằng probe số học', 'Nâng lên đọc file/hệ thống'],
      en: ['Detected template evaluation via arithmetic probe', 'Escalated to file/system access'],
    },
    learned: { vi: 'Server-side template injection', en: 'Server-side template injection' },
    next: {
      vi: 'Ghi lại tiến trình payload probe → read.',
      en: 'Document your payload progression probe → read.',
    },
  },
  {
    id: 'c13',
    flag: 'FLAG{c13}',
    title: {
      vi: 'Lợi dụng dữ liệu serialized mà server tin tưởng',
      en: 'Abuse serialized data the server trusts',
    },
    demo: {
      vi: ['Decode blob state mờ đục', 'Replay với tham chiếu gadget độc'],
      en: ['Decoded an opaque state blob', 'Replayed it with a malicious gadget reference'],
    },
    learned: { vi: 'Insecure deserialization', en: 'Insecure deserialization' },
    next: {
      vi: 'Giải thích vì sao chỉ có chữ ký (integrity) là chưa đủ.',
      en: 'Explain why integrity alone (signature) may not be enough.',
    },
  },
  {
    id: 'c14',
    flag: 'FLAG{c14}',
    title: {
      vi: "Khiến trình duyệt của người khác chạy script của bạn",
      en: "Make another user's browser run your script",
    },
    demo: {
      vi: ['Lưu input được người khác render', 'Đánh cắp session nạn nhân qua bot mô phỏng'],
      en: ['Persisted input rendered by other users', 'Captured a victim session via simulated bot'],
    },
    learned: { vi: 'Stored XSS với impact nạn nhân thật', en: 'Stored XSS with real victim impact' },
    next: {
      vi: 'Chỉ ra fix encode output theo context (HTML/attr/JS).',
      en: 'Show output-encoding fix per context (HTML/attr/JS).',
    },
  },
  {
    id: 'c15',
    flag: 'FLAG{c15}',
    title: {
      vi: 'Phản chiếu nội dung của kẻ tấn công vào trang',
      en: 'Reflect attacker-controlled content into a page',
    },
    demo: {
      vi: ['Xác định điểm reflect không encode', 'Chạy script trong session trình duyệt'],
      en: ['Identified unencoded reflection point', 'Executed script in a browser session'],
    },
    learned: { vi: 'Reflected XSS', en: 'Reflected XSS' },
    next: {
      vi: 'Ghi chú vì sao cookie HttpOnly hạn chế nhưng không xóa impact.',
      en: 'Note why HttpOnly cookies limit but do not remove impact.',
    },
  },
  {
    id: 'c16',
    flag: 'FLAG{c16}',
    title: {
      vi: 'Thực hiện hành động thay một người dùng chưa bao giờ đồng ý',
      en: 'Perform an action as a user who never consented',
    },
    demo: {
      vi: ['Dựng PoC cross-site request', 'Chứng minh thay đổi trạng thái không cần token'],
      en: ['Built a cross-site request PoC', 'Demonstrated state change without token'],
    },
    learned: { vi: 'CSRF', en: 'CSRF' },
    next: {
      vi: 'Ghi evidence dạng PoC chạy được + trạng thái trước/sau.',
      en: 'Record evidence as a working PoC + before/after state.',
    },
  },
];

const MASTER = {
  id: 'master',
  flag: 'FLAG{owasp_shop_master}',
  title: { vi: 'Chiếm quyền kiểm soát toàn bộ CyberShop', en: 'Full compromise of CyberShop' },
};

function findByFlag(value) {
  const v = String(value || '').trim();
  return OBJECTIVES.find((o) => o.flag.toLowerCase() === v.toLowerCase()) || null;
}

// Pick the language-specific projection of an objective.
function localize(obj, lang) {
  const l = lang === 'en' ? 'en' : 'vi';
  return {
    id: obj.id,
    flag: obj.flag,
    title: obj.title[l],
    demo: obj.demo ? obj.demo[l] : undefined,
    learned: obj.learned ? obj.learned[l] : undefined,
    next: obj.next ? obj.next[l] : undefined,
  };
}

module.exports = { OBJECTIVES, MASTER, findByFlag, localize };
