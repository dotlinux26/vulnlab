# CyberShop — OWASP Capstone Lab (17)

Web e-commerce giả lập chứa **16 lỗ hổng OWASP** dùng làm capstone: học viên tự recon, tự chọn attack path, chứng minh impact, nộp report. *Không có hint vulnerability — xem `../missions.md`.*

## Kiến trúc

```
                    Internet
                       │ https
              shop.ghedahaui.online  (nginx, infra/cauhinhnginxhientai.txt)
                       │  ── hoặc── gateway :7777 route /owasp (ctf-labs/lab-routes.json)
                       ▼
              host port 7110 ──► web (Node20/Express/EJS)   ← service duy nhất publish port
                       │
        ┌──────────────┼────────────────┬───────────────┐
        ▼              ▼                ▼               ▼
     mongo:7       mysql:8         flag-service      xss-bot
   users/orders   products/       (Go, :8080)    (Playwright admin,
   (edge: có       reviews +       /flag /info     visit /admin/reviews
    Internet)      shopusers       /metrics /health  mỗi 30s)
```

- **Network:** `lab_17_edge` (chỉ web, có published port) + `lab_17_net` (`internal: true` — không route ra Internet). Mongo/MySQL/flag-service/bot **không thể chạm từ host hay ngoài**.
- **Hardening:** web chạy user `node` (RCE không lên root), `cap_drop: ALL`, `no-new-privileges`, `read_only` rootfs + tmpfs. Bot bị cô lập mạng hoàn toàn.

## Trang /objectives (student-facing)

Danh sách 16 mục tiêu trung tính (mô tả kết quả, không nói kỹ thuật) + form nộp evidence token. Nộp đúng `FLAG{cN}` → card "✓ OBJECTIVE COMPLETED" kèm checklist "You demonstrated..." và gợi ý ghi journal. Song ngữ vi/en theo cookie `lang`. Stateless — chỉ validate, không lưu tiến độ.

## Smoke test

```bash
./smoke-test.sh                    # 18 check nhanh (~15s)
WITH_BOT=1 ./smoke-test.sh         # + C14 stored-XSS qua bot (~60s tổng)
./smoke-test.sh https://shop.example  # trỏ host khác
```

Exit code 0 khi tất cả PASS. Chạy sau MỌI thay đổi src trước khi commit.

## Sandbox posture (đã verify)

| Kiểm tra | Kết quả |
|---|---|
| Host → mongo/mysql/flag-service | blocked ✓ |
| Bot → Internet | CHO PHÉP (edge network) — cần cho exfil XSS về webhook học viên |
| RCE trong web | uid=node, chỉ thấy mạng nội bộ lab ✓ |
| Cross-lab (sang container lab khác) | Docker bridge isolation chặn mặc định ✓ |

⚠️ Lưu ý còn lại: web nằm trên edge network nên **có** route ra Internet (chuẩn CTF). Nếu muốn khóa hẳn egress của web, thêm iptables DOCKER-USER rule theo dải IP container của `lab_17_edge`.

## Flag placement — KHÔNG có vault tập trung

Nguyên tắc: một primitive đọc file **không được** thu hoạch hết 16 flag. Mỗi flag đặt theo "độ cao tấn công" và có **con trỏ discovery riêng** trong-universe:

| Flag | Vị trí vật lý | Con trỏ discovery |
|------|--------------|-------------------|
| c1 | nội dung `/.backup/db-seed.js.bak` | robots.txt → dir listing |
| c2 | field `secretNote` (Mongo admin doc) | `/auth/me` sau NoSQLi bypass |
| c3 | render trang audit | cần session admin hợp lệ |
| c4 | response `extended.flag` API profile | tự thân mass assignment |
| c5 | row `flaguser` bảng `shopusers` (MySQL) | UNION dump |
| c6 | response OTP verify đúng mã | brute-force 4 số (không rate limit) |
| c7 | note order #1042 (của bob) | IDOR |
| c8 | trang `/debug` | robots.txt |
| c9 | endpoint `/flag` của flag-service | SSRF + enumerate /info,/metrics |
| c10 | `/app/flags/c10.txt` (**file duy nhất** trong dir) | ví dụ trong `.bak` |
| c11 | `/opt/scripts/netdiag.secret` | dòng trong `/debug` panel |
| c12 | `/app/config/session-store.key` | comment trong `.bak` |
| c13 | `/app/data/state-snapshot.dat` | header comment serializer (CSPACK spec) |
| c14 | cookie `moderation_key` (set khi admin login, không HttpOnly) | stored XSS trong review + bot exfil `document.cookie` về webhook học viên |
| c15/c16 | HTML comment (discovery markers) | view-source |
| master | `/flag.txt` | vị trí cổ điển, bằng chứng M4 |

Các flag emission-only (c1–c9, c14–c16 do code đọc ra) nằm ở `/app/.state/<md5(tên)>.txt` — **tên file đã hash**, không đoán/guess được từ một lần đọc thư mục.

## Reset

```bash
./reset.sh          # down -v --remove-orphans + up -d --build + wait health
```

Toàn bộ state (Mongo seed, MySQL initdb, in-memory carts) sống trong container layer → `down` là sạch, `up` tự seed lại. Không dùng named volume.

## Đã E2E verify trên máy (docker compose, 2026-08)

16/16 attack path chạy đúng: backup leak, debug panel, reflected XSS echo, NoSQLi bypass + secretNote, JWT alg:none → audit, mass assignment → role admin, OTP brute, IDOR #1042, SQLi UNION dump shopusers (MD5 khớp rockyou: jordan23/monkey), SSRF → flag-service /flag + /info, XXE read c10, cmdi đọc netdiag.secret + `/flag.txt` (uid=node), SSTI EJS đọc session-store.key, deser gadget đọc state-snapshot.dat, stored XSS → bot exfil cookie `moderation_key` về collector/webhook của học viên.

## Ghi chú vận hành

- Lần đầu deploy server thật: `certbot --nginx -d shop.ghedahaui.online` trước khi reload nginx.
- Gateway hot-reload: thêm xong `lab-routes.json` không cần restart gateway (theo thiết kế hiện tại).
- Nếu đổi domain/port: sửa `metadata.txt` (`lab_url`, `lab_port`) + nginx block + routes json cho khớp.
