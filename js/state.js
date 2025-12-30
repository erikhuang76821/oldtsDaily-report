/**
 * 全域狀態管理模塊
 * 集中管理應用程式的所有狀態變數
 * 提供 getter/setter 函數確保狀態更新的一致性
 */

import { DEFAULT_DAILY_DATA, DEFAULT_GLOBAL_SETTINGS } from './config.js';

// ==================== 應用程式狀態 ====================
let currentReportDate = '';
let activeTab = 'OVERVIEW';
let activeFilterGroup = 'ALL';

// ==================== 圖表實例 ====================
let projectChartInstance = null;
let trendChartInstance = null;

// ==================== 合併模式狀態 ====================
let isMergeMode = false;
let ruleToDeleteIndex = -1;
let ruleToEditIndex = -1;
let ruleToEditGroupIndex = -1;
let deleteType = '';

// ==================== 自動刷新 ====================
let autoRefreshTimer = null;

// ==================== 分析模式狀態 ====================
let analysisMode = 'PROJECT'; // 'PROJECT', 'PERSON', or 'GROUP'
let activeTrendFilter = null;
let selectedPersons = new Set();
let shouldSelectAllPersons = false;
let selectedProjects = new Set();
let shouldSelectAllProjects = true;
let currentTotalEntitiesCount = 0;

// ==================== 數據模型 ====================
let currentDailyData = JSON.parse(JSON.stringify(DEFAULT_DAILY_DATA));
let globalSettings = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_SETTINGS));

// ==================== Getters ====================
export const getState = () => ({
    currentReportDate,
    activeTab,
    activeFilterGroup,
    projectChartInstance,
    trendChartInstance,
    isMergeMode,
    ruleToDeleteIndex,
    ruleToEditIndex,
    ruleToEditGroupIndex,
    deleteType,
    autoRefreshTimer,
    analysisMode,
    activeTrendFilter,
    selectedPersons,
    shouldSelectAllPersons,
    selectedProjects,
    shouldSelectAllProjects,
    currentTotalEntitiesCount,
    currentDailyData,
    globalSettings
});

// ==================== 日期狀態 ====================
export function getCurrentReportDate() {
    return currentReportDate;
}

export function setCurrentReportDate(date) {
    currentReportDate = date;
}

// ==================== 分頁狀態 ====================
export function getActiveTab() {
    return activeTab;
}

export function setActiveTab(tab) {
    activeTab = tab;
}

// ==================== 篩選狀態 ====================
export function getActiveFilterGroup() {
    return activeFilterGroup;
}

export function setActiveFilterGroup(group) {
    activeFilterGroup = group;
}

// ==================== 圖表實例 ====================
export function getProjectChartInstance() {
    return projectChartInstance;
}

export function setProjectChartInstance(instance) {
    projectChartInstance = instance;
}

export function getTrendChartInstance() {
    return trendChartInstance;
}

export function setTrendChartInstance(instance) {
    trendChartInstance = instance;
}

// ==================== 合併模式 ====================
export function getIsMergeMode() {
    return isMergeMode;
}

export function setIsMergeMode(mode) {
    isMergeMode = mode;
}

export function getRuleToDeleteIndex() {
    return ruleToDeleteIndex;
}

export function setRuleToDeleteIndex(index) {
    ruleToDeleteIndex = index;
}

export function getRuleToEditIndex() {
    return ruleToEditIndex;
}

export function setRuleToEditIndex(index) {
    ruleToEditIndex = index;
}

export function getRuleToEditGroupIndex() {
    return ruleToEditGroupIndex;
}

export function setRuleToEditGroupIndex(index) {
    ruleToEditGroupIndex = index;
}

export function getDeleteType() {
    return deleteType;
}

export function setDeleteType(type) {
    deleteType = type;
}

// ==================== 自動刷新 ====================
export function getAutoRefreshTimer() {
    return autoRefreshTimer;
}

export function setAutoRefreshTimer(timer) {
    autoRefreshTimer = timer;
}

// ==================== 分析模式 ====================
export function getAnalysisMode() {
    return analysisMode;
}

export function setAnalysisMode(mode) {
    analysisMode = mode;
}

export function getActiveTrendFilter() {
    return activeTrendFilter;
}

export function setActiveTrendFilter(filter) {
    activeTrendFilter = filter;
}

export function getSelectedPersons() {
    return selectedPersons;
}

export function getShouldSelectAllPersons() {
    return shouldSelectAllPersons;
}

export function setShouldSelectAllPersons(should) {
    shouldSelectAllPersons = should;
}

export function getSelectedProjects() {
    return selectedProjects;
}

export function getShouldSelectAllProjects() {
    return shouldSelectAllProjects;
}

export function setShouldSelectAllProjects(should) {
    shouldSelectAllProjects = should;
}

export function getCurrentTotalEntitiesCount() {
    return currentTotalEntitiesCount;
}

export function setCurrentTotalEntitiesCount(count) {
    currentTotalEntitiesCount = count;
}

// ==================== 數據模型 ====================
export function getCurrentDailyData() {
    return currentDailyData;
}

export function setCurrentDailyData(data) {
    currentDailyData = data;
}

export function getGlobalSettings() {
    return globalSettings;
}

export function setGlobalSettings(settings) {
    globalSettings = settings;
}
