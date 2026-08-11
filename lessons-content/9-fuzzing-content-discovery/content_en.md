# Fuzzing & Content Discovery — ffuf & gobuster

> **Difficulty:** Easy — **Level:** beginner

## Introduction

**Content Discovery** = finding directories, files, subdomains, and parameters a website does not publicly show. **Fuzzing** = sending a flood of values (from a wordlist) into one position to see which ones get an unusual response. This is the most important active recon skill — and `ffuf` (Fast Fuzzer) is the #1 tool, with `gobuster` a close second.

---

## Part A — Understand

### How does fuzzing work?

```
ffuf -w wordlist.txt:FUZZ -u http://target/FUZZ

FFUF replaces FUZZ with each line of the wordlist:
  FUZZ = admin     → GET /admin       → 200 ✔ (found)
  FUZZ = secret    → GET /secret      → 200 ✔
  FUZZ = blahblah  → GET /blahblah    → 404 ✘ (not found)
```

> **Analogy:** Like trying every key in a keyring (wordlist) on every lock (endpoint). Any that open (status 200/301/302) get recorded.

### Download wordlists (SecLists)

All wordlists used in this lesson live in **SecLists** — download once, use forever:

```bash
# Option 1: clone the full repo (recommended — ~1.5GB)
git clone https://github.com/danielmiessler/SecLists /usr/share/seclists

# Option 2: download zip
# https://github.com/danielmiessler/SecLists/archive/refs/heads/master.zip

# On Kali, seclists can be installed via apt:
sudo apt update && sudo apt install -y seclists
```

> **Tip:** If you don't want the full clone (it's heavy), just grab the files you need:
> - Directory: `https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/directory-list-2.3-small.txt`
> - Extension: `.../Discovery/Web-Content/raft-small-extensions.txt`
> - Parameter: `.../Discovery/Web-Content/burp-parameter-names.txt`
> - Subdomain: `.../Discovery/DNS/subdomains-top1million-20000.txt`

### The FUZZ placeholder

ffuf uses a placeholder name to mark where wordlist values get inserted:

| Command | Meaning |
|---------|---------|
| `ffuf -w list.txt:FUZZ -u http://t/FUZZ` | Fuzz directories |
| `ffuf -w list.txt:FUZZ -u http://t/FUZZ.php` | Fuzz .php files |
| `ffuf -w list.txt:FUZZ -u http://t/ -H "Host: FUZZ.domain"` | Fuzz virtual hosts |
| `ffuf -w list.txt:FUZZ -u http://t/?id=FUZZ` | Fuzz parameters |

### Filtering junk results — the key skill

Servers sometimes return 404 with unusual `Size`/status. You need to **filter** junk to keep only what matters:

| Flag | Meaning |
|------|---------|
| `-fc 404` | Filter by status code |
| `-fs 1234` | Filter by size (bytes) |
| `-fw 10` | Filter by word count |
| `-fl 5` | Filter by line count |
| `-fr "regex"` | Filter by regex |

> **Tip:** Run once WITHOUT filters, note the common `Size` of 404 responses (e.g. `Size: 154`), then rerun with `-fs 154` to remove junk.

### ffuf vs gobuster

| | ffuf | gobuster |
|---|---|---|
| Speed | Very fast (Go binary) | Fast |
| Subdomain/vhost fuzz | ✅ | ✅ (`vhost` mode) |
| Parameter fuzz (incl. POST) | ✅ | No |
| Multiple wordlists at once | ✅ | No |
| Recursion (dig into folders) | `-recursion` | `-r` |

> **Recommendation:** Learn **ffuf** first (more flexible), use gobuster for quick/simple tasks.

---

## Part B — Exploit: Fuzz the lab

> This lesson uses the existing **`ffuf-mastery`** lab on VULNLAB (no separate Docker lab needed). If studying offline, fuzz the `web-recon` lab (port 7102) from the previous lesson.

### Step 1: Fuzz directories — find hidden pages

```bash
$ ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
       -u <LAB_ADDRESS>/FUZZ -t 80 -fs 154

admin                   [Status: 200, Size: 512, Words: 44]
backup                  [Status: 301, Size: 180, Words: 8]
config.php              [Status: 200, Size: 88, Words: 10]
dev_notes.txt           [Status: 200, Size: 64, Words: 8]
```



> **Explanation:** `-t 80` = 80 threads (80 parallel requests). `-fs 154` = drop every response with size 154 (the 404 page size). Only real hits remain.

### Step 2: Fuzz extensions — find backup files

Developers often leave backups: `index.php.bak`, `config.php.old`...

```bash
$ ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-small-extensions.txt:FUZZ \
       -u <LAB_ADDRESS>/FUZZ -fs 154

index.php.bak           [Status: 200, Size: 1024]
config.php.old          [Status: 200, Size: 512]
```



> **Explanation:** Fuzz extensions with a wordlist containing `index.php.bak`, `index.php.txt`, `index.html`... Every app differs; backup files often leak source code.

### Step 3: Fuzz parameters — find hidden parameters

The app may accept params not shown in forms (`?debug=1`, `?admin=true`):

```bash
$ ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
       -u <LAB_ADDRESS>/?FUZZ=1 -fs 154

debug                   [Status: 200, Size: 640, Words: 12]
```



### Step 4: Fuzz virtual hosts — find hidden subdomains

In production, one IP can host many websites (virtual hosts). Nginx may block direct IP access but hidden hosts still exist:

```bash
$ ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt:FUZZ \
       -u http://target/ -H "Host: FUZZ.target.com" -fs 154

admin                   [Status: 200, Size: 2200]
internal                [Status: 200, Size: 3400]
```



> **Explanation:** If the server responds **differently** when you change the `Host` header → there's a hidden vhost. When found, add it to `/etc/hosts`:
> ```bash
> sudo sh -c 'echo "10.10.10.10 admin.target.com" >> /etc/hosts'
> ```

### Step 5: gobuster — quick mode

```bash
$ gobuster dir -u <LAB_ADDRESS> \
              -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt \
              -x php,txt,html -t 80 -b 404
```



> **Tip:** `-b 404` = blank out 404 status (equivalent to filtering), `-x php,txt,html` = only hunt these file extensions.

---

## Part C — Defend & Checklist

### How to reduce your fuzzable surface

- **No "safe hidden directory":** secure with real auth (2FA, IP allowlist), not by "nobody knowing".
- **Delete backup files** (`*.bak`, `*.old`, `~`) before deploy; configure the web server to block these extensions.
- **Return uniform 404s** for everything missing (same size) — hard to distinguish while fuzzing.
- **Rate limit + WAF** for sensitive endpoints.
- **Don't expose debug endpoints** (`?debug=1`, `?admin=true`).

### Fuzzing checklist

```text
[ ] Determine the 404 size first, then -fs filter
[ ] ffuf dir:  -u http://TARGET/FUZZ
[ ] ffuf ext:  -u http://TARGET/FUZZ  (raft-small-extensions wordlist)
[ ] ffuf file: -u http://TARGET/FUZZ.php  (append extension)
[ ] ffuf param: -u http://TARGET/?FUZZ=1  (parameter-names wordlist)
[ ] ffuf vhost: -H "Host: FUZZ.domain.com"
[ ] Manually verify each hit (don't just trust status 200)
```

---

