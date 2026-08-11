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

# Check if labs directory exists and has docker-compose files
if [ ! -d "$LABS_DIR" ] || [ -z "$(ls -A "$LABS_DIR")" ]; then
    echo "[!] Labs directory empty or missing. Run ./setup-labs.sh first to sync labs from lessons-content."
    exit 1
fi

# Verify Dockerfiles have correct syntax (no adduser -S, no addgroup -S)
echo "[+] Verifying Dockerfiles..."
for dockerfile in "$LABS_DIR"/*/Dockerfile; do
    if [ -f "$dockerfile" ]; then
        if grep -q "adduser -S" "$dockerfile"; then
            echo "[!] ERROR: Found 'adduser -S' in $dockerfile - this will fail on Alpine!"
            echo "    Run ./setup-labs.sh to sync fixed Dockerfiles from lessons-content"
            exit 1
        fi
        if grep -q "addgroup -S" "$dockerfile"; then
            echo "[!] ERROR: Found 'addgroup -S' in $dockerfile - this will fail on Alpine!"
            echo "    Run ./setup-labs.sh to sync fixed Dockerfiles from lessons-content"
            exit 1
        fi
    fi
done
echo "[+] All Dockerfiles verified OK"

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
# Sort numerically by lab number (7, 8, 10, 11... not 10, 11, 7, 8)
for lab_dir in $(ls -d "$LABS_DIR"/*/ | sort -t'-' -k2 -n); do
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
