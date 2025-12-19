團隊日報管理系統 (Google Sheet 直讀版)

這是一個輕量級、純前端的單頁應用程式 (SPA)，專為團隊設計，用於將 Google Sheets 上的流水帳日報資料，轉換為視覺化的儀表板、工時統計與專案分析圖表。

無需架設後端伺服器，直接在瀏覽器中運行，透過 Google Visualization API 讀取公開的試算表資料。

🚀 主要功能

1. 儀表板 (Overview)

視覺化統計:

人員工時圖: 自動計算每人當日總工時，並依時數顯示不同顏色警示 (不足 8hr 黃色 / 超過 10hr 紅色)。

專案佔比圖: 動態圓餅圖展示各專案投入的時間比例。

詳細清單:

依人員分組展示工作項目。

支援摺疊/展開詳細內容。

關鍵字高亮: 自動標記「測試內容」、「工作事項」等關鍵字。

外部連結: 支援顯示議題連結按鈕 (如 Jira/Redmine)。

篩選功能: 可依據組別 (如：網頁、技術、品檢...) 快速篩選顯示人員。

2. 資料來源設定 (Data Source)

彈性欄位對應: 可自定義 Google Sheet 中各欄位 (日期、姓名、專案、內容、工時、連結等) 的索引位置 (Index)，適應不同格式的試算表。

即時預覽: 提供讀取後的原始 JSON 資料預覽，方便除錯。

3. 控制台與合併規則 (Settings)

專案合併: 可在前端將多個細碎的專案名稱 (例如: "App維護", "App新功能") 設定合併為單一項目 (例如: "App專案") 進行圓餅圖統計，不影響原始資料。

組別別名: 設定原始資料中的組別名稱如何對應到系統的顯示分類。

4. 歷史紀錄與備份

本地暫存: 瀏覽過的日期資料會自動儲存於瀏覽器 LocalStorage，下次查看無需重新讀取。

資料備份: 支援將所有歷史資料匯出為 JSON 檔案，或從 JSON 還原。

日期導航: 支援快速切換前一日/後一日。

🛠️ 技術架構

本專案採用純 HTML/JS/CSS 開發，無任何建置流程 (No Build Step)，直接開啟 index.html 即可使用。

核心語言: HTML5, JavaScript (ES6+)

樣式框架: Tailwind CSS (透過 CDN 引入)

圖表套件: Chart.js (透過 CDN 引入)

圖示套件: Font Awesome

資料串接: Google Sheets Visualization API (gviz/tq)

支援直接讀取或透過 CORS Proxy (corsproxy.io, allorigins.win) 讀取。

📖 使用說明

1. 準備 Google Sheet

建立一個 Google Sheet，並建議包含以下欄位 (順序可自訂)：

日期 (Date)

組別 (Group)

姓名 (Name)

專案名稱 (Project)

議題編號 (Issue ID)

工作內容 (Content)

工時 (Hours)

連結 (Link) - 選填

重要: 請將該 Google Sheet 的共用權限設定為 「知道連結者皆可檢視」 (Anyone with the link can view)。

2. 啟動系統

下載或 Clone 本專案。

雙擊 index.html 在瀏覽器中開啟。

3. 設定連結

點擊上方的 「資料來源」 (Source) 頁籤。

在 Google Sheet ID 欄位輸入試算表 ID (位於網址 .../d/ 與 /edit 之間的字串)。

在下方 欄位對應區塊，輸入各欄位在 Excel 中的索引值 (A欄=0, B欄=1, C欄=2... 以此類推)。

選擇上方日期，點擊 「讀取資料」。

📂 檔案結構

.
└── index.html  # 包含所有邏輯、樣式與結構的單一檔案


⚠️ 注意事項

本系統僅供讀取 (Read-only)，不會修改您的 Google Sheet 內容。

資料儲存於個別瀏覽器的 LocalStorage 中，清除瀏覽器快取會遺失歷史紀錄 (建議定期使用匯出功能備份)。



##  time auto refresh ver
資料來源設定介面：新增了「自動刷新間隔 (分鐘)」的設定欄位。

核心邏輯：

在 globalSettings 中新增 autoRefreshInterval 參數。

新增 setupAutoRefresh() 函式來管理計時器。

修改 fetchAllData()，在點擊「儲存設定並同步資料」時，會一併儲存刷新時間設定並重啟計時器。

在 switchTab('SOURCE') 時，會自動讀取目前的設定值填入輸入框。

現在，只要在該欄位輸入大於 0 的數字並點擊同步按鈕，系統就會依據設定的時間間隔自動抓取最新資料。
 
