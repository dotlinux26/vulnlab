# Web Recon — Trinh Sát Web Application

> **Độ khó:** Easy — **Trình độ:** beginner

## Giới thiệu

**Recon (trinh sát)** là giai đoạn thu thập thông tin về mục tiêu trước khi tấn công — và là giai đoạn **quyết định 80% thành công**. Trong pentest web, recon = tìm hiểu app này chạy công nghệ gì, có những trang nào, ẩn giấu endpoint nào, và dev đã để lộ những gì. Càng nhiều thông tin, bạn càng biết tấn công vào đâu.

---

## Phần A — Hiểu (Understand)

### Trinh sát web là gì?

Mọi web app đều "kể chuyện" về chính nó. Việc của bạn là lắng nghe:

```
Nguồn thông tin                    →  Tiết lộ
robots.txt, sitemap.xml            →  thư mục/trang dev muốn ẩn
View-source (HTML/JS)              →  comment ẩn, endpoint, API key
Response headers                   →  server, framework, version
Trang lỗi (404, 500, debug)        →  ngôn ngữ, framework, đường dẫn nội bộ
whatweb / wappalyzer               →  công nghệ, phiên bản, CMS
Quét thư mục (dir)                 →  trang ẩn, backup, admin panel
```

> **Dễ hiểu:** Giống quan sát ngôi nhà trước khi trộm (theo nghĩa được phép): nhìn biển số xe (tech stack), thùng rác (robots.txt, comment), cửa sổ (endpoint ẩn)... trước khi quyết định bẻ khóa cửa nào.

### Active vs Passive Recon

| | Passive (thụ động) | Active (chủ động) |
|---|---|---|
| Chạm vào target? | Không — chỉ quan sát | Có — gửi request tới |
| Nguồn | Search engine, certificate transparency, WHOIS | curl, ffuf, nmap, whatweb |
| Dễ bị phát hiện | Rất thấp | Cao hơn |
| Ví dụ | Google dork, crt.sh | quét thư mục, nmap |

> **Mẹo:** Luôn làm **passive trước, active sau**. Passive cung cấp "bản đồ"; active xác nhận chi tiết.

### Google Dork — tìm bằng chính Google

Google có thể tìm file/thông tin bị lộ trên website:

| Dork | Ý nghĩa |
|------|---------|
| `site:example.com` | Mọi trang được index của domain |
| `site:example.com filetype:sql` | File .sql lộ ra |
| `site:example.com intitle:"index of"` | Thư mục mở directory listing |
| `inurl:admin` | Trang admin |
| `intitle:"login" inurl:php` | Trang đăng nhập PHP |

> ⚠️ **Với lab:** Lab Docker của bạn không trên internet nên Google dork không dùng được — đây là kỹ năng recon thật ngoài đời, ghi nhớ để dùng sau. Trong lab ta dùng cách "active" ở dưới.

---

## Phần B — Khai thác: Recon lab `web-recon`

### Bước 1: Khởi động lab

```bash
cd web-recon/lab
docker compose up -d

> 💡 **Lấy link lab:** Mở bài học này trên trang **Learning Detail** → bấm **"Truy cập Lab"** để hệ thống cấp link thực tế (VD: `https://vuln.ghedahaui.online/labs-env/...`). Thay `<LAB_ADDRESS>` bằng link đó trong các lệnh dưới đây.

# Lab tại: <LAB_ADDRESS>
```

Lab mô phỏng một website "trông bình thường" nhưng ẩn nhiều thứ: robots.txt tiết lộ thư mục ẩn, comment trong source, header server bị lộ, và một admin panel không có trong menu.

### Bước 2: Xem robots.txt — bản đồ thư mục ẩn

```bash
$ curl -s <LAB_ADDRESS>/robots.txt
User-agent: *
Disallow: /hidden/
Disallow: /backup/
Disallow: /config.php
```

<!-- ẢNH: Chụp kết quả curl robots.txt hiện 3 đường dẫn bị chặn (bước 2). File: web-recon_01_robots_txt.png -->

> **Giải thích:** `robots.txt` dùng để chặn crawler — nhưng kẻ tấn công đọc nó như **danh sách thư mục đáng giá**. Dev thường để lộ ở đây những thứ đáng lẽ phải giấu kỹ hơn.

### Bước 3: Đọc source HTML — tìm comment ẩn

```bash
$ curl -s <LAB_ADDRESS>/ | grep -iE "comment|hidden|todo|flag|admin"
```

<!-- ẢNH: Chụp output grep tìm thấy comment ẩn chứa đường dẫn (bước 3). File: web-recon_02_source_comment.png -->

> **Giải thích:** Dev hay chừa comment kiểu `<!-- TODO: đổi mật khẩu admin -->` hoặc `<!-- link: /dev_notes.txt -->`. Đây là "mỏ vàng" của recon.

### Bước 4: Nhận diện công nghệ (fingerprinting)

```bash
$ whatweb <LAB_ADDRESS>
# Kết quả mẫu: Apache[2.4.57], PHP[8.2.12], Country[...]
```

Xem trực tiếp header server:

```bash
$ curl -sI <LAB_ADDRESS>
HTTP/1.1 200 OK
Server: Apache/2.4.57 (Debian)
X-Powered-By: PHP/8.2.12
```

<!-- ẢNH: Chụp kết quả curl -I hiện header Server và X-Powered-By (bước 4). File: web-recon_03_headers.png -->

> **Giải thích:** Biết `Apache 2.4.57 + PHP 8.2.12` → bạn biết nên test lỗi PHP nào, cấu hình Apache nào. Header `Server`/`X-Powered-By` là **lỗ hổng Security Misconfiguration (A05)** — dev lẽ ra nên ẩn version.

### Bước 5: Dò tìm endpoint với gobuster

```bash
$ gobuster dir -u <LAB_ADDRESS> -w /usr/share/seclists/Discovery/Web-Content/common.txt -t 20 -x php,txt,html
```

> **Wordlist:** File `common.txt` nằm trong **SecLists** — tải tại `https://github.com/danielmiessler/SecLists` (hoặc `sudo apt install -y seclists`). Bài `fuzzing-content-discovery` hướng dẫn tải đầy đủ.

<!-- ẢNH: Chụp kết quả gobuster liệt kê các thư mục/trang tìm thấy (bước 5). File: web-recon_04_gobuster.png -->

Kết quả mẫu:

```text
/admin                (Status: 200) [Size: 512]
/backup               (Status: 301) [Size: 180]
/config.php           (Status: 200) [Size: 88]
/hidden               (Status: 301) [Size: 180]
```

### Bước 6: Khai thác thông tin thu được

Truy cập `/config.php` — lab này "lơ đãng" hiện nội dung cấu hình:

```bash
$ curl -s <LAB_ADDRESS>/config.php
DB_HOST=localhost
DB_USER=root
DB_PASS=Sup3rS3cr3t
FLAG=FLAG{r3c0n_f1rst_2026}
```

<!-- ẢNH: Chụp trang /config.php hiện flag (bước 6). File: web-recon_05_flag.png -->

> **Tổng kết chuỗi recon:** robots.txt → tìm thấy `/config.php` → vào đọc flag. Không cần "hack" gì cả — chỉ cần chịu khó tìm. Đây chính là lý do recon quan trọng nhất.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách dev tránh bị recon "chơi"

- **Không đặt bí mật trong robots.txt** — dùng auth thật thay vì ẩn đường dẫn.
- **Xóa comment nhạy cảm** trong source trước khi deploy (hoặc dùng build minify).
- **Ẩn version server:** Apache `ServerTokens Prod`, PHP `expose_php = Off`.
- **Chặn directory listing** (`Options -Indexes`).
- **Giới hạn trang lỗi:** không để lộ stack trace, đường dẫn nội bộ.
- **Config file đặt NGOÀI document root**, không bao giờ trong web-accessible.

### Checklist recon web nhanh

```text
[ ] curl -s http://TARGET/robots.txt
[ ] curl -s http://TARGET/sitemap.xml
[ ] View-source trang chủ → tìm comment, link, API key
[ ] curl -sI http://TARGET/  → đọc Server + X-Powered-By
[ ] whatweb http://TARGET/   → công nghệ + phiên bản
[ ] gobuster dir -u http://TARGET -w common.txt -x php,txt
[ ] Quét từng endpoint tìm được (đừng bỏ sót)
```

---

## Bài tập check kiến thức

<!-- Dạng hỏi–trả lời. Gợi ý số ký tự ở đuôi câu (*****), đáp án tiếng Anh/số, ghi sẵn đáp án bên dưới. Chỉ lab mới có flag. -->

1. Trinh sát trong pentest nhằm mục đích gì? (*****)
   - Đáp án: recon

2. File nào của website thường tiết lộ các thư mục ẩn? (**********)
   - Đáp án: robots.txt

3. Header `X-Powered-By: PHP/8.2.12` tiết lộ điều gì? (**********)
   - Đáp án: technology

4. Công cụ nào dùng để dò tìm thư mục/trang ẩn? (********)
   - Đáp án: gobuster

5. Passive recon không gửi ______ trực tiếp tới mục tiêu. (********)
   - Đáp án: requests
