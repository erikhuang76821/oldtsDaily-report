#!/bin/bash

# Daily Report System - GitHub 發布腳本
# 使用方式: ./publish.sh YOUR_GITHUB_USERNAME

set -e  # 遇到錯誤時停止

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Daily Report System - 發布工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 檢查參數
if [ -z "$1" ]; then
    echo -e "${RED}錯誤：請提供您的 GitHub 用戶名${NC}"
    echo ""
    echo "使用方式:"
    echo "  ./publish.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "範例:"
    echo "  ./publish.sh erikhuang76821"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="daily-report-system"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo -e "${YELLOW}GitHub 用戶名:${NC} ${GITHUB_USERNAME}"
echo -e "${YELLOW}倉庫名稱:${NC} ${REPO_NAME}"
echo -e "${YELLOW}倉庫 URL:${NC} ${REPO_URL}"
echo ""

# 確認
echo -e "${YELLOW}⚠️  請確認您已在 GitHub 上創建了倉庫：${NC}"
echo "   1. 前往 https://github.com/new"
echo "   2. Repository name: ${REPO_NAME}"
echo "   3. ⚠️ 不要勾選 'Initialize this repository with a README'"
echo ""
read -p "已經創建倉庫了嗎？(y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}請先在 GitHub 上創建倉庫，然後再次運行此腳本。${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ 開始發布流程...${NC}"
echo ""

# 步驟 1: 檢查 Git 狀態
echo -e "${BLUE}[1/6]${NC} 檢查 Git 狀態..."
if [ ! -d .git ]; then
    echo -e "${RED}錯誤：這不是一個 Git 倉庫${NC}"
    exit 1
fi

# 提交未提交的文件
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}發現未提交的文件，正在提交...${NC}"
    git add .
    git commit -m "chore: 準備發布到 GitHub"
fi

echo -e "${GREEN}✓ Git 狀態檢查完成${NC}"
echo ""

# 步驟 2: 檢查是否已有 remote
echo -e "${BLUE}[2/6]${NC} 設定遠端倉庫..."
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}警告：origin remote 已存在，將會移除並重新添加${NC}"
    git remote remove origin
fi

git remote add origin "$REPO_URL"
echo -e "${GREEN}✓ 遠端倉庫設定完成${NC}"
echo ""

# 步驟 3: 重命名分支為 main
echo -e "${BLUE}[3/6]${NC} 重命名分支為 main..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git branch -M main
    echo -e "${GREEN}✓ 分支已重命名為 main${NC}"
else
    echo -e "${GREEN}✓ 分支已經是 main${NC}"
fi
echo ""

# 步驟 4: 推送到 GitHub
echo -e "${BLUE}[4/6]${NC} 推送到 GitHub..."
echo -e "${YELLOW}如果需要輸入密碼，請使用 Personal Access Token${NC}"
echo ""

if git push -u origin main; then
    echo -e "${GREEN}✓ 成功推送到 GitHub！${NC}"
else
    echo -e "${RED}推送失敗。${NC}"
    echo ""
    echo "可能的原因："
    echo "1. 需要驗證 - 請使用 Personal Access Token"
    echo "2. 倉庫不存在 - 請確認已在 GitHub 上創建"
    echo "3. 網路問題 - 請檢查網路連接"
    echo ""
    echo "請參考 PUBLISH_GUIDE.md 獲取詳細說明"
    exit 1
fi
echo ""

# 步驟 5: 顯示倉庫資訊
echo -e "${BLUE}[5/6]${NC} 發布資訊..."
echo ""
echo -e "${GREEN}🎉 發布成功！${NC}"
echo ""
echo "您的倉庫:"
echo -e "  ${BLUE}https://github.com/${GITHUB_USERNAME}/${REPO_NAME}${NC}"
echo ""

# 步驟 6: 後續步驟提示
echo -e "${BLUE}[6/6]${NC} 後續步驟..."
echo ""
echo "建議完成以下設定："
echo ""
echo "1️⃣  設定 GitHub Pages (線上 Demo)"
echo "   - 前往: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/settings/pages"
echo "   - Source: main 分支"
echo "   - 網站將發布在: https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"
echo ""
echo "2️⃣  創建 Release (v2.0.0)"
echo "   - 前往: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/releases/new"
echo "   - Tag: v2.0.0"
echo "   - 複製 RELEASE_NOTES.md 的內容"
echo ""
echo "3️⃣  添加項目主題標籤"
echo "   - 點擊倉庫頁面右側的 ⚙️"
echo "   - 添加: daily-report, team-management, google-sheets, chartjs"
echo ""
echo "4️⃣  更新 README 中的 URL"
echo "   - 將 'yourusername' 替換為 '${GITHUB_USERNAME}'"
echo ""

# 創建快速鏈接文件
cat > GITHUB_LINKS.txt << EOF
Daily Report System - GitHub 鏈接

倉庫主頁:
https://github.com/${GITHUB_USERNAME}/${REPO_NAME}

Settings (設定):
https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/settings

GitHub Pages 設定:
https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/settings/pages

創建 Release:
https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/releases/new

GitHub Pages 網站 (設定後):
https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/

Clone URL (HTTPS):
https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

Clone URL (SSH):
git@github.com:${GITHUB_USERNAME}/${REPO_NAME}.git
EOF

echo -e "${GREEN}✓ GitHub 鏈接已保存到 GITHUB_LINKS.txt${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  發布完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "詳細說明請查看: PUBLISH_GUIDE.md"
