/**
 * 工具函數模塊
 * 提供各種通用的輔助函數
 */

import { getGlobalSettings } from './state.js';

// ==================== Toast 通知 ====================
/**
 * 顯示 Toast 提示訊息
 * @param {string} msg - 訊息內容
 */
export function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

// ==================== 滾動相關 ====================
/**
 * 監控滾動位置並控制導航箭頭顯示
 */
export function handleScroll() {
    const scrollContainer = document.getElementById('scrollContainer');
    const upBtn = document.getElementById('backToResultBtn');
    const downBtn = document.getElementById('goToAnalysisBtn');

    if (!scrollContainer) return;

    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;

    // Logic for UP Arrow
    if (scrollTop > 400) {
        upBtn.classList.remove('opacity-0', 'translate-y-5');
        upBtn.classList.add('opacity-100', 'translate-y-0');
    } else {
        upBtn.classList.remove('opacity-100', 'translate-y-0');
        upBtn.classList.add('opacity-0', 'translate-y-5');
    }

    // Logic for DOWN Arrow
    const isNearBottom = (scrollHeight - scrollTop - clientHeight) < 200;

    if (scrollHeight > clientHeight + 100 && !isNearBottom) {
        downBtn.classList.remove('opacity-0', 'translate-y-5', 'hidden');
        downBtn.classList.add('opacity-100', 'translate-y-0');
    } else {
        downBtn.classList.remove('opacity-100', 'translate-y-0');
        downBtn.classList.add('opacity-0', 'translate-y-5');
    }
}

/**
 * 滾動至結果區塊
 */
export function scrollToResult() {
    const anchor = document.getElementById('resultAnchor');
    if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 滾動至分析區塊
 */
export function scrollToAnalysis() {
    const anchor = document.getElementById('analysisAnchor');
    if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 生成用戶卡片的安全 DOM ID
 * @param {string} name - 用戶名稱
 * @returns {string} 安全的 DOM ID
 */
export function getUserId(name) {
    return 'user_card_' + name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
}

/**
 * 滾動至特定用戶卡片並高亮
 * @param {string} name - 用戶名稱
 */
export function scrollToUser(name) {
    const id = getUserId(name);
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-card');
        setTimeout(() => el.classList.remove('highlight-card'), 2000);
    }
}

// ==================== 資料清理 ====================
/**
 * 清理並統一組別名稱（應用合併規則）
 * @param {string} group - 原始組別名稱
 * @returns {string} 統一後的組別名稱
 */
export function cleanGroupName(group) {
    if (!group) return '其他';
    group = group.trim();

    const globalSettings = getGlobalSettings();

    // 遍歷用戶自定義規則
    if (globalSettings.groupMerges) {
        for (const rule of globalSettings.groupMerges) {
            if (rule.originals.includes(group)) {
                return rule.alias;
            }
        }
    }

    return group;
}

/**
 * 清理作者名稱（只保留後5個字元）
 * @param {string} name - 原始姓名
 * @returns {string} 清理後的姓名
 */
export function cleanAuthorName(name) {
    if (!name) return 'Unknown';
    return name.slice(-5);
}

// ==================== 文字格式化 ====================
/**
 * 格式化內容文字（高亮關鍵字）
 * @param {string} text - 原始文字
 * @returns {string} HTML 格式化後的文字
 */
export function formatContent(text) {
    if (!text) return '(無內容)';
    // 簡單的關鍵字高亮
    return text.replace(/(測試內容|工作事項|問題回報)/g, '<span class="font-bold text-slate-800">$1</span>');
}

// ==================== 日期操作 ====================
/**
 * 計算前一天的日期
 * @param {string} currentDate - 當前日期 (YYYY-MM-DD)
 * @returns {string} 前一天日期 (YYYY-MM-DD)
 */
export function getPreviousDay(currentDate) {
    const dateObj = new Date(currentDate + 'T00:00:00');
    dateObj.setDate(dateObj.getDate() - 1);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 計算後一天的日期
 * @param {string} currentDate - 當前日期 (YYYY-MM-DD)
 * @returns {string} 後一天日期 (YYYY-MM-DD)
 */
export function getNextDay(currentDate) {
    const dateObj = new Date(currentDate + 'T00:00:00');
    dateObj.setDate(dateObj.getDate() + 1);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 取得今天的日期
 * @returns {string} 今天日期 (YYYY-MM-DD)
 */
export function getToday() {
    return new Date().toISOString().split('T')[0];
}
