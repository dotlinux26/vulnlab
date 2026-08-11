#!/bin/bash

# ============================================
# VULNLAB - Stop All Labs Script
# ============================================

LABS_DIR="/home/nguyenduccanh/Documents/vulnlab/ctf-labs/labs"

echo "=========================================="
echo "VULNLAB - Stopping All Labs"
echo "=========================================="

for lab_dir in "$LABS_DIR"/*/; do
    if [ -d "$lab_dir" ] && [ -f "$lab_dir/docker-compose.yml" ]; then
        lab_name=$(basename "$lab_dir")
        echo "[+] Stopping $lab_name..."
        cd "$lab_dir"
        docker compose down -v
    fi
done

echo "[+] All labs stopped"
