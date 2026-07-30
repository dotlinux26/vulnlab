# VULNLAB Production Architecture

## Server Info
- **Host:** shellmap-origin (Ubuntu)
- **User:** ubuntu
- **Domain:** vuln.ghedahaui.online, ghedahaui.online, admin.ghedahaui.online, dev.ghedahaui.online
- **SSL:** Let's Encrypt (tự động renew)

---

## PM2 Processes

| ID | Name | Type | Port | Status | Chức năng |
|----|------|------|------|--------|-----------|
| 0 | `ghedahaui-main` | fork | 3000 | online | Main site (Node.js) |
| 1 | `ghedahaui-admin` | fork | 6666 | online | Admin site (Node.js) |
| 2 | `vuln-frontend` | fork | 5173 | online | Vite dev server (Frontend) |
| 5 | `vuln-backend-main` | fork | 6667 | online | Backend API (Express) |
| 6 | `vuln-backend-chat` | fork | 6668 | online | Chat + Payment (Socket.io) |
| 7 | `lab-gateway` | fork | 7777 | online | Docker lab gateway |

---

## Nginx Routing (`/etc/nginx/sites-enabled/ghedahaui`)

### Port 80 (HTTP) — Catch-all + Recon Labs

| Server Name | Location | Response | Purpose |
|-------------|----------|----------|---------|
| `_` (default) | `/` | `200 "Trang chu Ghedahaui..."` | Catch-all vô hại |
| `test.dev.ghedahaui.online` | `/` | Flag 1: `{TEST_DEV_OK}` | Recon lab — vhost fuzzing |
| `dev.ghedahaui.online` | `/menu/` + `/config/` | Flag 2: `{SECRET_DIRECT_FOUND}` | Directory fuzzing |
| `vuln.dev.ghedahaui.online` | `/` | `402 "Something mustn't be your mind"` | Red herring / troll |
| `lab.vuln.dev.ghedahaui.online` | `/` | Flag 3: `{MASTER_RECON}` | Final recon flag |
| `*.ghedahaui.online` | `/` | `301 → HTTPS` | Redirect chính |

### Port 443 (HTTPS) — Production Services

**`vuln.ghedahaui.online`** → Hệ thống lab chính

| Location | Proxy Pass | Notes |
|----------|-----------|-------|
| `/` | `→ localhost:5173` | Frontend (Vite dev) |
| `/api` | `→ localhost:6667` | Backend API |
| `/api/payment` | `→ localhost:6668` | Payment API |
| `/socket.io/` | `→ localhost:6668` | WebSocket chat |
| `/uploads` | `→ localhost:6667` | File uploads (bypass auth) |
| `/labs` | `→ localhost:6667` | Lab content (backend public/) |
| `/labs-env/` | `→ localhost:7777` | Docker lab gateway |

**`ghedahaui.online` + `www.ghedahaui.online`** → Main site + Admin

| Location | Proxy Pass | Notes |
|----------|-----------|-------|
| `/` | `→ localhost:3000` | Ghedahaui main site |
| `/admin/` | `→ localhost:6666/` | Admin panel (strip prefix) |

**`dev.ghedahaui.online`** — Dev subdomain (for recon lab)

| Location | Response | Notes |
|----------|----------|-------|
| `/` | 403 Forbidden | RESTRICTED |
| `/config/` | Flag 2 (HTTPS version) | Troll flag |

---

## Service Details

### Frontend (`vuln-frontend` :5173)
- **Path:** `/home/ubuntu/vulnghedahauilab/frontend/`
- **Runtime:** Vite dev server (Node.js)
- **Config:** `vite.config.ts` — port 5173

### Backend (`vuln-backend-main` :6667)
- **Path:** `/home/ubuntu/vulnghedahauilab/backend/`
- **Runtime:** Node.js + Express + TypeScript
- **DB:** SQLite (`database.sqlite`)
- **Models:** User, Lab, Submission, Certificate, Lesson
- **Uploads:** `backend/uploads/`

### Chat + Payment (`vuln-backend-chat` :6668)
- **Path:** `/home/ubuntu/vulnghedahauilab/backend/`
- **Runtime:** Node.js + Socket.io + Express
- **Payment:** PayOS integration
- **Chat DB:** `chat.sqlite`

### Lab Gateway (`lab-gateway` :7777)
- **Path:** `/home/ubuntu/vulnghedahauilab/ctf-labs/`
- **Runtime:** Node.js (gateway.js)
- **Routing:** `lab-routes.json`
- **Docker Labs:** jwt-stage2, otp-brute, xss-puppete, lfi-poison-lab

---

## Source Code

- **GitHub:** `github.com:dotlinux26/vulnlab.git`
- **Local:** `/home/nguyenduccanh/Documents/vulnlab/`
- **Deploy:** Pull từ GitHub → restart PM2
  ```bash
  cd /home/ubuntu/vulnghedahauilab
  git pull origin main
  pm2 restart all
  ```

---

## Notes
- Frontend chạy Vite dev server (port 5173) — không build dist
- Backend chạy TypeScript trực tiếp (không compile)
- File upload được serve qua Nginx (bypass auth) ở `/uploads`
- `proxy_set_header` quan trọng: cần `X-Real-IP` và `X-Forwarded-For` cho rate limiting
