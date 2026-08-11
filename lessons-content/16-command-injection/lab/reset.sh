#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "[*] Dừng và xóa container cũ..."
docker compose down -v

echo "[*] Dựng lại lab..."
docker compose up -d --build

echo "[+] Lab đã reset. Truy cập: http://localhost:7107"
