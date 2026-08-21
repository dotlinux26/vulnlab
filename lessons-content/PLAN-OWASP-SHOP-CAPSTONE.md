# PLAN-OWASP-SHOP-CAPSTONE.md — Kế hoạch Lab Capstone Pentest Web `17-owasp-shop`

> **Trạng thái:** ĐÃ CHỐT — được duyệt triển khai.
> **Mục đích:** Xây dựng 1 lab full-stack giả lập web doanh nghiệp (e-commerce) chứa 16 lỗ hổng OWASP, dùng làm **capstone environment** đo tư duy pentest thực chiến (recon → hypothesis → validation → exploitation → chaining → evidence → report).
> **Khác biệt với 16 lab trước:** Không phải "1 bài = 1 vuln có hint". Đây là môi trường mở, học viên tự tìm lỗ hổng, tự chọn attack path, tự chứng minh impact, bắt buộc nộp report cuối.
> **Phạm vi:** `lessons-content/17-owasp-shop/` + `ctf-labs/lab-routes.json` + `infra/cauhinhnginxhientai.txt`. Không sửa backend/frontend hệ thống.

---

## MỤC LỤC

1. [Triết lý & Mục tiêu](#1-triết-lý--mục-tiêu)
2. [Kiến trúc Deploy](#2-kiến-trúc-deploy)
3. [Mission Design](#3-mission-design)
4. [Vulnerability Map](#4-vulnerability-map)
5. [Scoring Rubric](#5-scoring-rubric)
6. [Hint System](#6-hint-system)
7. [Docker / Compose Specs](#7-docker--compose-specs)
8. [Nginx & DNS](#8-nginx--dns)
9. [File Structure](#9-file-structure)
10. [Sandbox Hardening](#10-sandbox-hardening)
11. [Deploy Steps](#11-deploy-steps-cloud)
12. [Deliverables Checklist](#12-deliverables-checklist)
13. [Quyết định Chốt](#13-quyết-định-chốt)

---

## 1. Triết lý & Mục tiêu

| Nguyên tắc | Thực thi |
|---|---|
| **Methodology-first** | Không gợi ý vuln; chỉ giao *mission objective*; scoring theo giai đoạn recon → hypothesis → validation → exploit → chain → evidence → report |
| **Soft progression** | 4 mission mở cùng lúc từ đầu; prerequisite chỉ dùng để tính điểm chain, **KHÔNG khóa backend**. Học viên có thể phát hiện SSRF trước cả admin — đó chính là pentest thật |
| **Multi-path per mission** | Mỗi mission có 3-4 attack path độ khó khác nhau → nhìn vào path học viên chọn biết được trình độ thực tế |
| **Production-like trust boundary** | Student → Internet → Nginx → Gateway → isolated Docker lab → internal services. Học viên cảm giác đang pentest web thật |
| **Bilingual app** | UI + API message hỗ trợ VI/EN (cookie `lang` hoặc header `Accept-Language`) |
| **interesting ≠ vulnerable** | Recon cho ra nhiều endpoint (`robots.txt`, `/debug`, `/internal/`, `/api/`, `/uploads/`) nhưng chỉ một vài cái thực sự hữu ích — dạy kỹ năng phân biệt |
| **Report cuối bắt buộc** | Executive Summary → Findings (CWE, root cause, impact, remediation) → Attack Chain → Recommendations |

**Đầu ra kỳ vọng:** Học viên đi được vòng `recon → enumeration → hypothesis → validation → exploitation → chaining → evidence → report` = dấu hiệu lên junior.

---

## 2. Kiến trúc Deploy

```
                         Internet
                            │
                         HTTPS
                            │
                     shop.ghedahaui.online
                            │
                         Nginx (443)
                            │
                    ┌───────┴───────┐
                    │  Lab Gateway  │  (port 7777, route /owasp)
                    └───────┬───────┘
                            │
                    ┌───────┴────────────────────┐
                    │   lab_17_net (riêng biệt)  │
                    │                            │
              ┌─────┴─────┐  ┌──────┐  ┌───────┴───────┐  ┌──────────┐
              │ web:7110  │  │mongo │  │ flag-service  │  │ xss-bot  │
              │ (Node)    │  │:27017│  │ (Go, :8080)   │  │(Playwright)│
              └─────┬─────┘  └──────┘  │ INTERNAL ONLY │  │ INTERNAL │
                    │                  └───────────────┘  └──────────┘
```

**Threat model (giả định web container BỊ chiếm quyền qua RCE ở M4):**

```
COMPROMISED CONTAINER
   ✗ cannot access host
   ✗ cannot access Docker socket
   ✗ cannot access management plane
   ✗ cannot access other lab networks (lab_18_net...)
   ✗ cannot access other students
   ✓ can access intended lab_17_net services only
```

---

## 3. Mission Design

> **Soft progression:** cả 4 mission mở cùng lúc. App không khóa gì. Scoring mới hiểu dependency.

### M1 — Administrative Access
Đạt quyền admin. Paths:
- **A (dài, dễ hiểu):** Info leak (`/debug`, stack trace, backup file) → credential/hash → crack → login
- **B (ngắn, cần hiểu NoSQL):** NoSQL injection login bypass
- **C (cần nhận ra auth flaw):** JWT `alg:none` / weak secret → forge admin token
- **D (cần hiểu mass assignment):** `PUT /api/profile` nhận thêm `role` → tự nâng quyền

### M2 — Broken Access Control
Chứng minh truy cập resource/API không thuộc quyền mình. **IDOR phải tồn tại độc lập với admin** — finding đẹp là *"tôi không cần admin vẫn đọc được order của user khác"*:
- IDOR `GET /orders/:id` (sequential ID, no ownership check)
- Hidden admin API thiếu function-level authorization
- Mass assignment là path của M1, KHÔNG tính lại điểm M2

### M3 — Internal Network Pivot
Chạm tới `flag-service:8080` (internal only). Paths:
- SSRF qua avatar URL fetch / import-by-url (user thường)
- XXE qua import XML (user thường)
- Command injection qua admin ping tool (cần admin)

flag-service có **noise hợp lý**, học viên phải enumerate:
```
GET /health   → {"status":"ok"}
GET /info     → {"service":"flag-service","version":"1.0"}
GET /metrics  → Prometheus-style noise (không có flag)
GET /flag     → FLAG{internal_pivot_...}
```

### M4 — Code Execution
RCE trên container web. Paths độ khó khác nhau:
- **A:** SSTI (EJS invoice template) — unauthenticated/low privilege
- **B:** Admin command injection (ping tool) — cần admin
- **C:** Insecure deserialization (custom serializer + explicit gadget chain) — user thường
- **D:** File upload → RCE

**Lưu ý scoring:** RCE đạt được = điểm; nhưng **RCE ≠ auto-win**. Chứng minh impact (đọc target flag, dump data) mới được thêm điểm.

---

## 4. Vulnerability Map

16 vuln gom vào chain:

| # | Vuln | Mission | Endpoint/Feature | Ghi chú |
|---|------|---------|------------------|---------|
| 1 | Info Leak / Debug | M1-A | `/debug`, error stack, backup files | Entry point |
| 2 | NoSQL Injection | M1-B | `POST /api/auth/login`, `GET /api/search` | `{$ne:null}`, `$regex` |
| 3 | JWT Flaw | M1-C | Cookie `session` | `alg:none` + weak secret |
| 4 | Mass Assignment | M1-D | `PUT /api/profile` nhận `role` | PrivEsc |
| 5 | SQL Injection (MySQL) | M1/M3 | `GET /catalog/search?q=` | Union-based dump users/hashes |
| 6 | Rate Limit / User Enum | M1 | `POST /auth/login`, `/auth/otp` | Message phân biệt user tồn tại |
| 7 | IDOR | M2 | `GET /orders/:id` | Sequential ID, độc lập với admin |
| 8 | Broken Function-level Auth | M1→M2 | `/api/admin/*` thiếu authz | |
| 9 | SSRF | M3 | `POST /profile/avatar` (fetch URL) | Internal enumeration |
| 10 | XXE | M3 | `POST /import/xml` | External entity enabled |
| 11 | Command Injection | M3/M4 | `POST /admin/tools/ping` | Admin only |
| 12 | SSTI (EJS) | M4-A | `GET /invoice/:id?template=` | Low privilege |
| 13 | Insecure Deserialization | M4-C | Cookie `session_data` custom format | Custom serializer + explicit gadget, KHÔNG dùng `__proto__` làm vuln chính, KHÔNG dùng node-serialize |
| 14 | Stored XSS | M1/M3 | `POST /products/:id/review` | xss-bot (Playwright) tự visit với session fake admin |
| 15 | Reflected XSS | Recon | `GET /catalog/search?q=` | Echo unescaped |
| 16 | CSRF | M1 alt | `POST /profile/password` | Không có token |

---

## 5. Scoring Rubric

Tổng 100 điểm. **Flag = proof of completion, KHÔNG phải evidence duy nhất của vulnerability.**

| Giai đoạn | Điểm | Evidence yêu cầu |
|-----------|------|------------------|
| Recon & Discovery | 10 | Endpoint list, tech stack, entry points |
| Hypothesis & Validation | 20 | Burp history: test cases, payload thử, phân tích response bất thường |
| Exploitation | 20 | Root cause + impact evidence (VD SQLi: request → response lạ → UNION extraction → data → flag) |
| Chaining / Pivot | 20 | Mô tả path A→B→C kèm evidence từng bước |
| Post-Exploit Impact | 15 | Đọc data nhạy cảm khác, pivot network, chứng minh phạm vi ảnh hưởng |
| Report & Remediation | 15 | Writeup: root cause, fix THỰC SỰ |

**Remediation đúng chuẩn (không dạy WAF là fix chính):**
parameterized queries · object-level authorization · server-side allowlist · output encoding · CSRF token · secure deserialization · SSRF egress controls · network segmentation · secure template handling · rate limiting · secret management. WAF chỉ là defense-in-depth.

**Pentest Report template (bắt buộc nộp cuối):**
```
Executive Summary
Scope
Attack Surface
Finding N
  - Title / Severity / CWE
  - Affected endpoint
  - Preconditions
  - Reproduction
  - Evidence
  - Impact
  - Remediation
Attack Chain
Overall Risk
Recommendations
```
Chấm theo mức hiểu: vulnerability → root cause → exploitability → impact → business consequence → remediation. KHÔNG chấm văn phong.

---

## 6. Hint System

Hint theo tầng, **không bao giờ lộ tên vulnerability class**. Ví dụ M3:

| Tầng | Nội dung |
|------|----------|
| Hint 1 | "Identify features where the server retrieves remote resources on behalf of the user." |
| Hint 2 | "Observe whether the destination is controlled entirely by client input." |
| Hint 3 | "Consider whether the server can reach destinations the browser cannot." |
| Hint 4 | "Investigate services available on the application's internal network." |

Học viên vẫn phải tự discover vulnerability class.

---

## 7. Docker / Compose Specs

| Service | Image | Port | Network | Security |
|---------|-------|------|---------|----------|
| `web` | Node 20 multi-stage | 7110 host / 3000 container | `lab_17_net` | `read_only`, `tmpfs`, `cap_drop: ALL`, `no-new-privileges`, non-root user |
| `mongo` | mongo:7 | 27017 internal | `lab_17_net` | Không expose host |
| `mysql` | mysql:8 | 3306 internal | `lab_17_net` | Không expose host |
| `flag-service` | Go static (~10MB, scratch/distroless) | 8080 internal | `lab_17_net` | `read_only`, `user: nobody`, no shell |
| `xss-bot` | Playwright (Node) | internal | `lab_17_net` | `read_only`, `no-new-privileges`, NO Internet, ephemeral profile, fake shop-admin credential riêng (KHÔNG dùng session thật của hệ thống quản lý lab), no Docker socket, no host FS |

- Healthcheck `web`: `GET /healthz`.
- `restart: "no"` (reset worker kiểm soát lifecycle).
- **Mỗi lab một network riêng**: `lab_17_net`, `lab_18_net`... KHÔNG dùng network chung cho nhiều lab.
- Reset per session: `docker compose down -v && docker compose up -d --build` → fresh DB/users/orders/flags/sessions.

---

## 8. Nginx & DNS

**Bổ sung block mới vào `infra/cauhinhnginxhientai.txt` (KHÔNG sửa gì cũ):**

```nginx
# ====================================================
# 3. OWASP FULL-STACK SHOP LAB (Subdomain riêng)
# ====================================================
server {
    listen 80;
    server_name shop.ghedahaui.online;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name shop.ghedahaui.online;

    ssl_certificate /etc/letsencrypt/live/ghedahaui.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ghedahaui.online/privkey.pem;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:7110;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

- Cert dùng chung `ghedahaui.online` (SAN đã cover).
- DNS: anh thêm bản ghi `shop` CNAME → `ghedahaui.online` (hoặc A → IP VPS) ở Cloudflare.
- Route gateway: thêm `"/owasp": "http://127.0.0.1:7110"` vào `ctf-labs/lab-routes.json` (gateway hot-reload).
- UI hiển thị disclaimer: **"Authorized Security Training Environment — Attacks outside this lab are prohibited."**

---

## 9. File Structure

```
lessons-content/
├── PLAN-OWASP-SHOP-CAPSTONE.md      ← file kế hoạch này
└── 17-owasp-shop/
    ├── metadata.txt                 # lab_url = https://shop.ghedahaui.online
    ├── content_vi.md                # BÀI HỌC methodology cho học viên (KHÔNG phải walkthrough payload từng bước)
    ├── content_en.md                # Bản EN dịch sát
    ├── questions.txt                # 6 câu methodology + key vuln (VI/EN)
    ├── missions.md                  # 4 mission + hint progression + scoring rubric (bản cho học viên)
    ├── teacher-guide.md             # FILE GIÁO VIÊN: toàn bộ v đề + mọi attack path + flags + scoring key để đối sánh và thành lập writeup .md
    ├── images/                      # placeholder ảnh theo quy ước {slug}_{số}_{mô-tả}.png
    └── lab/
        ├── Dockerfile               # Node 20 multi-stage
        ├── docker-compose.yml       # web + mongo + mysql + flag-service + xss-bot, lab_17_net
        ├── reset.sh
        ├── flag.txt                 # master flag
        ├── src/
        │   ├── app.js
        │   ├── package.json
        │   ├── config/db.js         # Mongo + MySQL connections
        │   ├── middleware/{auth,csrf,i18n}.js
        │   ├── routes/{auth,catalog,products,cart,orders,profile,admin,api,tools}.js
        │   ├── views/*.ejs          # bilingual partials
        │   ├── public/{style.css,app.js,i18n.js}
        │   └── flags/C{1-16}_*.txt  # 16 flag files
        └── bot/
            ├── bot.js               # Playwright visit /admin/reviews mỗi 30s
            ├── Dockerfile
            └── package.json
```

**Phân biệt 3 file content:**
- `content_vi.md` / `content_en.md` = nội dung BÀI HỌC/khóa học (methodology), KHÔNG chứa bước giải chi tiết.
- `teacher-guide.md` = file GIÁO VIÊN chứa toàn bộ v đề + cách giải mọi path + flags + scoring key — nguồn đối sánh và thành lập writeup `.md` sau này.

**Bilingual app:** middleware i18n đọc cookie `lang=vi|en` hoặc `Accept-Language` → `res.locals.lang` → views render theo ngôn ngữ.

---

## 10. Sandbox Hardening

| Layer | Hardening |
|-------|-----------|
| Container | `read_only: true`, `tmpfs: [/tmp,/run,/var/log]`, `cap_drop: ALL`, `security_opt: [no-new-privileges:true]`, chạy non-root |
| Network | User-defined bridge `lab_17_net` RIÊNG cho lab 17; không host network; Nginx/Gateway ngoài network |
| Host | KHÔNG mount Docker socket; không privileged; lab không thấy host FS |
| Reset | `down -v` xóa volume → fresh state mỗi session; reset worker hiện có gọi được endpoint này |
| Gateway | Rate-limit per IP; block path traversal escape |
| flag-service | Go static binary, `user: nobody`, read-only, no shell, no package manager |
| xss-bot | Isolated: no Internet, ephemeral profile, fake credential riêng, không đụng session thật |

**Nguyên tắc:** coi như web container SẼ bị compromise (M4 cố ý có RCE). Mọi thứ trong lab_17_net là "mất cũng được"; mọi thứ ngoài network đó phải bất khả xâm phạm.

---

## 11. Deploy Steps (Cloud)

```bash
# 1. Pull code
cd ~/vulnghedahauilab && git pull

# 2. Sync labs (setup-labs.sh copy lessons-content/*/lab → ctf-labs/labs/)
./setup-labs.sh

# 3. Build + start (lab mới port 7110)
./start-all-labs.sh

# 4. Gateway tự nhận route /owasp (lab-routes.json đã cập nhật, hot-reload)

# 5. Deploy nginx
cp infra/cauhinhnginxhientai.txt /etc/nginx/sites-enabled/ghedahaui
nginx -t && systemctl reload nginx

# 6. DNS: CNAME shop.ghedahaui.online → ghedahaui.online (Cloudflare)

# 7. Admin UI: tạo lesson owasp-shop
#    lab_url = https://shop.ghedahaui.online
#    lab_compose_path = ctf-labs/labs/17-owasp-shop
#    lab_duration = 1800, lab_reset_timeout = 90
```

---

## 12. Deliverables Checklist

| Item | Status |
|------|--------|
| File kế hoạch này | ✅ |
| Lab source (Node+Mongo+MySQL, 16 vuln, i18n VI/EN) | ⬜ Scaffold |
| flag-service Go + xss-bot Playwright + docker-compose hardened | ⬜ Scaffold |
| metadata.txt + content VI/EN + missions.md + questions.txt | ⬜ Write |
| teacher-guide.md (full solutions giáo viên) | ⬜ Write |
| infra/cauhinhnginxhientai.txt + block shop subdomain | ⬜ Update |
| ctf-labs/lab-routes.json + /owasp route | ⬜ Update |
| DNS shop.ghedahaui.online | ⬜ Anh làm Cloudflare |
| Commit & push | ⬜ Cuối |

---

## 13. Quyết định Chốt

| Hạng mục | Quyết định |
|----------|------------|
| Stack | Node.js (Express) + MongoDB + MySQL + EJS |
| Theme | E-commerce shop ("CyberShop") |
| Phạm vi | Đủ 16 challenge gom vào 4 mission |
| flag-service | Go (tiny, static, secure) |
| XSS bot | Playwright (~150MB, lean hơn Puppeteer) |
| Deserialization | Custom serializer + explicit gadget chain (không `__proto__`, không node-serialize) |
| MySQL | Giữ (SQLi trên MySQL thật có giá trị đào tạo hơn SQLite fake) |
| Mission lock | Soft progression — app mở hoàn toàn, chỉ scoring hiểu dependency |
| Bilingual app | Có — i18n middleware + views VI/EN |
| Sandbox | read_only + cap_drop ALL + no-new-privileges + network riêng per lab + down -v reset |
| Report cuối | Bắt buộc — chấm theo methodology |
| Content | content_{vi,en}.md = bài học; teacher-guide.md = đáp án đầy đủ cho giáo viên |

---

## 4 chỉnh sửa refinement đã tích hợp (theo review cuối)

1. ✅ **M2 tách khỏi mass assignment của M1** — IDOR tồn tại độc lập, chứng minh được "không cần admin vẫn đọc order người khác".
2. ✅ **M3 thêm noise endpoints** (`/health`, `/info`, `/metrics`) — phải enumerate mới ra `/flag`.
3. ✅ **Flag chỉ là completion proof** — evidence phải gồm root cause + impact.
4. ✅ **Remediation thực sự** (parameterized queries, object-level authz, allowlist...) — bỏ "WAF bypass", WAF chỉ defense-in-depth.
