#!/bin/bash
# ============================================================
# VibePlayer Release Script
# Usage: ./release.sh
# 
# This script builds VibePlayer and generates release packages:
#   - Windows: NSIS installer (.exe) + Portable (.exe)
#   - macOS: DMG (if on macOS)
#
# Output: release/ directory
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  VibePlayer Release Builder"
echo "========================================"
echo ""

# ---- Configuration ----
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

export ELECTRON_MIRROR

echo "[1/3] Installing dependencies..."
npm install

echo ""
echo "[2/3] Building application..."
npm run build:electron

echo ""
echo "[3/3] Packaging for distribution..."

# Detect platform
OS="$(uname -s)"
case "$OS" in
  Darwin)
    echo "  Platform: macOS"
    echo "  Building: DMG (universal)"
    npx electron-builder --mac --publish never
    ;;
  Linux)
    echo "  Platform: Linux"
    echo "  Building: Windows NSIS + Portable (cross-compile)"
    npx electron-builder --win --publish never
    ;;
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    echo "  Platform: Windows (native)"
    echo "  Building: NSIS installer + Portable"
    npx electron-builder --win --publish never
    ;;
  *)
    echo "  Platform: unknown ($OS)"
    echo "  Building: Windows NSIS + Portable (cross-compile)"
    npx electron-builder --win --publish never
    ;;
esac

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "  Version:  $VERSION"
echo "  Output:   release/"
echo ""
echo "  Generated files:"
if [ -d "release" ]; then
  ls -lh release/*.exe release/*.dmg release/*.zip 2>/dev/null | awk '{print "    " $NF " (" $5 ")"}'
fi
echo ""
echo "  You can upload these files to GitHub Releases:"
echo "  https://github.com/taogejava/VibePlayer/releases/new"
echo ""
