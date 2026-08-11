#!/bin/bash

# ============================================
# VULNLAB - Auto Start All Labs Script
# ============================================
# Dynamic paths based on script location
# Usage: ./start-all-labs.sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CTF_LABS_DIR="$SCRIPT_DIR/ctf-labs"
LABS_DIR="$CTF_LABS_DIR/labs"
ROUTES_FILE="$CTF_LABS_DIR/lab-routes.json"

echo "=========================================="
echo "VULNLAB - Starting All Labs"
echo "=========================================="
echo "[+] Project root: $SCRIPT_DIR"
echo "[+] Labs directory: $LABS_DIR"

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
if [ -f "$ROUTES_FILE" ]; then
    cat "$ROUTES_FILE" | jq -r 'to_entries[] | "\(.key) -> \(.value)"'
else
    echo "Routes file not found: $ROUTES_FILE"
fi
echo ""
echo "Gateway: http://localhost:7777"
echo "Access labs via: http://localhost:7777<path>"
echo "Example: http://localhost:7777/sqli"
