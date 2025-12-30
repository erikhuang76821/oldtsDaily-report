/**
 * 篩選與分析模式模塊
 * 負責處理數據篩選、分析模式切換、實體選擇等功能
 */

import {
    getActiveFilterGroup,
    setActiveFilterGroup,
    getAnalysisMode,
    setAnalysisMode as setAnalysisModeState,
    getActiveTrendFilter,
    setActiveTrendFilter,
    getSelectedPersons,
    getSelectedProjects,
    getShouldSelectAllPersons,
    setShouldSelectAllPersons,
    getShouldSelectAllProjects,
    setShouldSelectAllProjects,
    getCurrentTotalEntitiesCount
} from './state.js';

/**
 * 根據組別代碼篩選數據
 * @param {string} groupCode - 組別代碼（'ALL' 表示全部）
 */
export function filterByGroup(groupCode) {
    const activeFilterGroup = getActiveFilterGroup();

    if (activeFilterGroup === groupCode && groupCode !== 'ALL') {
        // Toggle off if clicking the active filter (unless it's ALL)
        setActiveFilterGroup('ALL');
    } else {
        setActiveFilterGroup(groupCode);
    }

    const newActiveFilterGroup = getActiveFilterGroup();

    // Update button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-group') === newActiveFilterGroup) {
            btn.classList.add('active');
        }
    });

    // Re-render content based on new filter
    // Note: renderData needs to be imported from ui.js or called via window
    if (window.renderData) {
        window.renderData();
    }
}

/**
 * 設置分析模式（專案視角、人員比對、組別視角）
 * @param {string} mode - 分析模式 ('PROJECT', 'PERSON', 'GROUP')
 */
export function setAnalysisMode(mode) {
    setAnalysisModeState(mode);
    setActiveTrendFilter(null); // Reset filter on mode change

    // UI Switch Logic
    const btnProject = document.getElementById('btnModeProject');
    const btnPerson = document.getElementById('btnModePerson');
    const btnGroup = document.getElementById('btnModeGroup');

    const btnResetPerson = document.getElementById('btnResetPerson');
    const btnResetProject = document.getElementById('btnResetProject');

    const activeClass = ['bg-white', 'text-corp-600', 'shadow-sm'];
    const inactiveClass = ['text-slate-500', 'hover:text-slate-700'];

    [btnProject, btnPerson, btnGroup].forEach(btn => {
        btn.classList.remove(...activeClass);
        btn.classList.add(...inactiveClass);
    });

    const activeBtn = mode === 'PROJECT' ? btnProject : (mode === 'PERSON' ? btnPerson : btnGroup);
    activeBtn.classList.remove(...inactiveClass);
    activeBtn.classList.add(...activeClass);

    // Toggle visibility of Entity Selection Area & Reset Buttons
    const entityArea = document.getElementById('entitySelectionArea');
    const chartHint = document.getElementById('chartLegendHint');
    const title = document.getElementById('entitySelectionTitle');

    // Hide all resets first - Visibility now managed inside renderTrendAnalysis based on selection state
    btnResetPerson.classList.add('hidden');
    btnResetProject.classList.add('hidden');

    if (mode === 'PERSON') {
        entityArea.classList.remove('hidden');
        chartHint.classList.add('hidden');
        title.innerHTML = '<i class="fa-solid fa-user-plus"></i> 點擊加入比對 (依組別分類)';
        setShouldSelectAllPersons(true);
    } else if (mode === 'PROJECT') {
        entityArea.classList.remove('hidden');
        chartHint.classList.add('hidden');
        title.innerHTML = '<i class="fa-solid fa-plus-circle"></i> 點擊加入比對 (專案清單)';
        setShouldSelectAllProjects(true);
    } else {
        entityArea.classList.add('hidden');
        chartHint.classList.remove('hidden');
    }

    // Initialization for modes
    if (mode === 'PERSON') {
        getSelectedPersons().clear();
    } else if (mode === 'PROJECT') {
        getSelectedProjects().clear();
    }

    // Render trend analysis
    if (window.renderTrendAnalysis) {
        window.renderTrendAnalysis();
    }
}

/**
 * 清除趨勢分析篩選條件
 */
export function clearTrendFilter() {
    setActiveTrendFilter(null);
    if (window.renderTrendAnalysis) {
        window.renderTrendAnalysis();
    }
}

/**
 * 重置人員選擇（全選）
 */
export function resetPersonSelection() {
    setShouldSelectAllPersons(true);
    getSelectedPersons().clear();
    if (window.renderTrendAnalysis) {
        window.renderTrendAnalysis();
    }
}

/**
 * 重置專案選擇（全選）
 */
export function resetProjectSelection() {
    setShouldSelectAllProjects(true);
    getSelectedProjects().clear();
    if (window.renderTrendAnalysis) {
        window.renderTrendAnalysis();
    }
}

/**
 * 切換專案選擇狀態
 * @param {string} name - 專案名稱
 */
export function toggleProjectSelection(name) {
    const analysisMode = getAnalysisMode();

    if (analysisMode === 'PROJECT') {
        const selectedProjects = getSelectedProjects();
        const currentTotalEntitiesCount = getCurrentTotalEntitiesCount();
        const isAllSelected = (selectedProjects.size === currentTotalEntitiesCount && currentTotalEntitiesCount > 0);

        if (isAllSelected) {
            selectedProjects.clear();
            selectedProjects.add(name);
        } else {
            if (selectedProjects.size === 1 && selectedProjects.has(name)) {
                resetProjectSelection();
                return;
            }
            if (selectedProjects.has(name)) {
                selectedProjects.delete(name);
            } else {
                selectedProjects.add(name);
            }
        }
        setTimeout(() => {
            if (window.renderTrendAnalysis) {
                window.renderTrendAnalysis();
            }
        }, 0);
    }
}

/**
 * 切換人員選擇狀態
 * @param {string} name - 人員名稱
 */
export function togglePersonSelection(name) {
    const analysisMode = getAnalysisMode();

    if (analysisMode === 'PERSON') {
        const selectedPersons = getSelectedPersons();
        const currentTotalEntitiesCount = getCurrentTotalEntitiesCount();
        const isAllSelected = (selectedPersons.size === currentTotalEntitiesCount && currentTotalEntitiesCount > 0);

        if (isAllSelected) {
            selectedPersons.clear();
            selectedPersons.add(name);
        } else {
            if (selectedPersons.size === 1 && selectedPersons.has(name)) {
                resetPersonSelection();
                return;
            }
            if (selectedPersons.has(name)) {
                selectedPersons.delete(name);
            } else {
                selectedPersons.add(name);
            }
        }
        setTimeout(() => {
            if (window.renderTrendAnalysis) {
                window.renderTrendAnalysis();
            }
        }, 0);
    }
}
