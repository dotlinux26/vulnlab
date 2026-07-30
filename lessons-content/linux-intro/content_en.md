# Introduction to Linux

## What is Linux?

Linux is an open-source operating system based on the Unix kernel, created by **Linus Torvalds** in 1991. Unlike Windows or macOS, Linux is free, customizable, and widely used in servers, security, software development, and embedded systems.

> **Caption:** Linux Kernel logo – the symbol of the world's most popular open-source operating system.

---

## Why hackers/security students need Linux?

- Full system control.
- Most security tools run on Linux (Kali Linux).
- Terminal, scripting, file permission familiarity.
- Understand how the OS works from the ground up.

---

## Popular Distributions

| Distro | Description | Best for |
|--------|-------------|----------|
| **Ubuntu** | User-friendly, lots of docs | Beginners |
| **Kali Linux** | 600+ pre-installed pentest tools | Hackers, pentesters |
| **Debian** | Stable, minimal bugs | Servers |
| **Arch Linux** | DIY from scratch | Deep learners |
| **Fedora** | Cutting-edge, RHEL base | Developers |
| **CentOS / Rocky** | Enterprise-grade | Production servers |

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

## Linux System Architecture

```
Users ← Shell ← Filesystem ← Kernel ← Hardware
```

| Component | Function |
|-----------|----------|
| **Kernel** | Core OS – manages CPU, RAM, devices |
| **Shell** | Command-line interface (bash, zsh) |
| **Filesystem** | Directory structure (`/`, `/home`, `/etc`, `/var`, `/tmp`) |
| **User space** | Apps and services running on top of kernel |

---

## Linux Directory Structure

| Path | Purpose |
|------|---------|
| `/` | Root directory |
| `/bin` | Basic binaries (`ls`, `cat`, `echo`) |
| `/etc` | System configuration |
| `/home` | User home directories |
| `/var` | Variable data (logs, databases) |
| `/tmp` | Temporary files |
| `/usr` | User applications |
| `/proc` | Process info (virtual) |

---

## Basic Linux Commands

### 1. Navigation & File Operations

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

### 2. Viewing File Contents

```bash
user@linux:~$ cat hello.txt
Hello, Linux!
This is a text file.

user@linux:~$ head -n 3 /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin

user@linux:~$ tail -n 2 /etc/passwd
_apt:x:42:65534::/nonexistent:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
```

### 3. File Permissions

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

| Symbol | Meaning |
|--------|---------|
| `rwx` | Read, write, execute |
| `r-x` | Read, execute |
| `---` | No permissions |

### 4. Processes & System

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

### 5. Networking

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

The shell is the program that interprets your commands and talks to the kernel.

- **bash** – default on most distros
- **zsh** – enhanced (Oh My Zsh!)
- **fish** – friendly interactive shell with auto-suggestions

```bash
user@linux:~$ echo $SHELL
/bin/bash

user@linux:~$ which bash
/usr/bin/bash

user@linux:~$ bash --version
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
```

---

## Text Editors

| Editor | Notes |
|--------|-------|
| **nano** | Easy, shortcuts shown at bottom |
| **vim** | Powerful, steep learning curve |
| **VSCode** | GUI, popular for development |

```bash
user@linux:~$ nano file.txt
# Opens nano editor, Ctrl+O to save, Ctrl+X to exit

user@linux:~$ vim file.txt
# Opens vim, :q! to quit, :wq to save and quit
```

---

## Package Manager

| Distro | Command |
|--------|---------|
| Debian/Ubuntu | `apt install`, `apt update`, `apt upgrade` |
| Fedora | `dnf install` |
| Arch | `pacman -S` |
| Kali | `apt` (same as Ubuntu) |

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

## Practice Exercises

1. `ls` the `/` directory and explain each folder.
2. Use `touch` to create a file, `chmod 755`, verify with `ls -la`.
3. Run `ps aux | grep bash` and `kill` a process.
4. Use `ip a` to find your machine's IP.
5. Install a tool: `sudo apt install netcat-traditional -y && nc -h`.

---

> **Pro Tip:** Always use Tab for auto-completion, `Ctrl+C` to stop a process, `↑/↓` to recall previous commands.
