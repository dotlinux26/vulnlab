# OWASP Capstone — CyberShop Full-Stack Pentest

> **Difficulty:** Hard — **Level:** advanced

## Lab philosophy — You don't need to master the whole skill tree

Real-world pentesting doesn't require memorizing every vulnerability class before touching a system. This lab is built on that principle:

**1. The sufficient foundation is: request/response, Burp, ffuf, nmap.** That's the common language of every pentester. A vulnerability is just a *discrepancy that needs investigation* — you find it by observing behavior, not by memorizing names in advance.

**2. Wide system, pick your own path.** Nobody forces you through all 16 vulnerabilities in order. Dig into whatever interests you:

```
Web-focused:            Recon → HTTP/Burp → Auth → IDOR → SQLi → RCE
Infrastructure-focused: Recon → Network → SSRF → Internal service → Pivot → Container
Client-side-focused:    XSS → CSRF → Session → Account takeover
```

**3. Vulnerability = discrepancy pattern.** Every vulnerability fits one frame:

```
Expected behavior   vs   Actual behavior
              ↓
         discrepancy
              ↓
         investigate
              ↓
       vulnerability?
```

| Expected | Observed | → Bug class |
|----------|----------|-------------|
| User A reads only A's resources | Change ID → read B's resources | Broken Access Control / IDOR |
| Input is just data | Input changes how a query/command/template executes | Injection |
| Browser can't reach internal services | Server fetches user-controlled URL → reaches them for you | SSRF |
| Session proves valid identity | Client-controlled token can change privilege | Auth flaw |

Names (IDOR, SSRF, SSTI...) are **vocabulary that comes after observation**. In real life nothing pops up "Potential IDOR detected!" — you must notice the odd behavior first.

**4. The real learning loop:**

```
curiosity → exploration → failure → research → exploit → mastery
```

Today you only know "Burp → request → response". Later you stumble into: *"Wait, why can I read someone else's data by changing an ID?"* — that's when IDOR grows out of a problem-solving need instead of a forced syllabus.

A great pentester isn't someone who knows every vulnerability — it's someone who can say about the unknown: *"I don't know this yet. Let me research it and come back."*

---

## Introduction

Unlike previous lessons (one vulnerability each, with guided payloads), this is a **capstone environment**: a fully functional e-commerce web application containing multiple vulnerabilities at once — and nobody will tell you where they are.

The goal is not memorizing payloads. The goal is training the **pentest methodology loop**:

```
Recon → Enumeration → Hypothesis → Validation → Exploitation → Chaining → Evidence → Report
```

A strong junior is not the person who knows the most payloads — it's the person who asks the **right questions** about the application in front of them.

---

## Part A — Recon Mindset (Understand)

### Recon is more than running tools

Before sending any payload, answer these questions about the application:

| Question | How to answer it |
|----------|------------------|
| What's the tech stack? | Response headers, error pages, file extensions (.php? .ejs?), behavior patterns |
| What are the entry points? | Every place accepting input: URL params, body, headers, cookies, uploads |
| Where does input go? | Search → DB query? Avatar URL → server-side fetch? File param → filesystem? |
| Who can do what? | Pages visible to regular users vs admins. Where is authorization enforced? |
| What does the app leak unintentionally? | Error messages, HTML comments, robots.txt, backups, debug pages |

### interesting ≠ vulnerable

Recon will surface **many** results: odd endpoints, hidden pages, backup files, internal APIs. But **not everything interesting is exploitable**. Distinguishing *interesting* from *actually vulnerable* is the core skill separating freshers from juniors.

### Map your attack surface

After recon you should have a table like:

```
Entry points          → Goes to                 → Hypothesis
/search?q=            → SQL query               → injection?
/profile/avatar(url)  → server-side fetch       → internal network?
/orders/:id           → object lookup           → ownership check?
cookie token          → session verification    → forgeable?
PUT /api/profile      → DB update               → field whitelist?
/import (XML body)    → server-side parser      → does the parser resolve entities?
```

---

## Part B — From Hypothesis to Exploitation

### The 5-step loop for every hypothesis

1. **Observe** — what does the feature do normally?
2. **Mutate** — change input deliberately (data types, special characters, boundary values)
3. **Compare** — how does the response differ from baseline? Is the difference conclusive?
4. **Validate** — repeat to rule out noise / false positives
5. **Document** — capture original request/response immediately, don't defer it

### On evidence

**A flag proves you completed an objective — it does not prove a vulnerability.**

A proper SQLi finding is a chain:

```
normal request → abnormal response → UNION extraction → sensitive data → flag
```

A proper IDOR finding:

```
User A calls GET /orders/1042 → HTTP 200 → order belongs to User B → no admin needed
```

If you only screenshot the flag, you lose Exploitation points and nearly all Post-Exploit Impact points.

### Chaining — where real power lies

Single vulnerabilities are usually limited. Chains create real impact:

```
Info leak → credentials → login → mass assignment → admin → admin tools → RCE → internal network
```

In your report, draw the chain explicitly: which vuln forms each link, what evidence supports it, what it hands to the next link.

---

## Part C — Report & Remediation (Act)

### The report is the primary deliverable

A pentest doesn't end at exploitation. Clients pay for **fixability**, so your report must answer:

- **Root cause**: which line of code / design decision is wrong?
- **Exploitability**: what are the preconditions? Who can exploit it?
- **Impact**: what's the business consequence (data leak? account takeover? RCE?)
- **Remediation**: how to fix it CORRECTLY?

### Correct remediation by bug class

| Bug class | Right fix | Wrong fix (don't teach this) |
|-----------|-----------|-------------------------------|
| Injection | Parameterized queries / ORM binding | Character filtering, WAF |
| Broken Access Control | Server-side object-level authorization | Hide IDs, switch to UUIDs |
| SSRF | Egress allowlist, block internal ranges | Block specific URLs one by one |
| XSS | Context-aware output encoding | Blacklisting `<script>` |
| CSRF | Token + SameSite cookies | Checking Referer |
| Deserialization | Never deserialize untrusted data; use safe formats | Validate input, deserialize anyway |
| Misconfiguration | Secure defaults, disable debug in prod | Move to a secret path |

A WAF is **defense-in-depth**, not the fix. A remediation that relies only on a WAF hasn't fixed the root cause.

---

## Progress Tracker — a humane checklist

Nobody requires you to break all 16 objectives. **A fresh junior can still complete 3–5 findings. A decent junior will chain them. A strong one will tear the whole app apart.** All three are learning pentest the right way — this lab has no single rail.

Each completed objective yields an **evidence token** of the form `FLAG{cN}`. Submit it on the **Objectives** page (`/objectives`) in the app to confirm it — the system tells you exactly what you just demonstrated and suggests what to write in your journal next. Note: objective titles describe the **outcome**, never the method — figuring out the "how" is the actual lesson.

Print this table or copy it into your notes file:

| # | Objective | Token | ✓ |
|---|-----------|-------|---|
| 1 | Find a file the application forgot to protect | `FLAG{c1}` | ☐ |
| 2 | Log in without knowing anyone's password | `FLAG{c2}` | ☐ |
| 3 | Prove the session token cannot be trusted | `FLAG{c3}` | ☐ |
| 4 | Gain privileges through profile editing | `FLAG{c4}` | ☐ |
| 5 | Extract sensitive records from the backend database | `FLAG{c5}` | ☐ |
| 6 | Defeat a secondary verification step | `FLAG{c6}` | ☐ |
| 7 | Read data that belongs to someone else | `FLAG{c7}` | ☐ |
| 8 | Make the application talk more than it should | `FLAG{c8}` | ☐ |
| 9 | Reach an internal service never meant for you | `FLAG{c9}` | ☐ |
| 10 | Read arbitrary files through a document parser | `FLAG{c10}` | ☐ |
| 11 | Execute operating-system commands on the server | `FLAG{c11}` | ☐ |
| 12 | Make the server evaluate your expressions | `FLAG{c12}` | ☐ |
| 13 | Abuse serialized data the server trusts | `FLAG{c13}` | ☐ |
| 14 | Make another user's browser run your script | `FLAG{c14}` | ☐ |
| 15 | Reflect attacker-controlled content into a page | `FLAG{c15}` | ☐ |
| 16 | Perform an action as a user who never consented | `FLAG{c16}` | ☐ |
| ★ | Full compromise of CyberShop | `FLAG{owasp_shop_master}` | ☐ |

The last few objectives (14–16) are not scored by tokens alone — they are graded through **report evidence**: a working PoC, before/after request–response pairs, and an impact explanation. No token ≠ unimportant; in real pentesting, **impact is what gets paid**.

### Journal template — fill it in right after each successful exploit

```text
Finding #NN
──────────
Observation:   (what looked unusual?)
Hypothesis:    (what did you think caused it? why this payload?)
Request:       (paste raw request)
Response:      (the diff vs baseline)
Impact:        (what does an attacker gain?)
Root cause:    (if you can see code/pattern)
Remediation:   (the correct fix)
Token:         FLAG{...}
```

---

## Part D — Pre-flight Checklist

- [ ] Burp Suite proxy ready, FoxyProxy configured
- [ ] Logged in with your assigned account, session saved
- [ ] Notes file started for every discovered endpoint
- [ ] Baseline responses captured for key requests
- [ ] Printed/copied the progress tracker above + journal file open
- [ ] Suggested time budget: recon 20% — testing 50% — reporting 30%. This lab is long — don't try to sprint it in one breath: resting between missions is also a pentester skill

---

## Summary

After this lab you should be able to answer:

1. What is your recon process for a web application?
2. How do you distinguish interesting from vulnerable?
3. What does proper finding evidence consist of?
4. How do you chain vulnerabilities to increase impact?
5. What is correct remediation for each OWASP bug class?

If you can answer all five — you have the foundation of a junior pentester's mindset.
