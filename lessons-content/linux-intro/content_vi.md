# Nhập Môn Linux

## Linux là gì?

Linux là một hệ điều hành mã nguồn mở dựa trên nhân (kernel) Unix, được tạo ra bởi **Linus Torvalds** vào năm 1991. Không giống như Windows hay macOS, Linux miễn phí, có thể tùy chỉnh và được sử dụng rộng rãi trong các máy chủ, bảo mật, phát triển phần mềm, và nhúng.

> **Mô tả:** Logo nhân Linux – biểu tượng của hệ điều hành mã nguồn mở phổ biến nhất thế giới.

---

## Tại sao hacker/học bảo mật cần biết Linux?

- Kiểm soát hoàn toàn hệ thống.
- Hầu hết công cụ bảo mật chạy trên Linux (Kali Linux).
- Quen thuộc với terminal, script, quyền file.
- Hiểu cách hệ thống hoạt động từ gốc.

---

## Các bản phân phối phổ biến

| Distro | Mô tả | Phù hợp cho |
|--------|-------|-------------|
| **Ubuntu** | Dễ dùng, nhiều tài liệu | Người mới |
| **Kali Linux** | Chứa sẵn 600+ công cụ pentest | Hacker, pentester |
| **Debian** | Ổn định, ít lỗi | Máy chủ |
| **Arch Linux** | Tự build từ đầu | Người muốn học sâu |
| **Fedora** | Công nghệ mới, có RHEL | Developer |
| **CentOS / Rocky** | Enterprise | Server production |

```
$ cat /etc/os-release
PRETTY_NAME="Ubuntu 24.04.1 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04.1 LTS (Noble Numbat)"
ID=ubuntu
```

```
$ cat /etc/os-release
PRETTY_NAME="Kali GNU/Linux Rolling"
NAME="Kali GNU/Linux"
ID=kali
VERSION="2024.3"
VERSION_CODENAME=kali-rolling
```

---

## Kiến trúc hệ thống Linux

```
Users ← Shell ← Filesystem ← Kernel ← Hardware
```

| Thành phần | Chức năng |
|------------|-----------|
| **Kernel** | Lõi HĐH, quản lý CPU, RAM, thiết bị |
| **Shell** | Giao diện dòng lệnh (bash, zsh) |
| **Filesystem** | Cấu trúc thư mục (`/`, `/home`, `/etc`, `/var`, `/tmp`) |
| **User space** | Ứng dụng và dịch vụ chạy trên kernel |

---

## Cấu trúc thư mục Linux

| Đường dẫn | Mục đích |
|-----------|----------|
| `/` | Root - thư mục gốc |
| `/bin` | Lệnh nhị phân cơ bản (`ls`, `cat`, `echo`) |
| `/etc` | Cấu hình hệ thống |
| `/home` | Thư mục người dùng |
| `/var` | Dữ liệu biến động (log, database) |
| `/tmp` | File tạm |
| `/usr` | Ứng dụng người dùng |
| `/proc` | Tiến trình hệ thống (ảo) |

---

## Các lệnh Linux cơ bản

### 1. Điều hướng & File

```bash
user@linux:~$ pwd
/home/user

user@linux:~$ ls
Documents  Downloads  Music  Pictures  projects

user@linux:~$ ls -la
total 32
drwxr-xr-x 5 user user 4096 Jul 30 10:15 .
drwxr-xr-x 3 root root 4096 Jul 30 10:10 ..
-rw------- 1 user user  234 Jul 30 10:15 .bash_history
drwxr-xr-x 2 user user 4096 Jul 30 10:12 Documents
drwxr-xr-x 2 user user 4096 Jul 30 10:12 Downloads
drwxr-xr-x 4 user user 4096 Jul 30 10:13 projects

user@linux:~$ cd projects
user@linux:~/projects$ mkdir lab
user@linux:~/projects$ touch file.txt
user@linux:~/projects$ cp file.txt copy.txt
user@linux:~/projects$ mv copy.txt lab/
user@linux:~/projects$ ls lab/
copy.txt

user@linux:~/projects$ rm file.txt
user@linux:~/projects$ rm -rf lab/
user@linux:~/projects$ ls
(nothing)
```

### 2. Xem nội dung file

```bash
user@linux:~$ cat hello.txt
Hello, Linux!
Day la mot file van ban.

user@linux:~$ head -n 3 /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin

user@linux:~$ tail -n 2 /etc/passwd
_apt:x:42:65534::/nonexistent:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
```

### 3. Quyền (Permission)

```bash
user@linux:~$ ls -l script.sh
-rw-r--r-- 1 user user 0 Jul 30 10:20 script.sh

user@linux:~$ chmod +x script.sh
user@linux:~$ ls -l script.sh
-rwxr-xr-x 1 user user 0 Jul 30 10:20 script.sh

user@linux:~$ chmod 755 script.sh
user@linux:~$ ls -l script.sh
-rwxr-xr-x 1 user user 0 Jul 30 10:20 script.sh
```

| Ký hiệu | Ý nghĩa |
|---------|---------|
| `rwx` | Đọc, ghi, thực thi |
| `r-x` | Đọc, thực thi |
| `---` | Không có quyền |

### 4. Tiến trình & Hệ thống

```bash
user@linux:~$ uname -a
Linux ubuntu 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux

user@linux:~$ free -h
               total        used        free      shared  buff/cache   available
Mem:           7.7Gi       2.3Gi       3.1Gi       245Mi       2.3Gi       5.0Gi
Swap:          2.0Gi        0.0Ki       2.0Gi

user@linux:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       117G   25G   86G  23% /

user@linux:~$ ps aux | head -5
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.3 102464 12704 ?        Ss   10:10   0:01 /sbin/init
root           2  0.0  0.0      0     0 ?        S    10:10   0:00 [kthreadd]
root          34  0.0  0.0      0     0 ?        I<   10:10   0:00 [oom_reaper]
user        1234  0.0  0.1  28764  6548 pts/0    Ss   10:15   0:00 -bash
```

### 5. Mạng

```bash
user@linux:~$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0

user@linux:~$ ping -c 2 google.com
PING google.com (142.250.80.14) 56(84) bytes of data.
64 bytes from hkg12s13-in-f14.1e100.net: icmp_seq=1 ttl=118 time=14.2 ms
64 bytes from hkg12s13-in-f14.1e100.net: icmp_seq=2 ttl=118 time=13.8 ms

--- google.com ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms

user@linux:~$ ss -tulpn | head -4
State    Recv-Q   Send-Q     Local Address:Port     Peer Address:Port   Process
LISTEN   0        4096       127.0.0.53%lo:53            0.0.0.0:*       users:(("systemd-resolve",pid=456,fd=14))
LISTEN   0        128        0.0.0.0:22                  0.0.0.0:*       users:(("sshd",pid=789,fd=3))
```

---

## Shell (Terminal)

Shell là chương trình nhận lệnh từ người dùng và giao tiếp với kernel.

- **bash** – mặc định hầu hết distro
- **zsh** – nâng cao hơn (Oh My Zsh!)
- **fish** – friendly interactive, tự gợi ý

```bash
user@linux:~$ echo $SHELL
/bin/bash

user@linux:~$ which bash
/usr/bin/bash

user@linux:~$ bash --version
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
```

---

## Trình soạn thảo văn bản

| Editor | Ghi chú |
|--------|---------|
| **nano** | Dễ dùng, phím tắt hiển thị dưới màn hình |
| **vim** | Mạnh mẽ, học hơi khó |
| **VSCode** | GUI, phổ biến cho dev |

```bash
user@linux:~$ nano file.txt
# Mở trình soạn thảo nano, Ctrl+O để lưu, Ctrl+X để thoát

user@linux:~$ vim file.txt
# Mở vim, :q! để thoát, :wq để lưu và thoát
```

---

## Package Manager (Quản lý gói)

| Distro | Lệnh |
|--------|------|
| Debian/Ubuntu | `apt install`, `apt update`, `apt upgrade` |
| Fedora | `dnf install` |
| Arch | `pacman -S` |
| Kali | `apt` (như Ubuntu) |

```bash
user@linux:~$ sudo apt update
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Hit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease
Hit:3 http://archive.ubuntu.com/ubuntu noble-security InRelease
Reading package lists... Done

user@linux:~$ sudo apt install nmap -y
Reading package lists... Done
Building dependency tree... Done
The following NEW packages will be installed:
  nmap
0 upgraded, 1 newly installed, 0 to remove, 0 not upgraded.
Unpacking nmap (7.94+git20231007-1) ...
Setting up nmap (7.94+git20231007-1) ...

user@linux:~$ nmap --version | head -2
Nmap version 7.94 ( https://nmap.org )
```

---

## Bài tập thực hành

1. `ls` thư mục `/` và giải thích từng thư mục.
2. Dùng `touch` tạo file, `chmod 755` và kiểm tra lại bằng `ls -la`.
3. Dùng `ps aux | grep bash` và `kill` để tắt một tiến trình.
4. Dùng `ip a` ghi lại địa chỉ IP của máy.
5. Cài thử một tool: `sudo apt install netcat-traditional -y && nc -h`.

---

> **Mẹo:** Luôn dùng tab để tự động hoàn thành lệnh, `Ctrl+C` để dừng tiến trình, `↑/↓` để xem lại lệnh cũ.
