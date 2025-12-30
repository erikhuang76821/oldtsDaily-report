/**
 * 資料存儲模塊
 * 負責處理 localStorage 的數據存取、備份、還原等功能
 */

import { DB_KEY, SETTINGS_KEY, DEFAULT_GROUP_MERGES } from './config.js';
import {
    getCurrentDailyData,
    setCurrentDailyData,
    getGlobalSettings,
    setGlobalSettings,
    getCurrentReportDate,
    setCurrentReportDate
} from './state.js';
import { showToast } from './utils.js';

// ==================== 資料庫基礎操作 ====================

/**
 * 從 localStorage 讀取所有報告資料
 * @returns {Object} 資料庫物件，格式為 { "YYYY-MM-DD": { config, rows } }
 */
export function getDB() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : {};
}

/**
 * 儲存資料到 localStorage 並更新歷史列表
 * @param {Object} data - 要儲存的資料庫物件
 */
export function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    updateHistoryList();
}

// ==================== 全域設定管理 ====================

/**
 * 從 localStorage 載入全域設定
 * 如果不存在則初始化為預設值
 */
export function loadGlobalSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    const globalSettings = getGlobalSettings();

    if (stored) {
        const parsedSettings = JSON.parse(stored);
        if (!parsedSettings.projectMerges) parsedSettings.projectMerges = [];
        if (!parsedSettings.groupMerges) {
            parsedSettings.groupMerges = JSON.parse(JSON.stringify(DEFAULT_GROUP_MERGES));
        }
        setGlobalSettings(parsedSettings);
    } else {
        // Initialize with defaults
        globalSettings.groupMerges = JSON.parse(JSON.stringify(DEFAULT_GROUP_MERGES));
        setGlobalSettings(globalSettings);
        saveGlobalSettings();
    }
}

/**
 * 儲存全域設定到 localStorage
 * 注意：需要從外部模塊調用 renderSettingsTab() 來更新 UI
 */
export function saveGlobalSettings() {
    const globalSettings = getGlobalSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(globalSettings));
    // renderSettingsTab() 需要由調用者處理，因為它屬於 UI 模塊
}

// ==================== 報告管理 ====================

/**
 * 載入指定日期的報告資料
 * @param {string} date - ISO 格式日期 (YYYY-MM-DD)
 * @param {Function} [switchTab] - 可選的切換分頁函數
 */
export function loadReportByDate(date, switchTab = null) {
    setCurrentReportDate(date);
    const datePickerEl = document.getElementById('reportDatePicker');
    if (datePickerEl) {
        datePickerEl.value = date;
    }
    updateHistoryList();

    const db = getDB();
    let data = db[date];
    const currentDailyData = getCurrentDailyData();

    if (!data) {
        currentDailyData.rows = [];
        setCurrentDailyData(currentDailyData);
    } else {
        if (data.rows) {
            setCurrentDailyData(data);
        } else {
            currentDailyData.rows = [];
            setCurrentDailyData(currentDailyData);
        }
    }

    // Auto switch to overview if data exists, else source
    if (switchTab) {
        if (getCurrentDailyData().rows.length > 0) {
            switchTab('OVERVIEW');
        } else {
            switchTab('SOURCE');
        }
    }
}

/**
 * 儲存當前報告到資料庫
 * @returns {boolean} 儲存是否成功
 */
export function saveCurrentReport() {
    const datePickerEl = document.getElementById('reportDatePicker');
    const date = datePickerEl ? datePickerEl.value : '';

    if (!date) {
        showToast('請選擇日期');
        return false;
    }

    const db = getDB();
    const currentDailyData = getCurrentDailyData();
    db[date] = currentDailyData;
    saveDB(db);
    showToast('資料已儲存');
    return true;
}

/**
 * 更新歷史報告列表 UI
 */
export function updateHistoryList() {
    const db = getDB();
    const dates = Object.keys(db).sort().reverse();
    const listEl = document.getElementById('historyList');

    if (!listEl) return;

    listEl.innerHTML = '';
    if (dates.length === 0) {
        listEl.innerHTML = '<div class="text-xs text-slate-400 p-2 text-center">尚無紀錄</div>';
        return;
    }

    const currentReportDate = getCurrentReportDate();
    dates.forEach(date => {
        const item = document.createElement('div');
        item.className = `p-2 rounded cursor-pointer text-sm flex justify-between items-center hover:bg-slate-50 transition ${date === currentReportDate ? 'active-date' : 'text-slate-600'}`;
        item.onclick = () => {
            // 這裡需要從外部傳入 loadReportByDate 和 switchTab 的引用
            // 或者透過事件系統處理
            if (window.loadReportByDate) {
                window.loadReportByDate(date);
            }
        };
        item.innerHTML = `<span><i class="fa-regular fa-calendar mr-2 opacity-50"></i>${date}</span>`;
        listEl.appendChild(item);
    });
}

// ==================== 資料管理 ====================

/**
 * 清空所有歷史紀錄
 * @param {Function} [loadReportByDate] - 可選的載入報告函數
 */
export function clearAllData(loadReportByDate = null) {
    if (window.confirm('警告：確定要清空所有歷史紀錄嗎？')) {
        localStorage.removeItem(DB_KEY);
        const today = new Date().toISOString().split('T')[0];
        if (loadReportByDate) {
            loadReportByDate(today);
        }
        showToast('所有資料已清空');
    }
}

/**
 * 匯出資料為 JSON 檔案
 */
export function exportData() {
    const db = getDB();
    if (Object.keys(db).length === 0) {
        showToast('無資料可備份');
        return;
    }

    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_report_v6_public_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * 從檔案匯入資料並還原
 * @param {HTMLInputElement} input - 檔案輸入元素
 * @param {Function} [loadReportByDate] - 可選的載入報告函數
 */
export function importData(input, loadReportByDate = null) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            saveDB(data);
            if (loadReportByDate) {
                const currentReportDate = getCurrentReportDate();
                loadReportByDate(currentReportDate);
            }
            showToast('資料還原成功');
        } catch (error) {
            showToast('檔案格式錯誤');
        }
        input.value = '';
    };
    reader.readAsText(file);
}
