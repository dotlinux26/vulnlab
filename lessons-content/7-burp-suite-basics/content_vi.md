# Burp Suite Căn Bản — Nghe Lén & Sửa Đổi Request

> **Độ khó:** Easy — **Trình độ:** beginner

## Giới thiệu

Burp Suite là **công cụ số 1** của pentester web. Nó hoạt động như một **proxy** (người trung gian): ngồi giữa trình duyệt và web server, cho phép bạn **nhìn thấy** mọi request và **sửa đổi** chúng trước khi gửi đi. Không có Burp, bạn chỉ "nhìn" được app web theo cách app muốn; có Burp, bạn điều khiển được toàn bộ.

---

## Phần A — Hiểu (Understand)

### Proxy là gì?

Proxy là **trạm trung chuyển**:

```
Không proxy:   [ Browser ] ───────────────────> [ Server ]
Có proxy:      [ Browser ] ──> [ BURP PROXY ] ──> [ Server ]
                                │    ▲
                                ▼    │
                          bạn nhìn & sửa tại đây
```

Mọi request từ trình duyệt đều đi qua Burp trước khi tới server, và mọi response đều quay lại qua Burp. Vì vậy bạn có thể **bắt (intercept)** và **thay đổi** chúng.

> **Dễ hiểu:** Burp là "người gác cổng" bạn thuê — bạn dặn: mọi thư gửi đi hãy đưa tôi xem trước, tôi có thể sửa nội dung rồi mới cho chuyển tiếp.

### Các module quan trọng nhất (Community Edition)

| Module | Chức năng | Khi nào dùng |
|--------|-----------|--------------|
| **Proxy** | Bắt/chỉnh sửa request trực tiếp | Mọi lúc — xem & sửa request |
| **HTTP History** | Nhật ký tất cả request đã qua | Xem lại lịch sử, tìm API ẩn |
| **Repeater** | Gửi lại request đã chỉnh sửa nhiều lần | Thử payload thủ công từng bước |
| **Intruder** | Tự động brute-force/fuzz với wordlist | Brute-force login, fuzz param |
| **Decoder** | Mã hóa/giải mã (Base64, URL, Hex...) | Giải mã chuỗi trong lab |
| **Comparer** | So sánh 2 response | Phát hiện khác biệt khi payload |

> **Lưu ý:** Community Edition miễn phí, Intruder bị giới hạn tốc độ nhưng đủ dùng để học. Trong lab này ta dùng Repeater + Decoder + HTTP History là chính.

### Cài đặt & cấu hình proxy

**Bước 1 — Cài Burp:**
```bash
# Kali có sẵn; nếu chưa:
sudo apt update && sudo apt install -y burpsuite
# Hoặc tải từ PortSwigger (bản Community miễn phí)
```

**Bước 2 — Cấu hình browser dùng proxy Burp:**
- Burp mặc định lắng nghe tại `127.0.0.1:8080`
- Trình duyệt (Firefox) → Settings → Network Settings → Manual proxy:
  - HTTP Proxy: `127.0.0.1`, Port: `8080`
- Tắt `Intercept` (Proxy tab) để duyệt web bình thường; bật để bắt request.

> ⚠️ **Khi học lab trong Docker:** Lab chạy ở `http://localhost:PORT`. Cấu hình proxy xong, mở lab qua browser là request tự động đi qua Burp.

---

## Phần B — Khai thác: Bắt & Sửa Request

### Bước 1: Khởi động lab

```bash
cd burp-suite-basics/lab
docker compose up -d
# Lab tại: http://localhost:7101 — một app PHP echo lại request của bạn
```

### Bước 2: Bật Intercept và bắt request

1. Mở Burp → tab **Proxy** → tab **Intercept** → nhấn **Intercept is off** để bật thành **on**.
2. Trên browser mở `http://localhost:7101/?name=admin` và bấm Enter.
3. Quay lại Burp — request bị "treo" ở đây, chờ bạn quyết định.

<!-- ẢNH: Chụp tab Proxy Intercept trong Burp đang giữ một request GET (bước 2). File: burp-suite-basics_01_intercept.png -->

### Bước 3: Chỉnh sửa request ngay tại Intercept

Trong cửa sổ Intercept, bạn thấy toàn bộ request thô:

```http
GET /?name=admin HTTP/1.1
Host: localhost:7101
User-Agent: Mozilla/5.0 ...
Accept: text/html,...
Connection: close
```

Hãy **sửa** dòng `name=admin` thành `name=test_xss%3Cscript%3E` rồi bấm **Forward**:

<!-- ẢNH: Chụp request đã sửa name= thành payload trước khi Forward (bước 3). File: burp-suite-basics_02_intercept_modified.png -->

> **Giải thích:** `%3C` = `<`, `%3E` = `>` (URL encode). Server echo lại `name` bạn gửi → đây chính là nơi sẽ dính XSS ở bài sau. Bạn vừa làm điều mà không có Burp bạn KHÔNG làm được: gửi giá trị khác với những gì trình duyệt định gửi.

### Bước 4: Gửi lại với Repeater

1. Trong tab **HTTP History**, tìm request `GET /?name=...`, click phải → **Send to Repeater** (hoặc phím Ctrl+R).
2. Sang tab **Repeater**, sửa `name` thành giá trị mới rồi bấm **Send**.
3. Quan sát **response** bên phải — thử nhiều payload khác nhau mà không cần reload browser.

<!-- ẢNH: Chụp Repeater với request và response song song (bước 4). File: burp-suite-basics_03_repeater.png -->

```http
GET /?name=hello_world HTTP/1.1
Host: localhost:7101
```

### Bước 5: Dùng Decoder để giải mã

Trong lab thường gặp chuỗi mã hóa. Tab **Decoder**:

1. Dán chuỗi `VkxOVF9idXJwX3J1bGV6IQ==` vào Decoder.
2. Chọn **Decode as → Base64** → ra kết quả: `VLNT_burp_rulez!`

<!-- ẢNH: Chụp Decoder đã decode Base64 ra kết quả (bước 5). File: burp-suite-basics_04_decoder.png -->

> **Lưu ý:** Đây là kỹ năng nền — bài `crypto-basics` sẽ dạy đầy đủ. Ở đây chỉ cần biết Decoder nằm ở đâu.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Vì sao pentester cần Burp mà dev không dùng được?

- Dev thấy app theo "ý mình viết"; pentester thấy app theo "byte thực sự gửi".
- Burp phát hiện **input không được validate**: thử gửi giá trị lạ, header lạ, method lạ.
- Mọi lỗ hổng trong giáo trình này đều **bắt đầu bằng việc sửa request trong Burp**.

### Checklist dùng Burp hiệu quả

```text
[ ] Đã cấu hình proxy browser (127.0.0.1:8080)?
[ ] Đã tắt Intercept khi duyệt web bình thường (tránh treo)?
[ ] Khi muốn chỉnh request: bật Intercept → sửa → Forward
[ ] Khi thử nhiều payload: dùng Repeater thay vì sửa Intercept
[ ] Khi brute-force: dùng Intruder (chọn vị trí cần fuzz bằng §)
[ ] Khi gặp chuỗi lạ: dùng Decoder
[ ] Khi không biết request nào đang gửi: xem HTTP History
```

---

