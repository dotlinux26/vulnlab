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

---

## Phần B — Khai thác: Bắt & Sửa Request

### Bước 1: Khởi động lab

> 💡 **Lấy link lab:** Mở bài học này trên trang **Learning Detail** → bấm **"Truy cập Lab"** để hệ thống cấp link thực tế (VD: `https://vuln.ghedahaui.online/labs-env/...`). Thay `<LAB_ADDRESS>` bằng link đó trong các lệnh dưới đây.

# Lab tại: <LAB_ADDRESS> — một app PHP echo lại request của bạn

### Bước 2: Bật Intercept và bắt request

1. Mở Burp -> tab **Proxy** -> tab **Intercept** -> Mở Browser với nút **Open Browser**.

![image](/uploads/image_1786487558298_likeig.png)

2. Lúc này một trình duyệt tích hợp trên burp sẽ nhảy ra, tiến hành truy cập lab tại đường dẫn `<LAB_ADDRESS>/?name=admin` và bấm Enter.

![image](/uploads/image_1786487711305_7dyceq.png)

3. Chúng ta nhận thấy đây là 1 bài lab mà ứng dụng sẽ quét tham số bất kì trên URL scheme (cụ thể là tham số name trong bước số 2.) và được HTML render lại thông qua ô hiển thị trong Website.

4. Tiến hành trở lại Burp mở chức năng lắng nghe trung gian Proxy - **Intercept On**. Rồi thử tải lại trang!

![image](/uploads/image_1786487958936_ydhv5j.png)

> Có thể thấy thao tác tải lại trang trên trình duyệt đang bị treo? Chính xác là như vậy với tính năng intercept trên Burp request trên trình duyệt đã được đồng bộ và gửi qua kênh proxy vào thẳng Burp.

### Bước 3: Chỉnh sửa request ngay tại Intercept

Trong cửa sổ Intercept, bạn thấy toàn bộ request thô:

```http
GET /?name=admin HTTP/1.1
Host: localhost:7101
User-Agent: Mozilla/5.0 ...
Accept: text/html,...
Connection: close
```

Hãy **sửa** dòng `name=admin` thành `name=<script>alert(1)</script>` rồi bấm **Forward**:

![image](/uploads/image_1786488418148_gr8d3s.png)

> Bạn nhận thấy chúng ta đã vừa kích hoạt một đoạn mã javascript khiến trình duyệt gặp lỗi khi hiển thị. Đây chính là lỗ hổng XSS kinh điển mà chúng ta sẽ học trong các bài tới.

> Bạn cũng có thể thấy việc chỉnh tay **query string** qua url search bar hay qua burp cơ bản cũng giống nhau với phép thử trên.

### Bước 4: Gửi lại với Repeater

![image](/uploads/image_1786488655243_h7s4qv.png)

1. Trong tab **HTTP History**, tìm request `GET /?name=...`, click phải → **Send to Repeater** (hoặc phím Ctrl+R).
2. Sang tab **Repeater**, sửa `?name=..` thành giá trị mới. Lưu lại với tổ hợp phím Ctrl + S -> rồi bấm **Send**.

![image](/uploads/image_1786488874922_xtvx36.png)

3. Quan sát **response** bên phải. (Ở đây response có nhiều tùy chọn hiển thị, nhưng thông thường chúng tôi sẽ quan tâm ở chế độ hiển thị mã nguồn)

> Bạn có thể thử nhiều payload khác nhau và có thể nhận ra việc quan sát cách mà server trả về quan Burp suite có thể nhanh và dễ quan sát các thay đổi hơn là giao diện đồ họa của browser.

```http
GET /?name=waooo HTTP/1.1
Host: <...>
```
![image](/uploads/image_1786489049896_s5dvh6.png)

### Bước 5: Dùng Decoder để giải mã

Trong lab thường gặp chuỗi mã hóa. Tab **Decoder**:

1. Dán chuỗi `VkxOVF9idXJwX3J1bGV6IQ==` vào Decoder.
2. Chọn **Decode as → Base64** → ra kết quả: `VLNT_burp_rulez!`

![image](/uploads/image_1786489188359_ai1z3p.png)

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
