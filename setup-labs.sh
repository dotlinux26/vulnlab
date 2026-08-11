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

# Copy labs from lessons-content to ctf-labs/labs (only if lab/ folder exists)
echo "[+] Copying labs from lessons-content..."
for lesson in "$LESSONS_DIR"/*/; do
    lab_name=$(basename "$lesson")
    if [ -d "$lesson/lab" ]; then
        cp -r "$lesson/lab" "$LABS_DIR/$lab_name"
        echo "  ✓ Copied $lab_name"
    else
        echo "  ⊘ Skipped $lab_name (no lab/ folder)"
    fi
done

echo "[+] All labs synced to $LABS_DIR"
ls -la "$LABS_DIR"