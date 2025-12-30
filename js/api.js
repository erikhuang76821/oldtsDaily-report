/**
 * Google Sheets API 模塊
 * 負責從 Google Sheets 獲取數據並處理
 */

import { getActiveTab, getCurrentDailyData, setCurrentDailyData, getCurrentReportDate } from './state.js';
import { showToast, cleanGroupName } from './utils.js';
import { getDB, saveDB, saveCurrentReport, updateHistoryList } from './storage.js';

// ==================== API 觸發 ====================

/**
 * 處理標題列的更新按鈕動作
 * 觸發 Google Sheet 資料獲取
 */
export function handleHeaderAction() {
    fetchGoogleSheetData();
}

// ==================== Google Sheets 資料獲取 ====================

/**
 * 從 Google Sheets 獲取資料
 * 支援手動單日模式和自動批次刷新模式
 *
 * @param {string|null} autoRefreshRange - 自動刷新範圍 ('3', '7', '30', 'ALL', null=手動模式)
 * @param {Function} switchTab - 切換分頁的函數
 * @param {Function} renderData - 渲染數據的函數
 * @param {Function} updateRawPreview - 更新原始預覽的函數
 * @returns {Promise<void>}
 */
export async function fetchGoogleSheetData(autoRefreshRange = null, switchTab = null, renderData = null, updateRawPreview = null) {
    const sheetIdEl = document.getElementById('gsheetId');
    const sheetId = sheetIdEl ? sheetIdEl.value.trim() : '';

    // In manual mode (autoRefreshRange is null), we use the picker.
    // In auto mode, we might process multiple dates.
    const pickerDateEl = document.getElementById('reportDatePicker');
    const pickerDate = pickerDateEl ? pickerDateEl.value : '';

    const btn = document.getElementById('btnFetchGSheet');
    const statusMsg = document.getElementById('gsheetStatusMsg');

    if (statusMsg) {
        statusMsg.className = 'text-sm font-medium';
        statusMsg.innerHTML = '';
    }

    if (!sheetId) {
        if (switchTab) switchTab('SOURCE');
        showToast('請先設定 Google Sheet ID');
        return;
    }
    if (!autoRefreshRange && !pickerDate) {
        showToast('請選擇日期');
        return;
    }

    // --- Capture Config ---
    const cols = {
        date: parseInt(document.getElementById('colDate')?.value) || 0,
        group: parseInt(document.getElementById('colGroup')?.value) || 1,
        name: parseInt(document.getElementById('colName')?.value) || 2,
        proj: parseInt(document.getElementById('colProj')?.value) || 3,
        id: parseInt(document.getElementById('colId')?.value) || 4,
        content: parseInt(document.getElementById('colContent')?.value) || 5,
        hours: parseInt(document.getElementById('colHours')?.value) || 6,
        link: parseInt(document.getElementById('colLink')?.value) || 7
    };

    // --- UI Busy State (Only for Manual) ---
    if (!autoRefreshRange) {
        const headerBtn = document.querySelector('[onclick="handleHeaderAction()"]');
        if (headerBtn) {
            headerBtn.disabled = true;
            headerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span class="hidden md:inline">更新中</span>';
        }
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> 讀取中...';
        }
    }

    const updateStatus = (msg, type) => {
        if (!statusMsg) return;
        statusMsg.className = type === 'error' ? 'text-rose-600 text-sm font-bold' : 'text-emerald-600 text-sm font-bold';
        statusMsg.innerHTML = msg;
    };

    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const strategies = [
        { url: gvizUrl, name: 'Direct' },
        { url: `https://corsproxy.io/?${encodeURIComponent(gvizUrl)}`, name: 'CorsProxy' },
        { url: `https://api.allorigins.win/get?url=${encodeURIComponent(gvizUrl)}`, name: 'AllOrigins', wrapper: true }
    ];

    let successJson = null;

    for (const strat of strategies) {
        try {
            const res = await fetch(strat.url);
            if (!res.ok) throw new Error('Network Error');
            let text = await res.text();

            if (strat.wrapper) {
                const data = JSON.parse(text);
                text = data.contents;
            }

            const start = text.indexOf('{');
            const end = text.lastIndexOf('}') + 1;
            if (start > -1 && end > -1) {
                successJson = JSON.parse(text.substring(start, end));
                break;
            }
        } catch(e) {
            console.warn(`GSheet Strat ${strat.name} failed`, e);
        }
    }

    // Reset UI (Manual)
    if (!autoRefreshRange) {
        const headerBtn = document.querySelector('[onclick="handleHeaderAction()"]');
        if (headerBtn) {
            headerBtn.disabled = false;
            headerBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> <span class="hidden md:inline">更新</span>';
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> 讀取資料';
        }
    }

    if (!successJson || !successJson.table) {
        updateStatus('讀取失敗：無法存取試算表。請確認 ID 正確且權限已設為「知道連結者皆可檢視」。', 'error');
        return;
    }

    const rows = successJson.table.rows;

    // --- Helper: Parse Row ---
    const parseRow = (row) => {
        const c = row.c;
        if (!c) return null;
        const getVal = (i) => (c[i] ? (c[i].f || c[i].v) : '');

        const name = String(getVal(cols.name)).trim();
        if (!name) return null;

        const rawGroupName = String(getVal(cols.group)).trim();

        // Store raw group name here, cleaning is done in renderData for flexibility
        const groupName = rawGroupName;

        let proj = String(getVal(cols.proj)).trim().replace(/【.*?】/g, '').trim();
        let idVal = String(getVal(cols.id)).trim();
        let content = String(getVal(cols.content)).trim();
        let link = String(getVal(cols.link)).trim();
        const hrsVal = getVal(cols.hours);
        const hours = parseFloat(hrsVal) || 0;

        return {
            name, group: groupName, project: proj, issue: idVal, content, hours, link
        };
    };

    // --- MODE SELECTION ---
    if (autoRefreshRange) {
        // === AUTO BATCH MODE ===
        const db = getDB();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let cutoffTime = 0;
        // Calculate cutoff
        if (autoRefreshRange === '3') cutoffTime = today.getTime() - (2 * 86400000);
        else if (autoRefreshRange === '7') cutoffTime = today.getTime() - (6 * 86400000);
        else if (autoRefreshRange === '30') cutoffTime = today.getTime() - (29 * 86400000);
        else if (autoRefreshRange === 'ALL') cutoffTime = 0;

        const batchData = {}; // { "YYYY-MM-DD": [rows...] }

        rows.forEach(row => {
            const c = row.c;
            if (!c) return;
            const getVal = (i) => (c[i] ? (c[i].f || c[i].v) : '');
            const rowDateStr = getVal(cols.date);
            if (!rowDateStr) return;

            // Normalize Date Key
            let keyDate = String(rowDateStr).trim();
            // Try parsing to ensure format YYYY-MM-DD standard, fallback to string if fails
            // This handles diverse formats like "2023/1/1" -> "2023-01-01"
            const dObj = new Date(String(rowDateStr).replace(/\//g, '-'));

            if (isNaN(dObj.getTime())) {
                // If not parseable, we can skip or use raw string if strict.
                // We will skip if we can't determine time for cutoff logic.
                return;
            }

            // Check Cutoff
            if (autoRefreshRange !== 'ALL' && dObj.getTime() < cutoffTime) return;

            // Format key
            keyDate = dObj.toISOString().split('T')[0];

            const parsed = parseRow(row);
            if (parsed) {
                if (!batchData[keyDate]) batchData[keyDate] = [];
                batchData[keyDate].push(parsed);
            }
        });

        // Update DB for affected dates
        let updateCount = 0;
        Object.keys(batchData).forEach(k => {
            db[k] = {
                config: { sheetId, cols },
                rows: batchData[k]
            };
            updateCount++;
        });

        saveDB(db);

        // Refresh UI if current date was affected, or just stay put
        const currentReportDate = getCurrentReportDate();
        if (currentReportDate && db[currentReportDate]) {
            // 需要從外部傳入 loadReportByDate
            if (window.loadReportByDate) {
                window.loadReportByDate(currentReportDate);
            }
        } else {
            // Update list only
            updateHistoryList();
        }

        updateStatus(`自動刷新完成 (範圍: ${autoRefreshRange === 'ALL' ? '全部' : '近'+autoRefreshRange+'天'}, 更新 ${updateCount} 天)`, 'success');

    } else {
        // === MANUAL SINGLE DATE MODE ===
        const fetchedData = [];
        rows.forEach(row => {
            const c = row.c;
            if (!c) return;
            const getVal = (i) => (c[i] ? (c[i].f || c[i].v) : '');
            let rowDate = getVal(cols.date);
            // Standard loose check
            if (!rowDate || !String(rowDate).includes(pickerDate)) return;

            const parsed = parseRow(row);
            if (parsed) fetchedData.push(parsed);
        });

        const currentDailyData = getCurrentDailyData();
        currentDailyData.config = { sheetId, cols }; // Save config
        currentDailyData.rows = fetchedData;
        setCurrentDailyData(currentDailyData);

        updateStatus(`成功：已讀取 ${currentDailyData.rows.length} 筆資料`, 'success');
        saveCurrentReport();

        if (updateRawPreview) updateRawPreview();
        showToast('資料已更新並儲存');

        const activeTab = getActiveTab();
        if (activeTab !== 'OVERVIEW') {
            if (switchTab) switchTab('OVERVIEW');
        } else {
            if (renderData) renderData();
        }
    }
}
