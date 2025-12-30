/**
 * 配置與常量模塊
 * 集中管理所有全域常量和配置項
 */

// ==================== 存儲配置 ====================
export const DB_KEY = 'daily_reports_db_v6_gs_clean';
export const SETTINGS_KEY = 'daily_reports_settings_v1';

// ==================== 預設組別合併規則 ====================
export const DEFAULT_GROUP_MERGES = [
    { alias: '品檢', originals: ['品檢組', '品檢'] },
    { alias: '技術', originals: ['技術', '技術組'] },
    { alias: '網頁', originals: ['網頁組', '網頁'] },
    { alias: '資料庫', originals: ['資料庫組', '資料庫'] },
    { alias: '客服', originals: ['客服組', '【客服組】'] }
];

// ==================== 圖表色彩調色盤 ====================
export const CHART_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6',
    '#f43f5e', '#a855f7', '#0ea5e9', '#22c55e', '#eab308'
];

/**
 * 根據索引取得圖表顏色（循環使用）
 * @param {number} index - 顏色索引
 * @returns {string} HEX 顏色碼
 */
export function getColor(index) {
    return CHART_COLORS[index % CHART_COLORS.length];
}

// ==================== 預設數據模型 ====================
export const DEFAULT_DAILY_DATA = {
    config: {
        sheetId: '168G3AtI3lIdgIv6q75Fz9BtM_u11yC1G-cz1NTJApbo',
        cols: {
            date: 0,
            group: 1,
            name: 2,
            proj: 3,
            id: 4,
            content: 5,
            hours: 6,
            link: 7
        }
    },
    rows: []
};

// ==================== 預設全域設定 ====================
export const DEFAULT_GLOBAL_SETTINGS = {
    projectMerges: [],
    groupMerges: []
};
