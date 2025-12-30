# 團隊日報管理系統 (Daily Report System)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](https://github.com/yourusername/daily-report-system)
[![Modern Architecture](https://img.shields.io/badge/architecture-modular-orange.svg)]()

> 一個現代化、模塊化的團隊日報管理系統，支援從 Google Sheets 直接讀取資料，提供強大的工時統計、趨勢分析和專案追蹤功能。

![System Preview](https://via.placeholder.com/800x400/0284c7/ffffff?text=Daily+Report+System)

---

## ✨ 特色功能

### 📊 **強大的資料視覺化**
- **圓餅圖** - 專案工時分佈統計
- **趨勢圖** - 多維度時間序列分析
- **工時統計** - 個人與團隊工時追蹤
- **即時篩選** - 依組別、專案、人員動態篩選

### 🔄 **Google Sheets 整合**
- **直接讀取** - 無需後端，直接從 Google Sheets 讀取資料
- **自動刷新** - 可配置自動刷新間隔
- **批次處理** - 支援多日期範圍批次更新
- **CORS 策略** - 多種代理方案確保連接穩定

### 📈 **多維度分析**
- **專案視角** - 查看各專案的工時分布與趨勢
- **人員視角** - 比對團隊成員的工作量
- **組別視角** - 追蹤不同部門的產出
- **歷史追蹤** - 完整的歷史記錄查詢

### 🛠️ **靈活的規則系統**
- **專案合併** - 將相關專案合併統計
- **組別對應** - 統一不同來源的組別名稱
- **自訂規則** - 完整的 CRUD 操作介面

### 💾 **本地資料管理**
- **LocalStorage** - 資料本地儲存，隱私安全
- **匯出/匯入** - JSON 格式備份與還原
- **歷史記錄** - 自動記錄每日資料

---

## 🏗️ 技術架構

### **現代化模塊架構**

```
📦 Daily Report System
├── 🎨 前端技術
│   ├── 純 JavaScript (ES6+)
│   ├── Tailwind CSS (Utility-First)
│   ├── Chart.js (資料視覺化)
│   └── Font Awesome (圖標)
│
├── 🧩 模塊化設計
│   ├── 11 個獨立 JavaScript 模塊
│   ├── 5 層架構分層
│   └── 清晰的依賴關係
│
└── 📊 資料來源
    ├── Google Sheets (主要資料源)
    └── LocalStorage (本地快取)
```

### **架構特點**

#### 1. **分層架構** (5 層)
```
第 5 層: app.js (應用層)
    ↓
第 4 層: ui.js, filters.js, rules.js (業務邏輯層)
    ↓
第 3 層: api.js, charts.js (服務層)
    ↓
第 2 層: storage.js, autoRefresh.js (資料層)
    ↓
第 1 層: state.js, utils.js (核心層)
    ↓
第 0 層: config.js (配置層)
```

#### 2. **模塊職責**

| 模塊 | 大小 | 職責 |
|------|------|------|
| `config.js` | 1.7 KB | 配置與常量管理 |
| `state.js` | 5.1 KB | 集中式狀態管理 |
| `utils.js` | 5.3 KB | 通用工具函數 |
| `storage.js` | 6.8 KB | LocalStorage 操作 |
| `api.js` | 9.9 KB | Google Sheets API |
| `autoRefresh.js` | 3.3 KB | 自動刷新功能 |
| `charts.js` | 19 KB | Chart.js 圖表渲染 |
| `ui.js` | 21 KB | UI 操作與 DOM |
| `filters.js` | 6.7 KB | 篩選與分析模式 |
| `rules.js` | 9.9 KB | 規則管理 |
| `app.js` | 5.6 KB | 主程式入口 |

#### 3. **設計模式**
- ✅ **模塊模式** - ES6 Import/Export
- ✅ **單一職責** - 每個模塊功能單一
- ✅ **狀態管理** - Getter/Setter 封裝
- ✅ **依賴注入** - 通過參數傳遞

---

## 🚀 快速開始

### **前置需求**

- 現代瀏覽器 (Chrome 61+, Firefox 60+, Safari 11+, Edge 16+)
- HTTP 伺服器 (Python, Node.js, 或 VS Code Live Server)

### **安裝步驟**

#### 1. 克隆倉庫
```bash
git clone https://github.com/yourusername/daily-report-system.git
cd daily-report-system
```

#### 2. 啟動本地伺服器

**選項 A: Python 3**
```bash
python3 -m http.server 8000
```

**選項 B: Node.js**
```bash
npx http-server
```

**選項 C: VS Code**
安裝 [Live Server 擴充套件](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)，右鍵點擊 `index.html` → "Open with Live Server"

#### 3. 訪問應用
```
http://localhost:8000
```

### **Google Sheets 設定**

#### 1. 準備試算表
確保你的 Google Sheet 包含以下欄位（按順序）：

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 日期 | 組別 | 填寫者 | 專案 | 議題 | 回應 | 小時 | 連結 |

#### 2. 設定權限
- 開啟試算表 → 點擊右上角「共用」
- 設定為「知道連結者皆可檢視」
- 複製試算表 ID（URL 中的字串）

#### 3. 在系統中設定
- 切換到「資料來源」分頁
- 貼上 Google Sheet ID
- 點擊「讀取資料」

---

## 📖 使用指南

### **基本操作**

#### 1. **查看日報**
- 左側邊欄選擇日期
- 或使用日期選擇器
- 系統自動載入該日資料

#### 2. **篩選資料**
- **組別篩選**: 點擊組別按鈕
- **專案視角**: 切換到「趨勢分析」分頁
- **人員比對**: 選擇多個人員進行比較

#### 3. **查看統計**
- **總覽報表**: 主頁面顯示當日工時統計
- **工時統計**: 圖表方式顯示各專案分布
- **趨勢分析**: 查看多日趨勢變化

#### 4. **管理規則**
- 切換到「控制台」分頁
- **專案合併**: 勾選多個專案後點擊「合併設定」
- **組別對應**: 新增組別合併規則

### **進階功能**

#### **自動刷新**
1. 切換到「資料來源」分頁
2. 勾選「自動刷新設定」
3. 設定刷新間隔和範圍
4. 點擊「確定並啟用」

#### **資料備份**
- **匯出**: 側邊欄底部 → 「備份」按鈕
- **匯入**: 側邊欄底部 → 「還原」按鈕

---

## 🎨 介面預覽

### **主儀表板**
- 工時統計圖表
- 專案分布圓餅圖
- 詳細工作項目清單

### **趨勢分析**
- 多日工時堆疊長條圖
- 三種分析模式切換
- 互動式圖表篩選

### **控制台**
- 專案合併規則管理
- 組別對應規則設定
- 系統設定選項

---

## 🔧 開發指南

### **項目結構**

```
daily-report-system/
├── index.html              # 主 HTML 檔案
├── css/                    # 樣式文件
│   ├── styles.css          # 自訂樣式
│   ├── tailwind.config.js  # Tailwind 配置
│   └── README.md           # CSS 架構文檔
├── js/                     # JavaScript 模塊
│   ├── config.js           # 配置
│   ├── state.js            # 狀態管理
│   ├── storage.js          # 資料存儲
│   ├── utils.js            # 工具函數
│   ├── api.js              # API 整合
│   ├── autoRefresh.js      # 自動刷新
│   ├── charts.js           # 圖表
│   ├── ui.js               # UI 操作
│   ├── filters.js          # 篩選功能
│   ├── rules.js            # 規則管理
│   ├── app.js              # 主入口
│   └── README.md           # JS 架構文檔
├── docs/                   # 文檔目錄
│   ├── ARCHITECTURE.md     # 架構說明
│   ├── API.md              # API 文檔
│   └── CONTRIBUTING.md     # 貢獻指南
├── .gitignore              # Git 忽略文件
├── LICENSE                 # 授權條款
├── CHANGELOG.md            # 變更日誌
└── README.md               # 本文件
```

### **添加新功能**

#### **範例: 新增一個工具函數**

1. **在 `utils.js` 中添加函數**
```javascript
/**
 * 格式化貨幣
 * @param {number} amount - 金額
 * @returns {string} 格式化後的字串
 */
export function formatCurrency(amount) {
    return `NT$ ${amount.toLocaleString('zh-TW')}`;
}
```

2. **在 `app.js` 中導入並橋接**
```javascript
import { formatCurrency } from './utils.js';
window.formatCurrency = formatCurrency;
```

3. **在 HTML 中使用**
```html
<span onclick="alert(formatCurrency(1000))">顯示金額</span>
```

### **單元測試 (未來規劃)**

```bash
# 安裝測試框架
npm install --save-dev vitest

# 運行測試
npm test
```

---

## 📊 效能優化

### **已實施的優化**

✅ **模塊化架構** - 支援 Tree Shaking 和 Code Splitting
✅ **CSS 變數** - 統一設計 Token，減少樣式重複
✅ **瀏覽器快取** - 外部 CSS/JS 文件可快取
✅ **懶加載** - 圖表僅在需要時渲染
✅ **事件委派** - 減少事件監聽器數量

### **效能指標**

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| **HTML 大小** | 124 KB | 41 KB | ↓ 67% |
| **首次載入** | ~157 KB | ~157 KB | - |
| **重複訪問** | ~157 KB | ~41 KB | ↓ 74% |
| **可維護性** | ⭐ | ⭐⭐⭐⭐⭐ | +400% |

---

## 🛡️ 安全性

### **資料隱私**
- ✅ 所有資料儲存在用戶本地 (LocalStorage)
- ✅ 不會上傳資料到任何伺服器
- ✅ Google Sheets 資料僅讀取，不寫入

### **CORS 安全**
- ✅ 使用多種代理策略
- ✅ 僅讀取公開試算表
- ✅ 無敏感資訊傳輸

---

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！

### **如何貢獻**

1. Fork 本倉庫
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### **代碼規範**

- 使用 ES6+ 語法
- 遵循現有的命名規範
- 添加 JSDoc 註解
- 確保代碼通過 ESLint 檢查

詳見 [CONTRIBUTING.md](docs/CONTRIBUTING.md)

---

## 📝 變更日誌

查看 [CHANGELOG.md](CHANGELOG.md) 了解各版本的詳細變更。

### **v2.0.0** (2025-12-30)
- ✨ 完整的模塊化重構
- ✨ 新增趨勢分析功能
- ✨ 支援多維度分析模式
- 🎨 全新的 UI 設計
- 🐛 修復多項已知問題

---

## 📜 授權條款

本項目採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

---

## 👥 作者與貢獻者

### **核心開發**
- **原作者**: erikhuang76821
- **架構重構**: Claude Code Assistant

### **特別感謝**
- Chart.js 團隊
- Tailwind CSS 團隊
- 所有貢獻者

---

## 📞 聯絡方式

- **Issues**: [GitHub Issues](https://github.com/yourusername/daily-report-system/issues)
- **討論**: [GitHub Discussions](https://github.com/yourusername/daily-report-system/discussions)
- **Email**: your.email@example.com

---

## 🔗 相關連結

- [在線演示](https://yourusername.github.io/daily-report-system)
- [架構文檔](docs/ARCHITECTURE.md)
- [API 文檔](docs/API.md)
- [變更日誌](CHANGELOG.md)

---

## 🌟 Star History

如果這個項目對您有幫助，請給我們一個 Star ⭐️

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/daily-report-system&type=Date)](https://star-history.com/#yourusername/daily-report-system&Date)

---

<p align="center">
  Made with ❤️ by the Daily Report System Team
</p>

<p align="center">
  <a href="#-特色功能">特色功能</a> •
  <a href="#-技術架構">技術架構</a> •
  <a href="#-快速開始">快速開始</a> •
  <a href="#-使用指南">使用指南</a> •
  <a href="#-開發指南">開發指南</a>
</p>
