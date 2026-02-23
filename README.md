# 團隊日報管理系統 (Google Sheet 版)

一個輕量級的單頁應用程式 (SPA)，直接連結 Google Sheets 作為資料來源，提供團隊工時統計、專案分析與趨勢追蹤功能。

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 📊 **總覽儀表板** | 自動彙整每日工時，依人員分組顯示（低於 8hr 警示 / 超過 10hr 提醒） |
| 🔍 **群組篩選** | 依組別動態篩選，快速切換檢視不同團隊 |
| 📁 **專案統計** | 圓餅圖 + 表格呈現專案工時佔比，支援合併同質專案 |
| 📈 **趨勢分析** | 可切換日/月模式的長期工時趨勢圖表與表格 |
| ⚙️ **設定管理** | 匯入/匯出合併規則 (JSON)，自訂專案與組別對應 |
| 🔄 **自動更新** | 可設定 3/7/30 天範圍的自動刷新排程 |
| 💾 **離線快取** | 使用 IndexedDB (localForage) 儲存歷史資料，離線可用 |

---

## 技術棧

### 前端框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **HTML5** | - | 單檔應用結構 |
| **Tailwind CSS** | CDN | 響應式 UI 樣式 |
| **Font Awesome** | 6.4.0 | 圖示庫 |
| **Chart.js** | CDN (latest) | 圓餅圖 + 長條圖 |
| **localForage** | 1.10.0 | IndexedDB 封裝，離線資料快取 |

### 資料來源

| 技術 | 說明 |
|------|------|
| **Google Visualization API** | 透過 `gviz/tq` 端點查詢 Google Sheet 資料 |
| **CORS Proxy** | 備援策略：corsproxy.io / allorigins.win |

### 測試框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **Vitest** | 4.x | 單元測試執行器 |
| **jsdom** | - | 瀏覽器環境模擬 |

### 安全防護

| 防護措施 | 說明 |
|----------|------|
| **Content Security Policy (CSP)** | `<meta>` 標籤限制腳本/樣式/字型/連線來源 |
| **XSS 防護** | `escapeHtml()` 轉義所有外部資料的 HTML 特殊字元 |
| **URL 消毒** | `sanitizeUrl()` 只允許 http/https 協定 |
| **屬性消毒** | `sanitizeAttr()` 移除 onclick 等屬性中的危險字元 |
| **Prototype Pollution 防護** | `stripDangerousKeys()` 阻擋 `__proto__`/`constructor` 注入 |
| **Tabnabbing 防護** | 所有 `target="_blank"` 加上 `rel="noopener noreferrer"` |

### 資料清洗 (Data Cleansing)

| 清洗項目 | 處理方式 |
|----------|----------|
| 人名正規化 | 全形空白/括號轉半形，壓縮連續空白 |
| 工時範圍限制 | `Math.max(0, Math.min(val, 24))` |
| 空專案名 | 預設為「未分類」 |
| 內容前後空行 | 移除前後多餘換行 |
| 議題 ID 正規化 | 移除前導 `#` 字元 |
| 連結消毒 | 入庫時即用 `sanitizeUrl()` 過濾 |

---

## 專案結構

```
oldtsDaily-report/
├── index.html              # 主應用程式（單檔 SPA）
├── package.json            # npm 專案設定
├── vitest.config.js        # Vitest 測試設定
└── src/
    ├── logic.js            # 抽離的商業邏輯函式
    ├── logic.test.js       # 商業邏輯測試 (63 tests)
    ├── security.js         # 安全工具函式模組
    └── security.test.js    # 安全漏洞測試 (57 tests)
```

---

## 快速開始

### 1. 使用應用程式

直接在瀏覽器開啟 `index.html`，填入 Google Sheet ID 即可使用。

### 2. 執行測試

```bash
# 安裝依賴
npm install

# 執行全部 120 個測試
npm test
```

---

## 測試涵蓋範圍

| 測試類別 | 數量 | 涵蓋內容 |
|----------|------|----------|
| **商業邏輯** | 63 | getColLetter、cleanGroupName、cleanAuthorName、getUserId、formatContent、getColor、deduplicateAndSortDates、parseGlobalSettings、isValidSettingsData、buildMergedProjectRules、parseSheetDate |
| **安全防護** | 57 | XSS 注入偵測、URL 消毒、Prototype Pollution、Schema 驗證、靜態 HTML 掃描 |
| **合計** | **120** | ✅ 全部通過 |

---

## Google Sheet 欄位對應

| 欄位索引 (預設) | 欄位名稱 | 說明 |
|----------------|----------|------|
| 0 | 日期 | 日報日期 |
| 2 | 姓名 | 填報人員 |
| 3 | 專案 | 專案名稱 |
| 4 | 議題 ID | Redmine / Issue ID |
| 5 | 工作內容 | 當日工作描述 |
| 6 | 工時 | 小時數 |
| 7 | 連結 | 相關連結 |
| 8 | 組別 | 所屬團隊 |

> 欄位索引可在「資料來源」頁籤中自訂調整。

---

## 授權

MIT License
