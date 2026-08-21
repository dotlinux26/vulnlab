#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "[*] OWASP Shop Lab - reset ve trang thai sach..."
docker compose down -v --remove-orphans

echo "[*] Dung lai lab (web + mongo + mysql + flag-service + xss-bot)..."
docker compose up -d --build

echo -n "[*] Cho web healthy"
for i in $(seq 1 30); do
  if curl -sf http://localhost:7110/healthz > /dev/null 2>&1; then
    echo; echo "[+] Lab da reset. Web: http://localhost:7110"
    echo "    Login demo: demo@cybershop.vn / demo123"
    exit 0
  fi
  echo -n "."
  sleep 2
done
echo; echo "[!] Web chua healthy sau 60s — kiem tra: docker compose logs web"
exit 1
