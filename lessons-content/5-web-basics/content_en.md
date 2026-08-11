# Intro to HTML, Web & JavaScript

## How does a website work?

A website is just **text + code** sent from a server to your browser. The browser receives the code and **renders** it into the page you see.

![image](/uploads/Screenshot_2026-08-07_15-49-07_1786132907009_iefl0y.png)

```
[ Server ] ──sends code (HTML/CSS/JS)──> [ Browser ]
                                         │ renders
                                         ▼
                                    Page displayed
```

The page you see is actually made of **3 languages**:

| Language | Role | Plain talk |
|----------|------|------------|
| **HTML** | Content + structure | "Skeleton and flesh" |
| **CSS** | Colors, layout, style | "Clothes and makeup" |
| **JS** | Behavior, interaction | "Brain that controls" |

> **Easy way:** Think of a website as a house. HTML is the **frame** (which room is where), CSS is the **paint and furniture**, JS is the **electrical system** (flip a switch, light turns on).

---

## What is HTML?

HTML (HyperText Markup Language) is a **markup** language — it uses **tags** to describe content.

```html
<h1>Hello</h1>        <!-- big heading -->
<p>This is a paragraph.</p>  <!-- paragraph -->
<a href="https://vuln.ghedahaui.online">VULNLAB</a>  <!-- link -->
<input type="text" name="username">   <!-- input box -->
```

Basic structure of an HTML page:

```html
<!DOCTYPE html>
<html>
  <head>...</head>   <!-- config, title, CSS links -->
  <body>...</body>   <!-- visible content -->
</html>
```

> **Remember:** An opening tag `<name>` usually has a closing tag `</name>`. Tags can carry **attributes** like `href`, `name`, `id`... — attackers abuse these attributes (e.g. `onclick`, `onerror`) to inject malicious code.

---

## What is JavaScript (JS)?

JS is a **programming** language that runs right inside the browser, making pages **alive**: validating forms, calling APIs, changing content without reloading.

```js
document.getElementById("username").value = "admin";
alert("Hello!");
fetch('/api/me').then(r => r.json()).then(d => console.log(d));
```

> **Pentest note:** JS runs on the **client** side → you can **read all the JS code**. Sometimes devs hide passwords, API keys, or validation logic in JS — web recon starts here.

---

## What is Web Source? How to view it?

**Web source** = all the original code (HTML/CSS/JS) the server sent. Because the browser must receive the code to render the page, **that code is always viewable** — no "hacking" required.

![image](/uploads/souuce_1786133058010_8xdibo.png)

### How to view source

![image](/uploads/Screenshot_2026-08-07_15_49_57_1786132956148_fscn6p.png)

| Method | Action |
|--------|--------|
| Right-click → **View Page Source** | View raw HTML |
| Type `view-source:https://vuln.ghedahaui.online` | View raw HTML |
| **Ctrl + Shift + I** (DevTools) | View everything: HTML, CSS, JS, Network, Console... |

> **Pentest starts here:** Always **view the source first**. Hidden comments (`<!-- -->`), hidden links, JS files, hidden forms, hidden input tags... all clues.

---

## Ctrl + Shift + I – DevTools

DevTools (F12 or Ctrl+Shift+I) is the browser's **all-in-one toolkit**. Important tabs:

![image](/uploads/Screenshot_2026-08-07_16-00-04_1786133077004_ep2uln.png)

| Tab | What it does | Example |
|-----|--------------|---------|
| **Elements** | View/edit HTML & CSS live | Temporarily enable a `hidden` input |
| **Console** | Run JS, view logs/errors | Test payloads, spot hidden errors |
| **Network** | View every request/response | Track APIs, headers, cookies, status |
| **Application** | View cookies, localStorage | Read/edit session cookie |
| **Sources** | View all JS/CSS files | Read the page's logic |

**Hands-on example:**

1. Open any page → `Ctrl+Shift+I` → **Network** tab → `F5` (reload) → see each request, status, time, payload.
2. **Elements** tab → right-click an `<input>` → **Edit as HTML** → try changing an attribute.
3. **Console** tab → type `document.cookie` → Enter.

> **Tip:** For "fast hacking" open **Console + Network** side by side. Console runs code, Network shows what the server returns. No web attacker can live without DevTools.

---

## What is a Cookie?

HTTP **remembers nothing** between requests (stateless). A cookie is a **tiny piece of data** the server tells the browser to **store** and **automatically send** with every request — so the server can recognize you.

```
1. You log in → server sends:  Set-Cookie: session=abc123
2. Browser stores that cookie
3. Next request → browser auto-attaches:  Cookie: session=abc123
4. Server sees the cookie → knows who you are
```

### How to view cookies

![image](/uploads/cookie_1786133103139_5ohasl.png)

| Method | Action |
|--------|--------|
| DevTools → **Application** tab → **Cookies** | View/edit/delete each cookie |
| DevTools → **Network** tab → click request → **Request Headers** | View cookies being sent |
| Console | Type `document.cookie` |

```js
document.cookie   // view cookies of the current page
```

### Cookies & security

| Attribute | Meaning |
|-----------|---------|
| **HttpOnly** | JS **cannot read it** (blocks XSS theft) |
| **Secure** | Only sent over HTTPS |
| **SameSite** | Protects against CSRF |

> **Pentest:** The session cookie is the "key" to an account. Steal the cookie (via XSS, HTTP sniffing) → **log in without the password** (Session Hijacking). If a cookie lacks `HttpOnly`, one XSS bug means the account is compromised.

---

## Practice

1. Open `https://vuln.ghedahaui.online` → `Ctrl+Shift+I` → **Network** → F5 → find the first request, check its status code and response headers.
2. **Elements** tab → find an `<input>` tag → edit an attribute → watch the page change.
3. **Application → Cookies** → list existing cookies, check which ones have `HttpOnly`.
4. In **Console**, type `document.cookie` → compare with the Application tab (which cookie is hidden? Why?).
5. Right-click → **View Page Source** → find hidden comments `<!-- ... -->` and `<script>` tags.

---

> **Quick recap:**
> - **HTML** = content, **CSS** = styling, **JS** = behavior.
> - **Web source is always viewable** → start recon with View Source / Ctrl+Shift+I.
> - **DevTools** = Elements, Console, Network, Application, Sources.
> - **Cookie** = session passport; a cookie without `HttpOnly` is easily stolen via XSS.
