# Burp Suite Basics — Intercepting & Modifying Requests

> **Difficulty:** Easy — **Level:** beginner

## Introduction

Burp Suite is the **#1 tool** for web pentesters. It works as a **proxy** (middleman): it sits between your browser and the web server, letting you **see** every request and **modify** them before they are sent. Without Burp you only "see" the web app the way the app wants you to; with Burp you control everything.

---

## Part A — Understand

### What is a proxy?

A proxy is a **relay station**:

```
No proxy:     [ Browser ] ───────────────────> [ Server ]
With proxy:   [ Browser ] ──> [ BURP PROXY ] ──> [ Server ]
                               │    ▲
                               ▼    │
                         you see & edit here
```

Every request from the browser passes through Burp before reaching the server, and every response comes back through Burp. So you can **intercept** and **change** them.

> **Analogy:** Burp is a "gatekeeper" you hire — you tell it: show me every outgoing letter first; I can edit the content before you forward it.

### Most important modules (Community Edition)

| Module | Function | When to use |
|--------|----------|-------------|
| **Proxy** | Intercept/edit requests directly | All the time — see & edit requests |
| **HTTP History** | Log of every request that passed | Review history, find hidden APIs |
| **Repeater** | Re-send edited requests many times | Manual payload testing step by step |
| **Intruder** | Automated brute-force/fuzz with wordlists | Brute-force login, fuzz params |
| **Decoder** | Encode/decode (Base64, URL, Hex...) | Decode strings in labs |
| **Comparer** | Compare 2 responses | Detect differences when payloading |

> **Note:** Community Edition is free; Intruder is rate-limited but enough to learn. This lab mainly uses Repeater + Decoder + HTTP History.

### Install & proxy setup

**Step 1 — Install Burp:**
```bash
# Preinstalled on Kali; if not:
sudo apt update && sudo apt install -y burpsuite
# Or download from PortSwigger (free Community edition)
```

**Step 2 — Configure browser to use Burp proxy:**
- Burp listens on `127.0.0.1:8080` by default
- Browser (Firefox) → Settings → Network Settings → Manual proxy:
  - HTTP Proxy: `127.0.0.1`, Port: `8080`
- Turn **Intercept off** (Proxy tab) to browse normally; turn it on to capture requests.

---

## Part B — Exploit: Capture & Modify Requests

### Step 1: Start the lab

> 💡 **Get Lab Link:** Open this lesson on **Learning Detail** → click **"Access Lab"** to get the real link (e.g., `https://vuln.ghedahaui.online/labs-env/...`). Replace `<LAB_ADDRESS>` with that link in commands below.

# Lab at: <LAB_ADDRESS> — a PHP app that echoes your request back

### Step 2: Turn on Intercept and capture a request

1. Open Burp → **Proxy** tab → **Intercept** tab → Click **Open Browser** button.

![image](/uploads/image_1786487558298_likeig.png)

2. An embedded browser in Burp will pop up. Navigate to `<LAB_ADDRESS>/?name=admin` and press Enter.

![image](/uploads/image_1786487711305_7dyceq.png)

3. We can see this is a lab where the application reflects any URL parameter (specifically the `name` parameter from step 2) and renders it via HTML in the page display.

4. Go back to Burp, enable **Intercept On** in Proxy → Intercept. Then reload the page!

![image](/uploads/image_1786487958936_ydhv5j.png)

> Notice the reload action is "frozen" in the browser? Exactly — with Burp's intercept feature, the browser request has been synced and sent through the proxy channel directly into Burp.

### Step 3: Edit the request right in Intercept

In the Intercept window you see the full raw request:

```http
GET /?name=admin HTTP/1.1
Host: localhost:7101
User-Agent: Mozilla/5.0 ...
Accept: text/html,...
Connection: close
```

**Modify** the line `name=admin` to `name=<script>alert(1)</script>` then click **Forward**:

![image](/uploads/image_1786488418148_gr8d3s.png)

> You'll notice we just triggered a piece of JavaScript that causes an alert when rendered. This is a classic XSS vulnerability we'll cover in later lessons.

> You can also see that manually editing the **query string** via the URL search bar or via Burp is essentially the same test.

### Step 4: Re-send with Repeater

![image](/uploads/image_1786488655243_h7s4qv.png)

1. In the **HTTP History** tab, find the `GET /?name=...` request, right-click → **Send to Repeater** (or Ctrl+R).
2. Go to the **Repeater** tab, change `?name=..` to a new value. Save with Ctrl+S → then click **Send**.

![image](/uploads/image_1786488874922_xtvx36.png)

3. Observe the **response** on the right. (The response has multiple display options, but we typically care about the raw source view).

> You can try many different payloads and notice that observing how the server responds via Burp Suite is much faster and easier to track changes than the browser's graphical UI.

```http
GET /?name=waooo HTTP/1.1
Host: <...>
```
![image](/uploads/image_1786489049896_s5dvh6.png)

### Step 5: Use Decoder to decode strings

Labs often contain encoded strings. **Decoder** tab:

1. Paste the string `VkxOVF9idXJwX3J1bGV6IQ==` into Decoder.
2. Choose **Decode as → Base64** → result: `VLNT_burp_rulez!`

![image](/uploads/image_1786489188359_ai1z3p.png)

> **Note:** This is foundational — the `crypto-basics` lesson covers it fully. Here you just need to know where Decoder lives.

---

## Part C — Defend & Checklist

### Why pentesters need Burp and devs don't notice these issues

- Devs see the app the way "they wrote it"; pentesters see the app as "the actual bytes sent".
- Burp reveals **unvalidated input**: send weird values, weird headers, weird methods.
- Every vulnerability in this course **starts by editing a request in Burp**.

### Burp usage checklist

```text
[ ] Browser proxy configured (127.0.0.1:8080)?
[ ] Intercept OFF while browsing normally (avoid hangs)?
[ ] To edit a request: Intercept ON → edit → Forward
[ ] To try many payloads: use Repeater instead of editing Intercept
[ ] To brute-force: use Intruder (select fuzz positions with §)
[ ] Weird string? Use Decoder
[ ] Don't know what request is being sent? Check HTTP History
```