# 🚀 快速開始 - 3 分鐘發布到 GitHub

---

## ⚡ 超快速版本（如果您很熟悉 Git/GitHub）

```bash
# 1. 在 GitHub 上創建新倉庫 'daily-report-system' (不要初始化)
# 2. 執行發布腳本（替換成您的 GitHub 用戶名）

cd /home/user/daily-report-system
./publish.sh YOUR_GITHUB_USERNAME

# 3. 完成！訪問 https://github.com/YOUR_USERNAME/daily-report-system
```

---

## 📝 詳細步驟（新手友好）

### **步驟 1: 在 GitHub 創建倉庫** (1 分鐘)

1. **登入 GitHub**: https://github.com

2. **創建新倉庫**:
   - 點擊右上角 `+` → `New repository`
   - 或直接訪問: https://github.com/new

3. **填寫倉庫資訊**:
   ```
   Repository name*:    daily-report-system
   Description:         一個現代化、模塊化的團隊日報管理系統

   ○ Public  (公開 - 推薦)
   ○ Private (私有)

   ⚠️ 重要：不要勾選以下任何選項！
   ☐ Add a README file
   ☐ Add .gitignore
   ☐ Choose a license
   ```

4. **點擊** `Create repository` (綠色按鈕)

5. **記下您的用戶名**（URL 中會顯示）

✅ **完成！** 現在您有一個空的 GitHub 倉庫了。

---

### **步驟 2: 執行發布腳本** (1 分鐘)

在終端執行：

```bash
cd /home/user/daily-report-system

# 替換 YOUR_USERNAME 為您的 GitHub 用戶名
# 例如: ./publish.sh erikhuang76821
./publish.sh YOUR_USERNAME
```

**腳本會自動執行**:
- ✅ 檢查 Git 狀態
- ✅ 設定遠端倉庫
- ✅ 推送所有文件到 GitHub
- ✅ 生成快速鏈接文件

**如果需要輸入密碼**:
- Username: `您的 GitHub 用戶名`
- Password: `您的 Personal Access Token` (不是密碼！)

> 💡 **沒有 Token？** 看[這裡](#如何獲取-personal-access-token)

---

### **步驟 3: 設定 GitHub Pages** (1 分鐘) ⭐ 推薦

讓您的應用可以在線訪問！

1. **前往倉庫設定**:
   - 訪問: `https://github.com/YOUR_USERNAME/daily-report-system`
   - 點擊 `Settings` (設定)

2. **設定 Pages**:
   - 左側選單點擊 `Pages`
   - **Source** 選擇:
     - Branch: `main`
     - Folder: `/ (root)`
   - 點擊 `Save`

3. **等待部署** (約 1-2 分鐘)
   - 頁面會顯示: "Your site is live at..."

4. **訪問您的網站**:
   ```
   https://YOUR_USERNAME.github.io/daily-report-system/
   ```

🎉 **完成！** 您的應用現在全世界都可以訪問了！

---

## 🎁 額外步驟（可選但推薦）

### **創建 Release (v2.0.0)**

1. 訪問: `https://github.com/YOUR_USERNAME/daily-report-system/releases/new`

2. 填寫:
   ```
   Choose a tag:        v2.0.0
   Release title:       Daily Report System v2.0.0
   Description:         (複製 RELEASE_NOTES.md 的內容)
   ```

3. 點擊 `Publish release`

### **添加項目主題標籤**

在倉庫主頁:
1. 點擊 About 旁的 ⚙️ (齒輪圖標)
2. 添加 Topics:
   ```
   daily-report, team-management, google-sheets,
   chartjs, javascript, tailwindcss, analytics
   ```
3. 點擊 `Save changes`

### **更新 README 中的 URL**

```bash
cd /home/user/daily-report-system

# 編輯 README.md，將 'yourusername' 替換為您的實際用戶名
# 然後提交

git add README.md
git commit -m "docs: 更新 GitHub 鏈接"
git push
```

---

## 🆘 常見問題

### **Q: 推送時要求輸入密碼，但我的密碼不對？**

**A**: GitHub 不再接受密碼！您需要使用 **Personal Access Token**。

#### 如何獲取 Personal Access Token:

1. **前往 GitHub 設定**:
   - https://github.com/settings/tokens

2. **創建新 Token**:
   - 點擊 `Generate new token` → `Generate new token (classic)`

3. **設定 Token**:
   ```
   Note:        daily-report-system
   Expiration:  90 days (或選擇其他)
   Scopes:      ☑ repo (勾選)
   ```

4. **生成並複製**:
   - 點擊 `Generate token`
   - **立即複製 token**（只會顯示一次！）
   - 格式類似: `ghp_xxxxxxxxxxxxxxxxxxxx`

5. **使用 Token 推送**:
   ```
   Username: YOUR_USERNAME
   Password: ghp_xxxxxxxxxxxxxxxxxxxx (貼上 token)
   ```

### **Q: 推送失敗，顯示 "repository not found"？**

**A**: 請確認:
- ✅ 倉庫名稱正確（`daily-report-system`）
- ✅ 用戶名正確
- ✅ 倉庫已在 GitHub 上創建

### **Q: GitHub Pages 顯示 404？**

**A**: 請:
- ⏳ 等待 1-2 分鐘讓部署完成
- ✅ 確認 Settings → Pages 設定正確
- ✅ 檢查 `index.html` 在根目錄

### **Q: 我想使用 SSH 而不是 HTTPS？**

**A**: 修改 remote URL:
```bash
cd /home/user/daily-report-system
git remote set-url origin git@github.com:YOUR_USERNAME/daily-report-system.git
git push
```

---

## 📁 快速鏈接（發布後生成）

執行發布腳本後會生成 `GITHUB_LINKS.txt`，包含所有重要鏈接：
- 倉庫主頁
- Settings 設定
- GitHub Pages 配置
- Release 創建頁面
- 等等...

---

## 📚 更多資源

- **詳細發布指南**: [PUBLISH_GUIDE.md](PUBLISH_GUIDE.md)
- **項目 README**: [README.md](README.md)
- **貢獻指南**: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **變更日誌**: [CHANGELOG.md](CHANGELOG.md)

---

## ✅ 檢查清單

發布完成後，確認以下項目:

- [ ] GitHub 倉庫已創建並可訪問
- [ ] 所有文件都已推送（22 個文件）
- [ ] README 在倉庫主頁正確顯示
- [ ] GitHub Pages 已設定並可訪問
- [ ] Release v2.0.0 已創建
- [ ] 項目主題標籤已添加

---

## 🎉 完成後

恭喜！您現在擁有:

✅ 一個公開的 GitHub 開源項目
✅ 線上可訪問的應用 Demo
✅ 專業的項目展示頁面
✅ 版本管理和發布系統

**下一步**:
- 分享您的項目鏈接
- 邀請其他人協作
- 持續改進和更新

---

**祝您發布順利！** 🚀

如有問題，請查看 [PUBLISH_GUIDE.md](PUBLISH_GUIDE.md) 獲取更詳細的說明。
