# 📦 發布指南 - Daily Report System

本指南將引導您將項目發布到 GitHub。

---

## 🚀 快速發布（3 步驟）

### **步驟 1: 在 GitHub 創建新倉庫**

#### 方式 A: 使用網頁界面

1. 登入 GitHub: https://github.com
2. 點擊右上角的 `+` → `New repository`
3. 填寫倉庫資訊：

```
Repository name:    daily-report-system
Description:        一個現代化、模塊化的團隊日報管理系統，支援從 Google Sheets 直接讀取資料
Visibility:         ○ Public  ○ Private (您選擇)

⚠️ 重要：不要勾選以下選項：
☐ Add a README file
☐ Add .gitignore
☐ Choose a license

原因：我們已經在本地創建了這些文件
```

4. 點擊 `Create repository`
5. **記下您的倉庫 URL**，例如：
   ```
   https://github.com/YOUR_USERNAME/daily-report-system.git
   ```

#### 方式 B: 使用 GitHub CLI (如果已安裝)

```bash
cd /home/user/daily-report-system

# 創建公開倉庫
gh repo create daily-report-system --public --source=. --remote=origin

# 或創建私有倉庫
gh repo create daily-report-system --private --source=. --remote=origin
```

---

### **步驟 2: 推送到 GitHub**

在創建 GitHub 倉庫後，執行以下命令：

```bash
cd /home/user/daily-report-system

# 添加遠端倉庫 (替換 YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/daily-report-system.git

# 或使用 SSH (如果已設定 SSH key)
# git remote add origin git@github.com:YOUR_USERNAME/daily-report-system.git

# 重命名分支為 main (GitHub 推薦)
git branch -M main

# 推送到 GitHub
git push -u origin main
```

執行後您會看到：

```
Enumerating objects: 25, done.
Counting objects: 100% (25/25), done.
Delta compression using up to 8 threads
Compressing objects: 100% (22/22), done.
Writing objects: 100% (25/25), 100.00 KiB | 10.00 MiB/s, done.
Total 25 (delta 2), reused 0 (delta 0), pack-reused 0
To https://github.com/YOUR_USERNAME/daily-report-system.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ **完成！** 您的項目已成功推送到 GitHub！

訪問: `https://github.com/YOUR_USERNAME/daily-report-system`

---

### **步驟 3: 設定 GitHub Pages (可選但推薦)**

讓您的應用可以在線訪問：

1. 前往倉庫頁面
2. 點擊 `Settings` (設定)
3. 左側選單點擊 `Pages`
4. Source 設定：
   - Branch: `main`
   - Folder: `/ (root)`
5. 點擊 `Save`

⏳ 等待 1-2 分鐘後，您的網站將發布在：

```
https://YOUR_USERNAME.github.io/daily-report-system/
```

🎉 現在任何人都可以訪問您的應用！

---

## 📋 發布後的完善工作

### 1. **創建 Release (v2.0.0)**

```bash
# 方式 A: 使用 GitHub CLI
cd /home/user/daily-report-system
gh release create v2.0.0 --title "Daily Report System v2.0.0" --notes-file RELEASE_NOTES.md

# 方式 B: 使用網頁界面
```

**網頁界面步驟**:
1. 前往倉庫頁面
2. 點擊右側的 `Releases` → `Create a new release`
3. 填寫：
   - **Tag version**: `v2.0.0`
   - **Release title**: `Daily Report System v2.0.0`
   - **Description**: 複製 `RELEASE_NOTES.md` 的內容
4. 點擊 `Publish release`

### 2. **更新 README 中的鏈接**

將 README.md 中的佔位符替換為實際 URL：

```bash
# 在本地編輯 README.md
# 將以下內容替換：
# yourusername → YOUR_ACTUAL_USERNAME

# 提交並推送
git add README.md
git commit -m "docs: 更新 README 中的 GitHub 鏈接"
git push
```

### 3. **添加項目主題標籤 (Topics)**

在 GitHub 倉庫頁面：
1. 點擊右側的 ⚙️ (設定圖標)
2. 添加以下 Topics:
   ```
   daily-report
   team-management
   google-sheets
   chartjs
   analytics
   time-tracking
   modular-architecture
   javascript
   tailwindcss
   ```

### 4. **添加 About 描述**

在倉庫頁面右側點擊 ⚙️，填寫：
- **Description**: 一個現代化、模塊化的團隊日報管理系統
- **Website**: `https://YOUR_USERNAME.github.io/daily-report-system/`
- **Topics**: (如上)

### 5. **上傳項目截圖**

```bash
# 在本地創建 screenshots 目錄
cd /home/user/daily-report-system
mkdir -p docs/screenshots

# 將截圖放入此目錄
# 然後更新 README.md 中的圖片鏈接
# ![Screenshot](docs/screenshots/dashboard.png)

# 提交
git add docs/screenshots/
git add README.md
git commit -m "docs: 添加項目截圖"
git push
```

---

## 🔧 常見問題解決

### ❌ **問題 1: git push 時要求輸入用戶名密碼**

**原因**: GitHub 已停止支援密碼驗證

**解決方案**:

#### 方式 A: 使用 Personal Access Token (推薦)

1. 前往 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 點擊 `Generate new token` → `Generate new token (classic)`
3. 設定：
   - Note: `daily-report-system`
   - Expiration: `90 days` 或 `No expiration`
   - Scopes: 勾選 `repo` (完整控制)
4. 點擊 `Generate token`
5. **複製 token**（只會顯示一次！）

```bash
# 推送時使用 token 作為密碼
Username: YOUR_USERNAME
Password: ghp_YOUR_TOKEN_HERE
```

#### 方式 B: 使用 SSH Key

```bash
# 1. 生成 SSH key (如果還沒有)
ssh-keygen -t ed25519 -C "your.email@example.com"

# 2. 複製公鑰
cat ~/.ssh/id_ed25519.pub

# 3. 添加到 GitHub
# GitHub → Settings → SSH and GPG keys → New SSH key
# 貼上公鑰內容

# 4. 更改 remote URL
cd /home/user/daily-report-system
git remote set-url origin git@github.com:YOUR_USERNAME/daily-report-system.git

# 5. 再次推送
git push -u origin main
```

### ❌ **問題 2: 推送時顯示 "Updates were rejected"**

```bash
# 解決方案：強制推送（首次推送時可用）
git push -u origin main --force

# 或者先拉取再推送
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### ❌ **問題 3: GitHub Pages 404 錯誤**

**檢查清單**:
- [ ] index.html 在根目錄
- [ ] Settings → Pages 已正確設定
- [ ] 等待 1-2 分鐘讓部署完成
- [ ] 檢查大小寫敏感（Linux vs Windows）

---

## 📊 驗證檢查清單

推送後請確認：

### GitHub 倉庫頁面
- [ ] 能看到所有 22 個文件
- [ ] README.md 正確顯示
- [ ] 有 2 個 commits
- [ ] 文件結構正確

### GitHub Pages (如已設定)
- [ ] 網站可正常訪問
- [ ] 樣式正確載入
- [ ] JavaScript 功能正常
- [ ] Chart.js 圖表顯示

### Release 頁面
- [ ] v2.0.0 release 已創建
- [ ] Release notes 完整
- [ ] Tag 正確

---

## 🎯 下一步建議

### **推廣您的項目**

1. **添加到 GitHub Collections**
   - Awesome Lists
   - GitHub Topics

2. **社群分享**
   - Reddit (r/javascript, r/webdev)
   - Twitter/X (#javascript #opensource)
   - Dev.to
   - Medium

3. **尋求反饋**
   - GitHub Discussions
   - Show HN (Hacker News)
   - PTT

### **持續改進**

1. **設定 CI/CD**
   ```yaml
   # .github/workflows/ci.yml
   name: CI
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Run tests
           run: echo "Tests will go here"
   ```

2. **添加徽章到 README**
   ```markdown
   ![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/daily-report-system)
   ![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/daily-report-system)
   ![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/daily-report-system)
   ```

3. **設定 Issue 模板**
   - Bug report 模板
   - Feature request 模板
   - Pull request 模板

---

## 📞 需要幫助？

如果遇到問題：

1. **檢查 GitHub 文檔**
   - https://docs.github.com/

2. **Stack Overflow**
   - 搜尋錯誤訊息

3. **GitHub Community**
   - https://github.community/

---

## 🎉 恭喜！

完成以上步驟後，您將擁有一個：

✅ 託管在 GitHub 的開源項目
✅ 公開可訪問的線上 Demo
✅ 專業的項目文檔
✅ 版本管理和發布系統

**您的項目已準備好面向全世界！** 🌍

---

**最後更新**: 2025-12-30
**項目版本**: 2.0.0
