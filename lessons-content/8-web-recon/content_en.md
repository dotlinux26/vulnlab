# Web Recon — Web Application Reconnaissance

> **Difficulty:** Easy — **Level:** beginner

## Introduction

**Recon (reconnaissance)** is the phase of gathering information about a target before attacking — and it **determines 80% of your success**. In web pentesting, recon means finding out what technology the app runs on, what pages it has, what endpoints are hidden, and what developers have leaked. The more info you have, the better you know where to attack.

---

## Part A — Understand

### What is web recon?

Every web app "tells a story" about itself. Your job is to listen:

```
Information source                →  Reveals
robots.txt, sitemap.xml           →  directories/pages dev wants hidden
View-source (HTML/JS)             →  hidden comments, endpoints, API keys
Response headers                  →  server, framework, version
Error pages (404, 500, debug)     →  language, framework, internal paths
whatweb / wappalyzer              →  technology, versions, CMS
Directory scanning (dir)          →  hidden pages, backups, admin panels
```

> **Analogy:** Like observing a house before entering (in a legal sense): check the license plate (tech stack), the trash (robots.txt, comments), the windows (hidden endpoints)... before deciding which lock to pick.

### Active vs Passive Recon

| | Passive | Active |
|---|---|---|
| Touches the target? | No — only observes | Yes — sends requests |
| Sources | Search engines, certificate transparency, WHOIS | curl, ffuf, nmap, whatweb |
| Detection risk | Very low | Higher |
| Examples | Google dorking, crt.sh | directory scan, nmap |

> **Tip:** Always do **passive first, active second**. Passive gives you the "map"; active confirms the details.

### Google Dork — search with Google itself

Google can find leaked files/info on a website:

| Dork | Meaning |
|------|---------|
| `site:example.com` | All indexed pages of the domain |
| `site:example.com filetype:sql` | Leaked .sql files |
| `site:example.com intitle:"index of"` | Open directory listing |
| `inurl:admin` | Admin page |
| `intitle:"login" inurl:php` | PHP login page |

> ⚠️ **For labs:** Your Docker labs are not on the internet so Google dorks don't apply — this is a real-world recon skill to remember. In labs we use the "active" methods below.

---

## Part B — Exploit: Recon the `web-recon` lab

### Step 1: Start the lab

```bash
cd web-recon/lab
docker compose up -d
# Lab at: http://localhost:7102
```

The lab simulates a "normal-looking" website hiding many things: robots.txt reveals hidden directories, a comment in the source, leaked server headers, and an admin panel not in the menu.

### Step 2: Read robots.txt — the hidden directory map

```bash
$ curl -s http://localhost:7102/robots.txt
User-agent: *
Disallow: /hidden/
Disallow: /backup/
Disallow: /config.php
```



> **Explanation:** `robots.txt` is meant to block crawlers — but attackers read it as a **list of valuable directories**. Developers often leak things here that should be better hidden.

### Step 3: Read the HTML source — find hidden comments

```bash
$ curl -s http://localhost:7102/ | grep -iE "comment|hidden|todo|flag|admin"
```



> **Explanation:** Developers often leave comments like `<!-- TODO: change admin password -->` or `<!-- link: /dev_notes.txt -->`. This is a goldmine for recon.

### Step 4: Technology fingerprinting

```bash
$ whatweb http://localhost:7102
# Sample: Apache[2.4.57], PHP[8.2.12], ...
```

View the raw server headers:

```bash
$ curl -sI http://localhost:7102
HTTP/1.1 200 OK
Server: Apache/2.4.57 (Debian)
X-Powered-By: PHP/8.2.12
```



> **Explanation:** Knowing `Apache 2.4.57 + PHP 8.2.12` tells you which PHP bugs and Apache configs to test. `Server`/`X-Powered-By` headers are a **Security Misconfiguration (A05)** — devs should hide the version.

### Step 5: Discover endpoints with gobuster

```bash
$ gobuster dir -u http://localhost:7102 -w /usr/share/seclists/Discovery/Web-Content/common.txt -t 20 -x php,txt,html
```

> **Wordlist:** The `common.txt` file lives in **SecLists** — download at `https://github.com/danielmiessler/SecLists` (or `sudo apt install -y seclists`). The `fuzzing-content-discovery` lesson covers full setup.



Sample result:

```text
/admin                (Status: 200) [Size: 512]
/backup               (Status: 301) [Size: 180]
/config.php           (Status: 200) [Size: 88]
/hidden               (Status: 301) [Size: 180]
```

### Step 6: Exploit the gathered info

Visit `/config.php` — this lab "carelessly" shows its config contents:

```bash
$ curl -s http://localhost:7102/config.php
DB_HOST=localhost
DB_USER=root
DB_PASS=Sup3rS3cr3t
FLAG=FLAG{r3c0n_f1rst_2026}
```



> **Recon chain summary:** robots.txt → found `/config.php` → read the flag. No "hacking" needed — just careful searching. This is why recon is the most important phase.

---

## Part C — Defend & Checklist

### How developers avoid being "reconned"

- **Don't put secrets in robots.txt** — use real auth instead of hiding paths.
- **Remove sensitive comments** from source before deploy (or minify builds).
- **Hide server version:** `ServerTokens Prod` (Apache), `expose_php = Off` (PHP).
- **Disable directory listing** (`Options -Indexes`).
- **Limit error pages:** no stack traces, no internal paths.
- **Config files go OUTSIDE the document root**, never web-accessible.

### Quick web recon checklist

```text
[ ] curl -s http://TARGET/robots.txt
[ ] curl -s http://TARGET/sitemap.xml
[ ] View-source homepage → find comments, links, API keys
[ ] curl -sI http://TARGET/  → read Server + X-Powered-By
[ ] whatweb http://TARGET/   → technology + version
[ ] gobuster dir -u http://TARGET -w common.txt -x php,txt
[ ] Scan every endpoint you find (don't skip any)
```

---

