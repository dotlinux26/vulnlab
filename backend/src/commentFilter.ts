import sanitizeHtml from 'sanitize-html';

// ==========================================
// LỌC SPAM & LÀM SẠCH BÌNH LUẬN
// ==========================================
const MAX_TOTAL_CHARS = 500; // Tổng giới hạn ký tự
const MAX_LINES = 10;        // Cắt dọc: tối đa số dòng
const MAX_WORD_LEN = 60;     // Cắt ngang: tối đa độ dài 1 từ
const MAX_LINE_LEN = 120;    // Cắt ngang: tối đa độ dài 1 dòng

const truncateWord = (w: string) => (w.length > MAX_WORD_LEN ? w.slice(0, MAX_WORD_LEN) : w);
const truncateLine = (l: string) => (l.length > MAX_LINE_LEN ? l.slice(0, MAX_LINE_LEN) : l);

// ✅ AN TOÀN: escape mọi ký tự HTML đặc biệt TRONG TEXT
// (sanitize-html decode entity như &lt; -> <, nếu render qua innerHTML sẽ thành thẻ thật)
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const sanitizeComment = (raw: string): string => {
  if (typeof raw !== 'string') return '';

  // 1. Chặn XSS: bỏ toàn bộ thẻ HTML/attribute
  let clean = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();

  if (!clean) return '';

  // 1b. Escape text còn lại (đã bị sanitize-html decode entity)
  clean = escapeHtml(clean);

  // 2. Bóp khoảng trắng dư: nhiều space -> 1 space
  clean = clean.replace(/[ \t]{2,}/g, ' ');
  // 3. Bỏ ký tự điều khiển (trừ newline)
  clean = clean.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // 4. Cắt dọc: tối đa MAX_LINES dòng
  let lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > MAX_LINES) lines = lines.slice(0, MAX_LINES);

  // 5. Cắt ngang: giới hạn từ dài + độ dài dòng
  lines = lines.map((l) => truncateLine(l.split(' ').map(truncateWord).join(' ')));

  clean = lines.join('\n');

  // 6. Giới hạn tổng
  if (clean.length > MAX_TOTAL_CHARS) clean = clean.slice(0, MAX_TOTAL_CHARS);

  return clean.trim();
};

// ==========================================
// LINKIFY AN TOÀN (giống logic chat)
// ==========================================
export const linkify = (text: string): string => {
  // Vì text đã được escape, URL match không chứa ký tự nguy hiểm
  const urlRegex = /(https?:\/\/[^\s"']+)/g;
  return text.replace(urlRegex, (url) => {
    const safeUrl = url.replace(/&amp;/g, '&');
    const encoded = encodeURI(safeUrl)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
    return `<a href="${encoded}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${encoded}</a>`;
  });
};

// ==========================================
// NHẬN DIỆN LINK ẢNH
// ==========================================
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i;

export const isImageUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') && IMAGE_EXT.test(u.pathname);
  } catch {
    return false;
  }
};

export const extractImageUrl = (content: string): string | null => {
  const match = content.match(/(https?:\/\/[^\s"']+)/g);
  if (!match) return null;
  return match.find((u) => isImageUrl(u)) || null;
};
