# HTTP, HTTPS, DNS & Web Request

## Giao thức HTTP là gì?

HTTP (HyperText Transfer Protocol) là **giao thức** để trình duyệt (browser) và web server **nói chuyện** với nhau. Một request gồm: **phương thức** (GET/POST...), **đường dẫn** (path), **header**, và đôi khi là **body** (dữ liệu gửi kèm).

```
[ Bạn / Browser ] ──── HTTP request ────> [ Web Server ]
[ Bạn / Browser ] <─── HTTP response ─── [ Web Server ]
```

> **Dễ hiểu:** HTTP là "thói quen nói chuyện" giữa trình duyệt và máy chủ. Hai bên thống nhất: bạn hỏi kiểu gì, máy chủ trả lời kiểu gì. **HTTPS** = cùng giao thức đó nhưng tất cả nội dung đều bị **mã hóa**.

---

## Request và Response là gì?

Mọi giao tiếp web đều gồm đúng 2 phần: **Request** (lời yêu cầu) và **Response** (lời hồi đáp). Trình duyệt gửi **request**, server trả **response**. Không có cái nào thì không thành cuộc nói chuyện.

```
[BẠN]  ─── 1. REQUEST (hỏi)  ───►  [SERVER]
[BẠN]  ◄── 2. RESPONSE (trả lời) ──  [SERVER]
```

### REQUEST (yêu cầu) gồm những gì?

Khi bạn mở `https://vuln.ghedahaui.online`, trình duyệt âm thầm gửi đi một thứ như thế này:

```http
GET / HTTP/1.1
Host: vuln.ghedahaui.online
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0
Accept: text/html,application/xhtml+xml
Accept-Language: vi-VN,vi;q=0.9,en;q=0.8
Cookie: session=abc123xyz
```

| Thành phần | Ý nghĩa | Dễ hiểu |
|------------|---------|---------|
| **Dòng đầu** `GET / HTTP/1.1` | Method + Path + Phiên bản HTTP | "Tao muốn **lấy** trang **gốc** (/)" |
| **Host** | Tên miền mình đang gọi | "Tao tìm nhà **vuln.ghedahaui.online**" |
| **User-Agent** | Trình duyệt/hệ điều hành của bạn | "Tao là Chrome trên Windows" |
| **Accept** | Kiểu nội dung bạn chấp nhận nhận về | "Trả cho tao HTML nhé" |
| **Accept-Language** | Ngôn ngữ bạn ưa thích | "Tiếng Việt là nhất" |
| **Cookie** | Giấy chứng minh phiên đăng nhập | "Tao là Đức, tao có thẻ này" |
| **Body** (nếu POST) | Dữ liệu gửi kèm | "Đây user/pass nè" |

### RESPONSE (hồi đáp) gồm những gì?

Server trả về thứ như thế này:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Server: nginx/1.18.0
Set-Cookie: session=NEW_TOKEN; Path=/; HttpOnly

<html>... nội dung trang web ...</html>
```

| Thành phần | Ý nghĩa | Dễ hiểu |
|------------|---------|---------|
| **Dòng đầu** `HTTP/1.1 200 OK` | Phiên bản + **Status Code** + lý do | "**200** = OK ngon lành" |
| **Content-Type** | Kiểu nội dung trả về | "Đây là HTML" |
| **Server** | Phần mềm server (nginx/apache...) | "Tao chạy bằng nginx" |
| **Set-Cookie** | Server đặt cookie cho bạn | "Cầm thẻ này lần sau vào thẳng" |
| **Body** | Nội dung thật sự (HTML, JSON, ảnh...) | "Đây trang web nè" |

> **Mẹo pentest:** Đọc request để biết server **kỳ vọng điều gì** (header, cookie, body). Đọc response để biết server **dùng gì và khen chê ra sao** (status code, Set-Cookie, Server header, thời điểm response về). Toàn bộ kỹ thuật web đều xoay quanh việc chỉnh sửa **request** rồi quan sát **response**.

---

## HTTP Methods – GET, POST, PUT, DELETE...

Các phương thức HTTP phổ biến:

| Method | Mục đích | Ví dụ |
|--------|----------|-------|
| **GET** | **Lấy** dữ liệu | Mở trang web, xem profile |
| **POST** | **Gửi** dữ liệu tạo mới | Đăng nhập, tạo bài viết |
| **PUT** | Gửi dữ liệu **cập nhật toàn bộ** | Sửa bài viết |
| **PATCH** | Cập nhật **một phần** | Sửa mỗi tên user |
| **DELETE** | Xóa dữ liệu | Xóa bài viết |
| **HEAD** | Giống GET nhưng chỉ lấy header | Kiểm tra server sống không |
| **OPTIONS** | Hỏi server chấp nhận method nào | Khảo sát API |

```
GET  /profile           → trả về trang profile
POST /login             → gửi user/pass, nhận lại session
PUT  /user/5            → thay nguyên user số 5
DELETE /post/99         → xóa bài số 99
```

> **Dễ hiểu:** GET là **"cho xem"**, POST là **"đưa vào"**, PUT là **"thay nguyên cái đó"**, DELETE là **"vứt đi"**. Nhớ cái này khi chơi web pentest: đôi khi server quên kiểm tra method → chúng ta đổi GET thành POST để lách.

---

## HTTP Status Codes (Mã phản hồi)

Mỗi lần server trả lời, nó kèm theo một **mã 3 số** cho biết kết quả. Có 5 nhóm:

| Nhóm | Ý nghĩa | Dễ hiểu |
|------|---------|---------|
| **1xx** | Thông tin | "Khoan, đang xử lý..." |
| **2xx** | Thành công | "Ok ngon" |
| **3xx** | Chuyển hướng | "Đi chỗ khác kìa" |
| **4xx** | Lỗi từ client | "Mày gửi sai rồi" |
| **5xx** | Lỗi từ server | "Tao (server) đang chập chờn" |

### Các mã quan trọng nhất

| Code | Tên | Nghĩa |
|------|-----|-------|
| **200** | OK | Thành công, có dữ liệu |
| **201** | Created | Tạo mới thành công |
| **301** | Moved Permanently | Chuyển hướng vĩnh viễn |
| **302** | Found | Chuyển hướng tạm thời |
| **400** | Bad Request | Request sai cú pháp |
| **401** | Unauthorized | Chưa đăng nhập |
| **403** | Forbidden | Đã xác thực nhưng không có quyền |
| **404** | Not Found | Không tìm thấy trang |
| **405** | Method Not Allowed | Dùng sai method |
| **429** | Too Many Requests | Spam quá nhiều |
| **500** | Internal Server Error | Server lỗi nội bộ |
| **502/503/504** | Gateway / Unavailable / Timeout | Server trung gian lỗi |

```
$ curl -s -o /dev/null -w "%{http_code}\n" https://vuln.ghedahaui.online
200
```

> **Mẹo pentest:** `403` thường nghĩa là **có thứ gì đó ở đó** nhưng bị chặn → thử vượt qua bằng path traversal, header, method khác. `200` trả về nhanh bất thường với mọi URL → có thể là catch-all.

---

## DNS – "Sổ địa chỉ" của Internet

DNS (Domain Name System) **dịch tên miền** (dễ nhớ) thành **IP** (máy móc mới hiểu). Con người nhớ `google.com`, máy tính cần `142.250.196.78`.

```
Bạn gõ: vuln.ghedahaui.online
            │
            ▼
      [ DNS Server ]
            │ hỏi: "vuln.ghedahaui.online là IP nào?"
            │ trả về: 140.xxx.xx.xx
            ▼
   Browser nối tới IP đó trên port 443 (HTTPS)
```

**Các bản ghi DNS quan trọng:**

| Loại | Dùng để | Ví dụ |
|------|---------|-------|
| **A** | Tên miền → IPv4 | `ghedahaui.online → 140.xxx.xx.xx` |
| **AAAA** | Tên miền → IPv6 | ... |
| **CNAME** | Bí danh cho tên miền khác | `www → ghedahaui.online` |
| **MX** | Mail server | ... |
| **NS** | Name server | ... |
| **TXT** | Dữ liệu text (xác minh) | SPF, DKIM |

**Tools kiểm tra DNS:**

```bash
nslookup vuln.ghedahaui.online
dig vuln.ghedahaui.online
host vuln.ghedahaui.online

# Brute-force subdomain để tìm mục tiêu ẩn
ffuf -u https://vuln.ghedahaui.online -H "Host: FUZZ.ghedahaui.online" \
     -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt -fc 404
```

> **Liên hệ pentest:** Các bài lab recon (như **Ffuf Mastery** của tụi mình) là tìm **VHost/subdomain ẩn** qua DNS + Host header. DNS là kho báu đầu tiên khi recon.

---

## API là gì?

API (Application Programming Interface) là **"thực đơn"** mà một chương trình đưa ra để chương trình khác gọi. Web API thường dùng HTTP + JSON.

```
[ Client (web/app) ] ──GET /api/users──> [ Server ]
                       <── JSON ──
```

**Ví dụ một response API:**

```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Đức Nguyễn",
    "level": 12,
    "xp": 11180,
    "role": "admin"
  }
}
```

**Truy cập API có thể là public hoặc cần key:**

```bash
# API công khai
curl https://api.github.com/users/octocat

# API cần key (Authorization header)
curl -H "Authorization: Bearer <TOKEN>" https://api.example.com/me
```

> **Pentest liên quan:** API thường mở các endpoint như `/api/users/1`, `/api/users/2`... Nếu server không kiểm tra quyền → **IDOR** (chỉ cần đổi số là vào tài khoản người khác). Chính là lỗ hổng anh bạn `67b1105f...` dùng để leo admin ngày xưa đó!

---

## curl – Công cụ gửi request

`curl` là công cụ dòng lệnh để gửi/nhận dữ liệu qua mạng. Là **bạn thân của mọi pentester**.

### Cú pháp & flag quan trọng

```bash
curl URL                          # GET mặc định, in response ra màn hình
curl -X POST URL                  # Đổi method thành POST
curl -d 'user=admin&pass=123' URL # Gửi body dạng form (POST)
curl -H "Header: value" URL       # Thêm header tùy chỉnh
curl -L URL                       # Tự theo redirect (3xx)
curl -o file.html URL             # Lưu response vào file
curl -s URL                       # Silent – không in progress bar
curl -v URL                       # Verbose – in ra chi tiết request/response
curl -i URL                       # In cả response header
curl -k URL                       # Bỏ qua check SSL (HTTPS lỗi chứng chỉ)
curl -u user:pass URL             # Gửi Basic Auth
curl -c cookies.txt URL           # Lưu cookie vào file
curl -b cookies.txt URL           # Gửi kèm cookie từ file
```

### Ví dụ thực tế

```bash
# 1. Xem chi tiết mọi thứ diễn ra
curl -v https://vuln.ghedahaui.online
# → hiện: request method, headers gửi đi, response headers, body

# 2. Xem riêng status code
curl -s -o /dev/null -w "%{http_code}\n" https://vuln.ghedahaui.online
# → 200

# 3. Gửi POST đăng nhập
curl -X POST https://vuln.ghedahaui.online/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"123"}'

# 4. Xem thời gian phản hồi
curl -s -o /dev/null -w "time_total: %{time_total}s\n" https://vuln.ghedahaui.online
```

> **Giải thích kết hợp flag:** `-s` bỏ progress bar (output sạch), `-o /dev/null` vứt body đi (chỉ cần header), `-w` in ra thông tin tùy biến như `%{http_code}`.

---

## wget – Tải file

`wget` chuyên dùng để **tải file** về máy, hỗ trợ tải lại tiếp khi ngắt.

```bash
wget URL                    # Tải file về thư mục hiện tại
wget -O ten_file URL        # Đổi tên file khi lưu
wget -r URL                 # Tải đệ quy cả trang
wget -q URL                 # Silent
wget -P /path/ URL          # Lưu vào thư mục chỉ định
```

> **curl vs wget:** Tải file đơn giản → `wget`. Cần test API, gửi request, điều chỉnh header → `curl`. Pentest dùng **curl nhiều hơn hẳn**.

---

## Invoke-WebRequest – curl bên PowerShell

Trên Windows, bạn dùng `Invoke-WebRequest` (viết tắt `iwr`) hoặc `Invoke-RestMethod` (`irm`):

```powershell
# Giống curl -v
Invoke-WebRequest https://vuln.ghedahaui.online

# GET và xem nội dung
$r = Invoke-WebRequest https://vuln.ghedahaui.online
$r.StatusCode
$r.Content

# POST với body
Invoke-RestMethod -Method Post -Uri https://vuln.ghedahaui.online/api/login `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"123"}'

# Thêm header
Invoke-WebRequest -Uri https://api.example.com/me -Headers @{Authorization="Bearer TOKEN"}
```

> **Ghi nhớ:** PowerShell có alias: `curl` trên Windows **cũng gọi** Invoke-WebRequest. Nên lệnh `curl` trong terminal Windows ≠ `curl` Linux. Pentest thường dùng Kali nên cứ `curl` chuẩn.

---

## certutil – Tool Windows hay bị lợi dụng

`certutil` là tool Windows để quản lý **chứng chỉ số** (certificate). Nhưng hacker thường lợi dụng nó để **tải file** vì nó hợp pháp, ít bị antivirus soi.

```cmd
:: Tải file về máy
certutil -urlcache -f -split https://vuln.ghedahaui.online/file.exe payload.exe

:: Tính hash MD5 của file (hay dùng để check checksum)
certutil -hashfile payload.exe MD5
```

> **Cảnh giác:** Trong post-exploitation, `certutil` là kỹ thuật phổ biến để tải payload qua HTTP mà không cần wget/curl. Giờ ai thấy lệnh này trong log cũng biết mục đích của nó rồi :))

---

## URL structure – Cấu trúc URL

Cần hiểu từng phần của URL để thao túng khi pentest:

```
  https://user:pass@vuln.ghedahaui.online:443/path/to/page?id=5&x=1#section
 │      │                                │     │             │    │
 │      │                                │     │             │    └─ Fragment
 │      │                                │     │             └─ Query string (?key=value)
 │      │                                │     └─ Path (đường dẫn)
 │      │                                └─ Port (mặc định: http=80, https=443)
 │      └─ User:Pass (hiếm khi dùng)
 └─ Scheme (http/https)
```

> **Slug** = phần path dễ đọc, ví dụ trong `https://vuln.ghedahaui.online/labs/fuf-mastery` thì `fuf-mastery` là slug. **Không nhầm với HTTP method** nhé!

---

## Bài test: Curl thử VULNLAB!

Mở terminal Kali và chạy từng lệnh sau:

```bash
# 1. Xem trang chủ VULNLAB (toàn bộ HTML trả về)
curl https://vuln.ghedahaui.online

# 2. Chỉ xem header – máy chủ đang chạy gì?
curl -I https://vuln.ghedahaui.online

# 3. Xem chi tiết request/response
curl -v https://vuln.ghedahaui.online

# 4. Status code của trang chủ
curl -s -o /dev/null -w "HTTP status: %{http_code}\n" https://vuln.ghedahaui.online

# 5. Thử một trang không tồn tại → đoán kết quả gì?
curl -s -o /dev/null -w "HTTP status: %{http_code}\n" https://vuln.ghedahaui.online/not-exist-123

# 6. Xem một endpoint API của hệ thống
curl -s https://vuln.ghedahaui.online/api/leaderboard | head -50
```

**Câu hỏi suy luận:**

1. Lệnh số 4 trả về code gì? (Đáp án: `200`)
2. Lệnh số 5 trả về code gì? (Đáp án: `404` – hoặc nếu server có catch-all sẽ là `200`, hãy để ý!)
3. Ở lệnh `-v`, bạn thấy header nào đáng chú ý nhất? (`Server`, `Set-Cookie`, `Location`...)
4. Nếu dùng `http://` thay vì `https://`, bạn thấy code `301/302` không? Vì sao?

> **Mục tiêu bài test:** Làm quen đọc output của curl, đọc status code, và quan sát header – nền tảng cho mọi bài pentest web sau này.

---

## Tổng kết nhanh

> - **HTTP** = giao thức web, **HTTPS** = HTTP mã hóa (TLS).
> - **HTTP Methods** = GET/POST/PUT/DELETE... (đừng gọi là slug nhé :)) ). **Slug** = phần tên dễ đọc trong URL.
> - **Status code** = 2xx ok, 3xx redirect, 4xx lỗi client, 5xx lỗi server.
> - **DNS** = sổ địa chỉ tên miền → IP.
> - **API** = thực đơn cho chương trình gọi nhau (thường HTTP + JSON).
> - **curl** = gửi request mọi kiểu, **wget** = tải file, **Invoke-WebRequest** = curl trên Windows, **certutil** = tải file kiểu "hợp pháp" trên Windows.
