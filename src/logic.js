// src/logic.js
// 從 index.html 抽離的純商業邏輯，供 unit test 使用

// --- Constants ---
export const CHART_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6',
    '#f43f5e', '#a855f7', '#0ea5e9', '#22c55e', '#eab308',
];

export const DEFAULT_GROUP_MERGES = [
    { alias: '品檢', originals: ['品檢組', '品檢', '品檢_早班', '品檢_中班', '品檢_緯創'] },
    { alias: '技術', originals: ['技術', '技術組'] },
    {
        alias: '網頁系統',
        originals: [
            '網頁系統_前端',
            '網頁系統_後端',
            '網頁系統',
            '網頁系統_實習生',
            '網頁系統_外包',
            '網頁系統_緯創',
        ],
    },
    { alias: '資料庫', originals: ['資料庫組', '資料庫', '資料庫_智能行銷'] },
    { alias: '資源整合應用', originals: ['資源整合應用_自動化', '資源整合應用_企劃'] },
    { alias: '客服', originals: ['客服組', '【客服組】', '客服_VIP', '客服_值班者'] },
];

// --- Helper ---
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#96;',
    '/': '&#x2F;',
};

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"'`/]/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

// --- Pure Functions ---

/**
 * 欄位索引轉換為 Google Sheet 欄位字母
 * 0 → A, 1 → B, 25 → Z, 26 → AA
 */
export function getColLetter(index) {
    let letter = '';
    while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
}

/**
 * 依 groupMerges 規則將原始組別名稱對應到 alias
 * 若無對應，回傳原名; 若 null/undefined，回傳 '其他'
 */
export function cleanGroupName(group, groupMerges = []) {
    if (!group) return '其他';
    group = group.trim();
    for (const rule of groupMerges) {
        if (rule.originals.includes(group)) {
            return rule.alias;
        }
    }
    return group;
}

/**
 * 作者名稱處理：截取最後 5 字元，移除開頭英文字母
 */
export function cleanAuthorName(name) {
    if (!name) return 'Unknown';
    let shortName = name.slice(-5);
    return shortName.replace(/^[a-zA-Z]+/, '');
}

/**
 * 使用者 ID 生成（用於 DOM element id）
 * 特殊字元替換為底線，保留中文和英數
 */
export function getUserId(name) {
    return 'user_card_' + name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
}

/**
 * 內容文字格式化：先 escape HTML 特殊字元，再為特定關鍵字加 bold span
 * 注意：需先 escape 以防止 XSS，再插入安全的 HTML span
 */
export function formatContent(text) {
    if (!text) return '(無內容)';
    const safe = escapeHtml(text);
    return safe.replace(
        /(測試內容|工作事項|問題回報)/g,
        '<span class="font-bold text-slate-800">$1</span>',
    );
}

/**
 * 循環取色
 */
export function getColor(index) {
    return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * 將日期陣列去重並降序排序
 */
export function deduplicateAndSortDates(datesArray) {
    return Array.from(new Set(datesArray)).sort().reverse();
}

// --- Stateful Logic (extracted as pure for testing) ---

/**
 * 載入全域設定，若 localStorage 無資料則回傳預設值
 * @param {string|null} storedJson - localStorage 中的 JSON 字串
 * @returns {object} globalSettings
 */
export function parseGlobalSettings(storedJson) {
    if (storedJson) {
        const parsed = JSON.parse(storedJson);
        if (!parsed.projectMerges) parsed.projectMerges = [];
        if (!parsed.groupMerges)
            parsed.groupMerges = JSON.parse(JSON.stringify(DEFAULT_GROUP_MERGES));
        return parsed;
    }
    return {
        projectMerges: [],
        groupMerges: JSON.parse(JSON.stringify(DEFAULT_GROUP_MERGES)),
    };
}

/**
 * 驗證匯入的設定 JSON 是否有效
 * @param {object} data - 解析後的 JSON 物件
 * @returns {boolean}
 */
export function isValidSettingsData(data) {
    return !!(data && (data.projectMerges || data.groupMerges));
}

/**
 * 合併專案規則：收集 originals，處理已存在規則的合併
 * @param {string[]} selectedNames - 使用者勾選的專案名稱
 * @param {string} newAlias - 合併後的名稱
 * @param {Array} existingMerges - 現有的 projectMerges 陣列 (會被 mutate)
 * @returns {Array} 更新後的 projectMerges
 */
export function buildMergedProjectRules(selectedNames, newAlias, existingMerges) {
    const merges = [...existingMerges.map((r) => ({ ...r, originals: [...r.originals] }))];
    let actualOriginals = [];

    selectedNames.forEach((name) => {
        const existingRuleIndex = merges.findIndex((r) => r.alias === name);
        if (existingRuleIndex > -1) {
            actualOriginals.push(...merges[existingRuleIndex].originals);
            merges.splice(existingRuleIndex, 1);
        } else {
            actualOriginals.push(name);
        }
    });

    merges.push({
        alias: newAlias,
        originals: actualOriginals,
    });

    return merges;
}

/**
 * 解析 Google Sheet 的日期值，回傳 ISO 字串 (YYYY-MM-DD) 或 null
 * 支援 Date(YYYY,MM,DD) 格式和一般日期字串
 */
export function parseSheetDate(rawDateStr) {
    if (!rawDateStr) return null;
    const keyDateStr = String(rawDateStr).trim();

    let dObj;
    const gsDateMatch = keyDateStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
    if (gsDateMatch) {
        dObj = new Date(
            parseInt(gsDateMatch[1]),
            parseInt(gsDateMatch[2]),
            parseInt(gsDateMatch[3]),
        );
    } else {
        dObj = new Date(keyDateStr.replace(/-/g, '/'));
    }

    if (isNaN(dObj.getTime())) return null;

    const year = dObj.getFullYear();
    const month = String(dObj.getMonth() + 1).padStart(2, '0');
    const day = String(dObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
