#!/bin/bash
# ============================================
# VULNLAB - Setup Labs (copy from lessons-content to ctf-labs)
# Run this after git pull to sync labs with fixed Dockerfiles
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LESSONS_DIR="$SCRIPT_DIR/lessons-content"
LABS_DIR="$SCRIPT_DIR/ctf-labs/labs"

echo "=========================================="
echo "VULNLAB - Syncing Labs from lessons-content"
echo "=========================================="

# Remove old labs directory
rm -rf "$LABS_DIR"
mkdir -p "$LABS_DIR"

# Copy labs from lessons-content to ctf-labs/labs
echo "[+] Copying labs from lessons-content..."
cp -r "$SCRIPT_DIR/lessons-content/7-burp-suite-basics/lab" "$LABS_DIR/7-burp-suite-basics"
cp -r "$SCRIPT_DIR/lessons-content/8-web-recon/lab" "$LABS_DIR/8-web-recon"
cp -r "$SCRIPT_DIR/lessons-content/9-fuzzing-content-discovery/lab" "$LABS_DIR/9-fuzzing-content-discovery"
cp -r "$SCRIPT_DIR/lessons-content/10-http-header-exploitation/lab" "$LABS_DIR/10-http-header-exploitation"
cp -r "$SCRIPT_DIR/lessons-content/11-sqli-basics/lab" "$LABS_DIR/11-sqli-basics"
cp -r "$SCRIPT_DIR/lessons-content/12-nosql-injection/lab" "$LABS_DIR/12-nosql-injection"
cp -r "$SCRIPT_DIR/lessons-content/13-sqli-blind/lab" "$LABS_DIR/13-sqli-blind"
cp -r "$SCRIPT_DIR/lessons-content/14-lfi-rfi/lab" "$LABS_DIR/14-lfi-rfi"
cp -r "$SCRIPT_DIR/lessons-content/15-xxe/lab" "$LABS_DIR/15-xxe"
cp -r "$SCRIPT_DIR/lessons-content/16-command-injection/lab" "$LABS_DIR/16-command-injection"

echo "[+] All labs synced to $LABS_DIR"
ls -la "$LABS_DIR"
