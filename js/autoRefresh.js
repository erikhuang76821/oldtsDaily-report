/**
 * 自動刷新功能模塊
 * 負責處理定時自動刷新 Google Sheets 資料
 */

import { getAutoRefreshTimer, setAutoRefreshTimer } from './state.js';
import { showToast } from './utils.js';

// ==================== UI 控制 ====================

/**
 * 切換自動刷新面板的顯示/隱藏
 */
export function toggleAutoRefreshPanel() {
    const chk = document.getElementById('chkAutoRefreshToggle');
    const panel = document.getElementById('autoRefreshConfigPanel');

    if (!chk || !panel) return;

    if (chk.checked) {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
    } else {
        panel.classList.add('hidden');
        panel.classList.remove('flex');
        stopAutoRefresh(); // Uncheck implies stop
    }
}

/**
 * 確認並啟動自動刷新
 * 從 UI 讀取設定並驗證後啟動
 */
export function confirmAutoRefresh() {
    const minsEl = document.getElementById('inpAutoRefreshMinutes');
    const rangeEl = document.getElementById('selAutoRefreshRange');

    if (!minsEl || !rangeEl) return;

    const mins = parseInt(minsEl.value);
    const range = rangeEl.value;

    if (!mins || mins < 1) {
        showToast('請輸入有效的分鐘數 (至少 1 分鐘)');
        return;
    }

    startAutoRefresh(mins, range);
}

// ==================== 自動刷新控制 ====================

/**
 * 啟動自動刷新功能
 * @param {number} minutes - 刷新間隔（分鐘）
 * @param {string} range - 刷新範圍 ('3', '7', '30', 'ALL')
 */
export function startAutoRefresh(minutes, range) {
    stopAutoRefresh(); // Clear existing

    // Update UI status
    const badge = document.getElementById('badgeAutoRefreshStatus');
    if (badge) {
        badge.className = "text-[10px] font-bold px-2 py-1 rounded border bg-green-100 text-green-600 border-green-200 animate-pulse";
        badge.innerHTML = `<i class="fa-solid fa-circle-play mr-1"></i> 每 ${minutes} 分鐘刷新`;
    }

    let rangeLabel = '全部';
    if (range === '3') rangeLabel = '近3天';
    if (range === '7') rangeLabel = '近7天';
    if (range === '30') rangeLabel = '近1月';

    showToast(`已啟用自動刷新 (每 ${minutes} 分鐘, 範圍: ${rangeLabel})`);

    // Set Interval
    const timer = setInterval(() => {
        // Only fetch if we have an ID
        const sheetIdEl = document.getElementById('gsheetId');
        const id = sheetIdEl ? sheetIdEl.value : '';
        if (id) {
            // 需要從外部訪問 fetchGoogleSheetData
            // 這裡使用 window 對象作為橋接
            if (window.fetchGoogleSheetData) {
                window.fetchGoogleSheetData(range); // Pass range to fetch function
            }
        }
    }, minutes * 60 * 1000);

    setAutoRefreshTimer(timer);
}

/**
 * 停止自動刷新功能
 */
export function stopAutoRefresh() {
    const timer = getAutoRefreshTimer();
    if (timer) {
        clearInterval(timer);
        setAutoRefreshTimer(null);
    }

    const badge = document.getElementById('badgeAutoRefreshStatus');
    if (badge) {
        badge.className = "text-[10px] font-bold px-2 py-1 rounded border bg-slate-100 text-slate-400 border-slate-200";
        badge.innerHTML = `<i class="fa-solid fa-circle-pause mr-1"></i> 未啟用`;
    }
}
