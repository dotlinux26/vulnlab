# Fuzzing & Content Discovery — ffuf & gobuster

> **Độ khó:** Easy — **Trình độ:** beginner

## Giới thiệu

**Content Discovery** (khám phá nội dung) = dò tìm các thư mục, file, subdomain, parameter mà website không hiển thị công khai. **Fuzzing** = gửi hàng loạt giá trị (từ wordlist) vào một vị trí để xem cái nào server đáp ứng khác thường. Đây là kỹ năng recon active quan trọng nhất — và `ffuf` (Fast Fuzzer) là công cụ số 1, còn `gobuster` là anh em phổ biến thứ hai.

---

## Phần A — Hiểu (Understand)

### Fuzzing hoạt động thế nào?

```
ffuf -w wordlist.txt:FUZZ -u http://target/FUZZ

FFUF lần lượt thay FUZZ bằng từng dòng trong wordlist:
  FUZZ = admin     → GET /admin       → 200 ✔ (tìm thấy)
  FUZZ = secret    → GET /secret      → 200 ✔
  FUZZ = blahblah  → GET /blahblah    → 404 ✘ (không có)
```

> **Dễ hiểu:** Giống thử mở lần lượt mọi chìa khóa trong chùm chìa khóa (wordlist) vào mọi ổ khóa (endpoint). Cái nào mở được (status 200/301/302) thì ghi lại.

### Tải wordlist (SecLists)

Toàn bộ wordlist dùng trong bài đều nằm trong **SecLists** — tải một lần, dùng mãi:

```bash
# Cách 1: clone full repo (khuyên dùng — ~1.5GB)
git clone https://github.com/danielmiessler/SecLists /usr/share/seclists

# Cách 2: tải xuống (download zip)
# https://github.com/danielmiessler/SecLists/archive/refs/heads/master.zip

# Trên Kali, seclists có thể cài sẵn qua apt:
sudo apt update && sudo apt install -y seclists
```

> **Mẹo:** Nếu không muốn clone full (nặng), chỉ cần tải các file cần dùng:
> - Directory: `https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/directory-list-2.3-small.txt`
> - Extension: `.../Discovery/Web-Content/raft-small-extensions.txt`
> - Parameter: `.../Discovery/Web-Content/burp-parameter-names.txt`
> - Subdomain: `.../Discovery/DNS/subdomains-top1million-20000.txt`

### Ký hiệu FUZZ (placeholder)

ffuf dùng tên placeholder để đánh dấu vị trí chèn từ wordlist:

| Lệnh | Ý nghĩa |
|------|---------|
| `ffuf -w list.txt:FUZZ -u http://t/FUZZ` | Fuzz thư mục |
| `ffuf -w list.txt:FUZZ -u http://t/FUZZ.php` | Fuzz file .php |
| `ffuf -w list.txt:FUZZ -u http://t/ -H "Host: FUZZ.domain"` | Fuzz virtual host |
| `ffuf -w list.txt:FUZZ -u http://t/?id=FUZZ` | Fuzz parameter |

### Lọc kết quả rác — kỹ năng quan trọng

Server trả 404 nhưng đôi khi có `Size`/status khác lạ. Bạn cần **lọc (filter)** kết quả rác để chỉ giữ thứ đáng giá:

| Cờ (flag) | Ý nghĩa |
|-----------|---------|
| `-fc 404` | Filter theo status code |
| `-fs 1234` | Filter theo size (bytes) |
| `-fw 10` | Filter theo số từ (words) |
| `-fl 5` | Filter theo số dòng (lines) |
| `-fr "regex"` | Filter theo regex |

> **Mẹo:** Chạy lần đầu KHÔNG filter, xem `Size` phổ biến của 404 là bao nhiêu (vd `Size: 154`), rồi chạy lại với `-fs 154` để loại rác.

### ffuf vs gobuster

| | ffuf | gobuster |
|---|---|---|
| Tốc độ | Rất nhanh (bản Go) | Nhanh |
| Fuzz subdomain/vhost | ✅ | ✅ (mode `vhost`) |
| Fuzz parameter | ✅ (kể cả POST) | Không |
| Fuzz nhiều wordlist cùng lúc | ✅ | Không |
| Recursion (tự đào sâu thư mục) | `-recursion` | `-r` |

> **Khuyến nghị:** Học **ffuf** trước (linh hoạt hơn), dùng gobuster khi cần thao tác nhanh đơn giản.

---

## Phần B — Khai thác: Fuzz lab

> Bài này dùng **lab `ffuf-mastery`** có sẵn trên VULNLAB (không cần lab Docker riêng). Nếu học offline, bạn có thể fuzz chính lab `web-recon` (port 7102) ở bài trước.

### Bước 1: Fuzz thư mục — phát hiện trang ẩn

```bash
$ ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
       -u http://localhost:7102/FUZZ -t 80 -fs 154

admin                   [Status: 200, Size: 512, Words: 44]
backup                  [Status: 301, Size: 180, Words: 8]
config.php              [Status: 200, Size: 88, Words: 10]
dev_notes.txt           [Status: 200, Size: 64, Words: 8]
```

<!-- ẢNH: Chụp kết quả ffuf liệt kê các thư mục tìm thấy với -fs filter (bước 1). File: fuzzing-content-discovery_01_ffuf_dir.png -->

> **Giải thích:** `-t 80` = 80 threads (gửi 80 request song song). `-fs 154` = bỏ mọi response có size 154 (kích thước trang 404). Kết quả chỉ còn những gì thật sự tồn tại.

### Bước 2: Fuzz extension — tìm backup file

Dev hay chừa file backup: `index.php.bak`, `config.php.old`...

```bash
$ ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-small-extensions.txt:FUZZ \
       -u http://localhost:7102/FUZZ -fs 154

index.php.bak           [Status: 200, Size: 1024]
config.php.old          [Status: 200, Size: 512]
```

<!-- ẢNH: Chụp kết quả ffuf tìm thấy file backup (bước 2). File: fuzzing-content-discovery_02_ffuf_ext.png -->

> **Giải thích:** Fuzz extension bằng wordlist chứa `index.php.bak`, `index.php.txt`, `index.html`... Mỗi app khác nhau; backup file là nơi hay để lộ source code.

### Bước 3: Fuzz parameter — tìm tham số ẩn

App có thể nhận param mà form không hiển thị (`?debug=1`, `?admin=true`):

```bash
$ ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
       -u http://localhost:7102/?FUZZ=1 -fs 154

debug                   [Status: 200, Size: 640, Words: 12]
```

<!-- ẢNH: Chụp kết quả ffuf phát hiện param debug ẩn (bước 3). File: fuzzing-content-discovery_03_ffuf_param.png -->

### Bước 4: Fuzz virtual host (vhost) — tìm subdomain ẩn

Trong production, cùng 1 IP có thể host nhiều website (virtual host). Nginx chặn truy cập IP trực tiếp nhưng host ẩn vẫn tồn tại:

```bash
$ ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt:FUZZ \
       -u http://target/ -H "Host: FUZZ.target.com" -fs 154

admin                   [Status: 200, Size: 2200]
internal                [Status: 200, Size: 3400]
```

<!-- ẢNH: Chụp kết quả ffuf vhost fuzzing tìm thấy host ẩn (bước 4). File: fuzzing-content-discovery_04_ffuf_vhost.png -->

> **Giải thích:** Nếu server phản hồi **khác biệt** khi đổi `Host` header → có vhost ẩn. Khi tìm thấy, bạn thêm vào `/etc/hosts`:
> ```bash
> sudo sh -c 'echo "10.10.10.10 admin.target.com" >> /etc/hosts'
> ```

### Bước 5: gobuster — thao tác nhanh

```bash
$ gobuster dir -u http://localhost:7102 \
              -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt \
              -x php,txt,html -t 80 -b 404
```

<!-- ẢNH: Chụp kết quả gobuster dir liệt kê endpoint (bước 5). File: fuzzing-content-discovery_05_gobuster.png -->

> **Mẹo:** `-b 404` = bỏ trắng status 404 (tương đương filter), `-x php,txt,html` = chỉ tìm các đuôi file này.

---

## Phần C — Phòng thủ & Checklist (Defend)

### Cách giảm bề mặt bị fuzz

- **Không có "thư mục ẩn an toàn":** bảo mật bằng auth thật (2FA, IP allowlist), không bằng cách "không ai biết".
- **Xóa file backup** (`*.bak`, `*.old`, `~`) trước khi deploy; cấu hình web server chặn đuôi này.
- **Webserver trả 404 đồng nhất** cho mọi thứ không tồn tại (cùng size) — khó bị phân biệt khi fuzz.
- **Rate limit + WAF** cho endpoint nhạy cảm.
- **Không expose debug endpoint** (`?debug=1`, `?admin=true`).

### Checklist fuzzing

```text
[ ] Xác định kích thước 404 trước, rồi mới -fs filter
[ ] ffuf dir:  -u http://TARGET/FUZZ
[ ] ffuf ext:  -u http://TARGET/FUZZ  (wordlist raft-small-extensions)
[ ] ffuf file: -u http://TARGET/FUZZ.php  (thêm đuôi file)
[ ] ffuf param: -u http://TARGET/?FUZZ=1  (wordlist parameter-names)
[ ] ffuf vhost: -H "Host: FUZZ.domain.com"
[ ] Kiểm tra từng kết quả thủ công (đừng chỉ nhìn status 200)
```

---

## Bài tập check kiến thức

<!-- Dạng hỏi–trả lời. Gợi ý số ký tự ở đuôi câu (*****), đáp án tiếng Anh/số, ghi sẵn đáp án bên dưới. Chỉ lab mới có flag. -->

1. Công cụ "Fast Fuzzer" phổ biến nhất cho content discovery là gì? (****)
   - Đáp án: ffuf

2. Cờ nào trong ffuf dùng để loại bỏ kết quả rác theo kích thước response? (***)
   - Đáp án: -fs

3. Cờ nào để fuzz với nhiều luồng song song (vd 80)? (-t hoặc -____)
   - Đáp án: -t

4. Khi tìm thấy vhost ẩn, bạn cần thêm dòng vào file nào để truy cập? (********)
   - Đáp án: /etc/hosts

5. Wordlist phổ biến để fuzz directory trong Kali nằm ở đâu? (*****)
   - Đáp án: seclists
