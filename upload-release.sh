#!/bin/bash
# ============================================================
# VibePlayer GitHub Release Upload Script
# Usage: GITHUB_TOKEN=ghp_xxx ./upload-release.sh
#
# This script:
#   1. Creates a GitHub Release (tag: v{version})
#   2. Uploads all files in release/ directory as assets
#
# Required: GITHUB_TOKEN environment variable
#   - Go to: https://github.com/settings/tokens
#   - Create token with "repo" scope
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ---- Config ----
OWNER="taogejava"
REPO="VibePlayer"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
TAG="v${VERSION}"
RELEASE_DIR="release"

# ---- Color Output ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "  VibePlayer GitHub Release Uploader"
echo "========================================"
echo ""

# ---- Check Token ----
if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${RED}[ERROR] GITHUB_TOKEN is not set!${NC}"
  echo ""
  echo "  Get your token at: https://github.com/settings/tokens"
  echo "  Required scope: repo"
  echo ""
  echo "  Usage:"
  echo "    GITHUB_TOKEN=ghp_yourtoken ./upload-release.sh"
  echo ""
  exit 1
fi

# ---- Check release directory ----
if [ ! -d "$RELEASE_DIR" ]; then
  echo -e "${RED}[ERROR] release/ directory not found!${NC}"
  echo "  Run ./release.sh first to build the packages."
  exit 1
fi

# ---- List files to upload ----
UPLOAD_FILES=()
while IFS= read -r -d $'\0' f; do
  UPLOAD_FILES+=("$f")
done < <(find "$RELEASE_DIR" -maxdepth 1 \( -name "*.dmg" -o -name "*.exe" -o -name "*.zip" \) -print0 2>/dev/null)

if [ ${#UPLOAD_FILES[@]} -eq 0 ]; then
  echo -e "${RED}[ERROR] No release files found in release/ directory!${NC}"
  echo "  Expected: .dmg, .exe, or .zip files"
  exit 1
fi

echo "  Version:  ${TAG}"
echo "  Repo:     ${OWNER}/${REPO}"
echo "  Files to upload:"
for f in "${UPLOAD_FILES[@]}"; do
  SIZE=$(ls -lh "$f" | awk '{print $5}')
  echo "    - $(basename $f) (${SIZE})"
done
echo ""

# ---- Step 1: Check if release already exists ----
echo "[1/3] Checking for existing release ${TAG}..."
  EXISTING_RELEASE=$(curl -s \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}")

RELEASE_ID=$(echo "$EXISTING_RELEASE" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")

if [ -n "$RELEASE_ID" ] && [ "$RELEASE_ID" != "None" ]; then
  echo -e "  ${YELLOW}Release ${TAG} already exists (id: ${RELEASE_ID}), will upload assets to it.${NC}"
else
  # ---- Step 2: Create Release ----
  echo "[2/3] Creating GitHub Release ${TAG}..."
  
  RELEASE_BODY="## VibePlayer ${TAG}\n\n### 下载说明\n\n| 文件 | 平台 | 说明 |\n|------|------|------|\n| \`*-mac.dmg\` | macOS | 拖拽安装，支持 Apple Silicon & Intel |\n| \`*-setup.exe\` | Windows | 标准安装包，带桌面快捷方式 |\n| \`*-portable.exe\` | Windows | 便携版，无需安装，直接运行 |\n\n### 使用方法\n1. 下载对应平台的安装包\n2. macOS: 打开 DMG，拖拽 VibePlayer 到应用程序文件夹\n3. Windows: 运行安装包或直接运行便携版\n4. 打开应用 → 点击「本地」→「选择文件夹」→ 选择音乐目录 → 开始播放 🎵"

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${OWNER}/${REPO}/releases" \
    -d "{
      \"tag_name\": \"${TAG}\",
      \"target_commitish\": \"master\",
      \"name\": \"VibePlayer ${TAG}\",
      \"body\": \"${RELEASE_BODY}\",
      \"draft\": false,
      \"prerelease\": false
    }")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" != "201" ]; then
    echo -e "${RED}[ERROR] Failed to create release (HTTP ${HTTP_CODE})${NC}"
    echo "$BODY" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print('  Message:', d.get('message',''))" 2>/dev/null || echo "$BODY"
    exit 1
  fi

  RELEASE_ID=$(echo "$BODY" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
  echo -e "  ${GREEN}Release created! (id: ${RELEASE_ID})${NC}"
fi

# ---- Step 3: Upload Assets ----
echo ""
echo "[3/3] Uploading assets..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for FILE_PATH in "${UPLOAD_FILES[@]}"; do
  FILE_NAME=$(basename "$FILE_PATH")
  FILE_SIZE=$(ls -lh "$FILE_PATH" | awk '{print $5}')
  
  # Determine MIME type
  case "$FILE_NAME" in
    *.dmg)  MIME="application/x-apple-diskimage" ;;
    *.exe)  MIME="application/x-msdownload" ;;
    *.zip)  MIME="application/zip" ;;
    *)      MIME="application/octet-stream" ;;
  esac

  echo "  Uploading: ${FILE_NAME} (${FILE_SIZE})..."
  
  UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: ${MIME}" \
    --data-binary @"${FILE_PATH}" \
    "https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${RELEASE_ID}/assets?name=${FILE_NAME}")

  UPLOAD_CODE=$(echo "$UPLOAD_RESPONSE" | tail -1)
  UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | head -n -1)

  if [ "$UPLOAD_CODE" = "201" ]; then
    DOWNLOAD_URL=$(echo "$UPLOAD_BODY" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('browser_download_url',''))" 2>/dev/null)
    echo -e "  ${GREEN}✓ Uploaded: ${FILE_NAME}${NC}"
    if [ -n "$DOWNLOAD_URL" ]; then
      echo "    → ${DOWNLOAD_URL}"
    fi
    ((SUCCESS_COUNT++)) || true
  else
    echo -e "  ${RED}✗ Failed: ${FILE_NAME} (HTTP ${UPLOAD_CODE})${NC}"
    echo "$UPLOAD_BODY" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print('    Error:', d.get('message',''))" 2>/dev/null || true
    ((FAIL_COUNT++)) || true
  fi
  echo ""
done

# ---- Summary ----
echo "========================================"
echo "  Upload Complete!"
echo "========================================"
echo ""
echo "  Succeeded: ${SUCCESS_COUNT} file(s)"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "  ${RED}Failed: ${FAIL_COUNT} file(s)${NC}"
fi
echo ""
echo "  View your release at:"
echo "  https://github.com/${OWNER}/${REPO}/releases/tag/${TAG}"
echo ""
