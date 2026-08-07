# HTTP, HTTPS, DNS & Web Requests

## What is HTTP?

HTTP (HyperText Transfer Protocol) is the **protocol** browsers and web servers use to **talk** to each other. A request consists of: **method** (GET/POST...), **path**, **headers**, and sometimes a **body** (data sent along).

```
[ You / Browser ] ──── HTTP request ────> [ Web Server ]
[ You / Browser ] <─── HTTP response ─── [ Web Server ]
```

> **In plain words:** HTTP is the "conversation convention" between browser and server. Both sides agree: how you ask, how the server answers. **HTTPS** = same protocol, but all content is **encrypted**.

---

## What are Requests and Responses?

Every web communication has exactly two parts: a **Request** (the question) and a **Response** (the answer). The browser sends a **request**, the server returns a **response**. Without either, there's no conversation.

```
[YOU]  ─── 1. REQUEST (ask)  ───►  [SERVER]
[YOU]  ◄── 2. RESPONSE (reply) ──  [SERVER]
```

### What does a REQUEST contain?

When you open `https://vuln.ghedahaui.online`, your browser silently sends something like this:

```http
GET / HTTP/1.1
Host: vuln.ghedahaui.online
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0
Accept: text/html,application/xhtml+xml
Accept-Language: vi-VN,vi;q=0.9,en;q=0.8
Cookie: session=abc123xyz
```

| Component | Meaning | In plain words |
|-----------|---------|----------------|
| **First line** `GET / HTTP/1.1` | Method + Path + HTTP version | "I want to **GET** the **root** page (/)" |
| **Host** | The domain you're calling | "I'm looking for the **vuln.ghedahaui.online** house" |
| **User-Agent** | Your browser / OS | "I'm Chrome on Windows" |
| **Accept** | Content types you'll accept | "Send me HTML please" |
| **Accept-Language** | Your preferred language | "Vietnamese is the best" |
| **Cookie** | Your session ID | "I'm Duc, here's my ID card" |
| **Body** (for POST) | Data sent along | "Here's my user/pass" |

### What does a RESPONSE contain?

The server replies with something like this:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Server: nginx/1.18.0
Set-Cookie: session=NEW_TOKEN; Path=/; HttpOnly

<html>... page content ...</html>
```

| Component | Meaning | In plain words |
|-----------|---------|----------------|
| **First line** `HTTP/1.1 200 OK` | Version + **Status Code** + reason | "**200** = all good" |
| **Content-Type** | Type of content returned | "This is HTML" |
| **Server** | Server software (nginx/apache...) | "I run on nginx" |
| **Set-Cookie** | Server sets a cookie for you | "Keep this card, come in anytime" |
| **Body** | The actual content (HTML, JSON, images...) | "Here's the webpage" |

> **Pentest tip:** Read the request to learn what the server **expects** (headers, cookies, body). Read the response to learn what the server **uses and how it judges you** (status code, Set-Cookie, Server header, timing). All web techniques revolve around tweaking the **request** and observing the **response**.

---

## HTTP Methods – GET, POST, PUT, DELETE...

These are called **HTTP Methods** (also "HTTP verbs"). They are **not** called "slugs". A **slug** is the readable name part in a URL (e.g. `my-post` in `website.com/my-post`). Different concepts!

Common HTTP methods:

| Method | Purpose | Example |
|--------|---------|---------|
| **GET** | **Retrieve** data | Open a page, view profile |
| **POST** | **Send** data to create | Login, create a post |
| **PUT** | **Replace** the resource entirely | Edit a post |
| **PATCH** | Update **partially** | Change only the username |
| **DELETE** | Delete data | Delete a post |
| **HEAD** | Like GET but headers only | Check if server is alive |
| **OPTIONS** | Ask which methods are allowed | API reconnaissance |

```
GET  /profile           → returns the profile page
POST /login             → sends user/pass, gets a session back
PUT  /user/5            → replaces user #5 entirely
DELETE /post/99         → deletes post #99
```

> **In plain words:** GET is "show me", POST is "add this", PUT is "replace that whole thing", DELETE is "throw it away". Remember this for web pentesting: sometimes the server forgets to check the method → we flip GET to POST to bypass.

---

## HTTP Status Codes

Every response comes with a **3-digit code** telling the result. There are 5 groups:

| Group | Meaning | In plain words |
|-------|---------|----------------|
| **1xx** | Informational | "Hold on, processing..." |
| **2xx** | Success | "All good" |
| **3xx** | Redirect | "Go somewhere else" |
| **4xx** | Client error | "You sent something wrong" |
| **5xx** | Server error | "The server is broken" |

### The most important codes

| Code | Name | Meaning |
|------|------|---------|
| **200** | OK | Success, data returned |
| **201** | Created | Successfully created |
| **301** | Moved Permanently | Permanent redirect |
| **302** | Found | Temporary redirect |
| **400** | Bad Request | Malformed request |
| **401** | Unauthorized | Not logged in |
| **403** | Forbidden | Authenticated but not allowed |
| **404** | Not Found | Page doesn't exist |
| **405** | Method Not Allowed | Wrong method |
| **429** | Too Many Requests | Rate limited |
| **500** | Internal Server Error | Server crashed |
| **502/503/504** | Gateway / Unavailable / Timeout | Proxy/server issues |

```
$ curl -s -o /dev/null -w "%{http_code}\n" https://vuln.ghedahaui.online
200
```

> **Pentest tip:** `403` usually means **something is there** but blocked → try path traversal, headers, or different methods. A `200` that returns suspiciously fast for every URL might mean a catch-all rule.

---

## DNS – The Internet's Address Book

DNS (Domain Name System) **translates** domain names (human-friendly) into **IPs** (machine-friendly). Humans remember `google.com`, computers need `142.250.196.78`.

```
You type: vuln.ghedahaui.online
            │
            ▼
      [ DNS Server ]
            │ asks: "what is the IP of vuln.ghedahaui.online?"
            │ answers: 140.xxx.xx.xx
            ▼
   Browser connects to that IP on port 443 (HTTPS)
```

**Important DNS record types:**

| Type | Purpose | Example |
|------|---------|---------|
| **A** | Domain → IPv4 | `ghedahaui.online → 140.xxx.xx.xx` |
| **AAAA** | Domain → IPv6 | ... |
| **CNAME** | Alias to another domain | `www → ghedahaui.online` |
| **MX** | Mail server | ... |
| **NS** | Name servers | ... |
| **TXT** | Text data (verification) | SPF, DKIM |

**DNS tools:**

```bash
nslookup vuln.ghedahaui.online
dig vuln.ghedahaui.online
host vuln.ghedahaui.online

# Brute-force subdomains to find hidden targets
ffuf -u https://vuln.ghedahaui.online -H "Host: FUZZ.ghedahaui.online" \
     -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt -fc 404
```

> **Pentest connection:** Recon labs (like our **Ffuf Mastery**) are about finding hidden **VHosts/subdomains** via DNS and Host headers. DNS is the first treasure trove in recon.

---

## What is an API?

An API (Application Programming Interface) is the **"menu"** one program offers for other programs to call. Web APIs typically use HTTP + JSON.

```
[ Client (web/app) ] ──GET /api/users──> [ Server ]
                       <── JSON ──
```

**Example API response:**

```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Đức Nguyễn",
    "level": 12,
    "xp": 11180,
    "role": "admin"
  }
}
```

**APIs can be public or require keys:**

```bash
# Public API
curl https://api.github.com/users/octocat

# API requiring a key (Authorization header)
curl -H "Authorization: Bearer <TOKEN>" https://api.example.com/me
```

> **Pentest connection:** APIs often expose endpoints like `/api/users/1`, `/api/users/2`... If the server fails to check authorization → **IDOR** (just change the number to access someone else's account). That's exactly the vulnerability our friend `67b1105f...` used to escalate to admin back in the day!

---

## curl – The Request Tool

`curl` is a command-line tool for sending/receiving data over the network. It's **every pentester's best friend**.

### Syntax & important flags

```bash
curl URL                          # default GET, prints response
curl -X POST URL                  # change method to POST
curl -d 'user=admin&pass=123' URL # send form body (POST)
curl -H "Header: value" URL       # add a custom header
curl -L URL                       # follow redirects (3xx)
curl -o file.html URL             # save response to file
curl -s URL                       # silent – no progress bar
curl -v URL                       # verbose – show full request/response
curl -i URL                       # include response headers in output
curl -k URL                       # skip SSL verification (bad certs)
curl -u user:pass URL             # send Basic Auth
curl -c cookies.txt URL           # save cookies to file
curl -b cookies.txt URL           # send cookies from file
```

### Real examples

```bash
# 1. See everything that happens
curl -v https://vuln.ghedahaui.online
# → shows: request method, sent headers, response headers, body

# 2. Get just the status code
curl -s -o /dev/null -w "%{http_code}\n" https://vuln.ghedahaui.online
# → 200

# 3. Send a POST login
curl -X POST https://vuln.ghedahaui.online/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"123"}'

# 4. Measure response time
curl -s -o /dev/null -w "time_total: %{time_total}s\n" https://vuln.ghedahaui.online
```

> **Flag combination explained:** `-s` hides the progress bar (clean output), `-o /dev/null` discards the body (we only want headers), `-w` prints custom info like `%{http_code}`.

---

## wget – Downloading files

`wget` specializes in **downloading files**, and supports resuming interrupted downloads.

```bash
wget URL                    # download to current directory
wget -O filename URL        # save with a different name
wget -r URL                 # recursive download
wget -q URL                 # quiet mode
wget -P /path/ URL          # save to specified directory
```

> **curl vs wget:** Simple file downloads → `wget`. Testing APIs, sending requests, tweaking headers → `curl`. Pentesters use **curl far more**.

---

## Invoke-WebRequest – PowerShell's curl

On Windows you use `Invoke-WebRequest` (alias `iwr`) or `Invoke-RestMethod` (`irm`):

```powershell
# Like curl -v
Invoke-WebRequest https://vuln.ghedahaui.online

# GET and inspect content
$r = Invoke-WebRequest https://vuln.ghedahaui.online
$r.StatusCode
$r.Content

# POST with a body
Invoke-RestMethod -Method Post -Uri https://vuln.ghedahaui.online/api/login `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"123"}'

# Add headers
Invoke-WebRequest -Uri https://api.example.com/me -Headers @{Authorization="Bearer TOKEN"}
```

> **Remember:** In PowerShell, the alias `curl` actually calls `Invoke-WebRequest`. So `curl` in a Windows terminal ≠ Linux `curl`. Pentesters usually work in Kali, so standard `curl` is fine.

---

## certutil – A Windows Tool Often Abused

`certutil` is a Windows tool for managing **digital certificates**. But attackers often abuse it to **download files** because it's legitimate and rarely flagged by antivirus.

```cmd
:: Download a file
certutil -urlcache -f -split https://vuln.ghedahaui.online/file.exe payload.exe

:: Compute MD5 hash (useful for checksum verification)
certutil -hashfile payload.exe MD5
```

> **Be aware:** In post-exploitation, `certutil` is a common technique to download payloads over HTTP without wget/curl. Now anyone who sees this command in logs knows its purpose :))

---

## URL Structure

Understand each part of a URL to manipulate it during pentests:

```
  https://user:pass@vuln.ghedahaui.online:443/path/to/page?id=5&x=1#section
 │      │                                │     │             │    │
 │      │                                │     │             │    └─ Fragment
 │      │                                │     │             └─ Query string (?key=value)
 │      │                                │     └─ Path (Path)
 │      │                                └─ Port (Standard: http=80, https=443)
 │      └─ User:Pass (rarely use)
 └─ Scheme (http/https)
```

> **Slug** = the readable path part, e.g. in `https://vuln.ghedahaui.online/labs/ffuf-mastery`, `ffuf-mastery` is the slug. **Don't confuse it with HTTP methods!**

---

## Lab Test: Curl VULNLAB!

Open a Kali terminal and run each command:

```bash
# 1. Fetch the VULNLAB homepage (full HTML)
curl https://vuln.ghedahaui.online

# 2. Headers only – what server is running?
curl -I https://vuln.ghedahaui.online

# 3. Full request/response detail
curl -v https://vuln.ghedahaui.online

# 4. Status code of the homepage
curl -s -o /dev/null -w "HTTP status: %{http_code}\n" https://vuln.ghedahaui.online

# 5. Try a non-existent page – guess the result?
curl -s -o /dev/null -w "HTTP status: %{http_code}\n" https://vuln.ghedahaui.online/not-exist-123

# 6. Query a real API endpoint of the platform
curl -s https://vuln.ghedahaui.online/api/leaderboard | head -50
```

**Reasoning questions:**

1. What code does command #4 return? (Answer: `200`)
2. What code does command #5 return? (Answer: `404` – or `200` if the server has a catch-all, pay attention!)
3. In `-v` output, which header stands out most? (`Server`, `Set-Cookie`, `Location`...)
4. If you use `http://` instead of `https://`, do you see a `301/302`? Why?

> **Goal of this test:** Get comfortable reading curl output, status codes, and headers – the foundation for every web pentest ahead.

---

## Quick Recap

> - **HTTP** = web protocol, **HTTPS** = encrypted HTTP (TLS).
> - **HTTP Methods** = GET/POST/PUT/DELETE... (don't call them slugs :)) ). **Slug** = the readable name part in a URL.
> - **Status codes** = 2xx ok, 3xx redirect, 4xx client error, 5xx server error.
> - **DNS** = domain name → IP address book.
> - **API** = a menu for programs to call each other (usually HTTP + JSON).
> - **curl** = send any request, **wget** = download files, **Invoke-WebRequest** = curl on Windows, **certutil** = "legitimate" file download on Windows.
