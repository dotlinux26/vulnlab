#!/bin/bash

# ============================================
# VULNLAB - Auto Start All Labs Script
# ============================================
# Starts all docker compose labs in ctf-labs/labs/
# Port mappings are defined in ctf-labs/lab-routes.json

set -e

CTF_LABS_DIR="/home/nguyenduccanh/Documents/vulnlab/ctf-labs"
LABS_DIR="$CTF_LABS_DIR/labs"
ROUTES_FILE="$CTF_LABS_DIR/lab-routes.json"

echo "=========================================="
echo "VULNLAB - Starting All Labs"
echo "=========================================="

# Function to start a single lab
start_lab() {
    local lab_dir="$1"
    local lab_name=$(basename "$lab_dir")
    
    if [ -f "$lab_dir/docker-compose.yml" ]; then
        echo "[+] Starting $lab_name..."
        cd "$lab_dir"
        docker compose down -v 2>/dev/null || true
        docker compose up -d --build
        echo "[+] $lab_name started"
    else
        echo "[-] No docker-compose.yml found in $lab_dir, skipping"
    fi
}

# Start all labs in the labs directory
echo "[+] Starting all labs in $LABS_DIR"
for lab_dir in "$LABS_DIR"/*/; do
    if [ -d "$lab_dir" ]; then
        start_lab "$lab_dir"
    fi
done

echo ""
echo "=========================================="
echo "All labs started. Port mappings:"
echo "=========================================="
cat "$ROUTES_FILE" | jq -r 'to_entries[] | "\(.key) -> \(.value)"'
echo ""
echo "Gateway: http://localhost:7777"
echo "Access labs via: http://localhost:7777<path>"
echo "Example: http://localhost:7777/sqli"
