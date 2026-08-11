#!/bin/bash

# ============================================
# VULNLAB - Stop All Labs Script
# ============================================
# Dynamic paths based on script location

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LABS_DIR="$SCRIPT_DIR/ctf-labs/labs"

echo "=========================================="
echo "VULNLAB - Stopping All Labs"
echo "=========================================="
echo "[+] Project root: $SCRIPT_DIR"

for lab_dir in "$LABS_DIR"/*/; do
    if [ -d "$lab_dir" ] && [ -f "$lab_dir/docker-compose.yml" ]; then
        lab_name=$(basename "$lab_dir")
        echo "[+] Stopping $lab_name..."
        cd "$lab_dir"
        docker compose down -v
    fi
done

echo "[+] All labs stopped"
