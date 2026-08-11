#!/usr/bin/env bash
# Reset lab: xóa container + volume cũ (data dirty), dựng lại sạch.
set -euo pipefail
cd "$(dirname "$0")"

echo "[*] Dừng và xóa container + volume cũ..."
docker compose down -v

echo "[*] Dựng lại lab..."
docker compose up -d --build

echo "[+] Lab đã reset. Truy cập: http://localhost:7101"
