/**
 * 主應用程式入口模塊
 * 負責初始化應用程式、整合所有模塊、設置全局事件監聽器
 */

// ==================== 導入所有模塊 ====================
import { getCurrentReportDate, setCurrentReportDate } from './state.js';
import { loadGlobalSettings, loadReportByDate, updateHistoryList, saveCurrentReport, clearAllData, exportData, importData } from './storage.js';
import { handleHeaderAction, fetchGoogleSheetData } from './api.js';
import { toggleAutoRefreshPanel, confirmAutoRefresh } from './autoRefresh.js';
import { setAnalysisMode, filterByGroup, clearTrendFilter, resetPersonSelection, resetProjectSelection } from './filters.js';
import { renderTrendAnalysis } from './charts.js';
import { switchTab, toggleSidebar, renderData, updateRawPreview, toggleTask, toggleAllTasks, renderSettingsTab } from './ui.js';
import {
    handleMergeButtonClick, cancelMergeMode, openMergeDialog, closeMergeDialog, confirmMerge,
    toggleAllProjectCheckboxes, addGroupRule, deleteGroupRule, openEditGroupRule,
    closeEditGroupDialog, saveEditedGroupRule, deleteProjectRule, openEditProjectRule,
    closeEditDialog, saveEditedProjectRule, executeDeleteRule, closeConfirmDialog
} from './rules.js';
import { handleScroll, scrollToResult, scrollToAnalysis, scrollToUser, showToast, getPreviousDay, getNextDay } from './utils.js';

// ==================== 全局函數橋接 ====================
// 將函數掛載到 window 對象，供 HTML onclick 調用
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.filterByGroup = filterByGroup;
window.scrollToAnalysis = scrollToAnalysis;
window.scrollToUser = scrollToUser;
window.handleHeaderAction = handleHeaderAction;
window.toggleAutoRefreshPanel = toggleAutoRefreshPanel;
window.confirmAutoRefresh = confirmAutoRefresh;
window.setAnalysisMode = setAnalysisMode;
window.clearTrendFilter = clearTrendFilter;
window.resetPersonSelection = resetPersonSelection;
window.resetProjectSelection = resetProjectSelection;
window.toggleTask = toggleTask;
window.toggleAllTasks = toggleAllTasks;
window.handleMergeButtonClick = handleMergeButtonClick;
window.cancelMergeMode = cancelMergeMode;
window.openMergeDialog = openMergeDialog;
window.closeMergeDialog = closeMergeDialog;
window.confirmMerge = confirmMerge;
window.toggleAllProjectCheckboxes = toggleAllProjectCheckboxes;
window.addGroupRule = addGroupRule;
window.deleteGroupRule = deleteGroupRule;
window.openEditGroupRule = openEditGroupRule;
window.closeEditGroupDialog = closeEditGroupDialog;
window.saveEditedGroupRule = saveEditedGroupRule;
window.deleteProjectRule = deleteProjectRule;
window.openEditProjectRule = openEditProjectRule;
window.closeEditDialog = closeEditDialog;
window.saveEditedProjectRule = saveEditedProjectRule;
window.executeDeleteRule = executeDeleteRule;
window.closeConfirmDialog = closeConfirmDialog;
window.scrollToResult = scrollToResult;
window.saveCurrentReport = saveCurrentReport;
window.clearAllData = () => clearAllData(loadReportByDate);
window.exportData = exportData;
window.importData = (input) => importData(input, loadReportByDate);

// 導出 renderData 和相關函數供其他模塊使用
window.renderData = renderData;
window.updateRawPreview = updateRawPreview;
window.renderSettingsTab = renderSettingsTab;
window.renderTrendAnalysis = renderTrendAnalysis;
window.fetchGoogleSheetData = (autoRefreshRange) => {
    fetchGoogleSheetData(autoRefreshRange, switchTab, renderData, updateRawPreview);
};

// 日期切換函數
window.switchToPreviousDay = function() {
    const currentDate = getCurrentReportDate();
    const prevDay = getPreviousDay(currentDate);
    loadReportByDate(prevDay, switchTab);
    showToast(`已切換至前日 (${prevDay})`);
};

window.switchToNextDay = function() {
    const currentDate = getCurrentReportDate();
    const nextDay = getNextDay(currentDate);
    loadReportByDate(nextDay, switchTab);
    showToast(`已切換至後日 (${nextDay})`);
};

window.handleDateChange = function() {
    const newDate = document.getElementById('reportDatePicker')?.value;
    if (newDate) {
        loadReportByDate(newDate, switchTab);
    }
};

window.loadReportByDate = (date) => loadReportByDate(date, switchTab);

// ==================== 應用程式初始化 ====================
/**
 * 初始化應用程式
 */
function initApp() {
    console.log('🚀 日報管理系統正在啟動...');

    // 1. 載入全域設定
    loadGlobalSettings(renderSettingsTab);

    // 2. 取得今天的日期
    const today = new Date().toISOString().split('T')[0];

    // 3. 更新歷史列表
    updateHistoryList(getCurrentReportDate);

    // 4. 載入今天的報告
    loadReportByDate(today, switchTab);

    // 5. 設置滾動監聽器
    const scrollContainer = document.getElementById('scrollContainer');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
        handleScroll(); // 初始化按鈕狀態
    }

    // 6. 初始化分析模式 UI
    setAnalysisMode('PROJECT');

    console.log('✅ 日報管理系統啟動完成！');
}

// ==================== DOM 載入完成後執行 ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // 如果 DOM 已經載入完成，直接執行
    initApp();
}

// ==================== 開發者工具 (可選) ====================
if (process.env.NODE_ENV === 'development') {
    window.__DEBUG__ = {
        getCurrentReportDate,
        setCurrentReportDate,
        loadGlobalSettings,
        renderData,
        updateRawPreview
    };
    console.log('🔧 開發者模式已啟用');
}
