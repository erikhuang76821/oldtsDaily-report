/**
 * UI 操作與渲染模塊
 * 負責處理所有用戶介面的渲染和交互邏輯
 */

import {
    getActiveTab,
    setActiveTab,
    getActiveFilterGroup,
    getCurrentDailyData,
    getGlobalSettings
} from './state.js';
import { cleanGroupName, cleanAuthorName, formatContent, getUserId, scrollToUser } from './utils.js';
import { renderProjectStats, renderTrendAnalysis } from './charts.js';
import { handleScroll } from './utils.js';

/**
 * 切換側邊欄顯示/隱藏（用於移動端）
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('absolute', 'w-full', 'h-full', 'left-0', 'top-0');
    } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('absolute', 'w-full', 'h-full', 'left-0', 'top-0');
    }
}

/**
 * 切換分頁標籤
 * @param {string} tab - 分頁名稱 ('OVERVIEW', 'ANALYSIS', 'SOURCE', 'SETTINGS')
 */
export function switchTab(tab) {
    setActiveTab(tab);

    // UI Buttons
    document.querySelectorAll('.header-tab-btn').forEach(btn => btn.classList.remove('active'));
    const tabBtn = document.getElementById(`tab-${tab}`);
    if (tabBtn) tabBtn.classList.add('active');

    // Sections
    const sourceSec = document.getElementById('sourceSection');
    const overviewSec = document.getElementById('overviewSection');
    const settingsSec = document.getElementById('settingsSection');
    const analysisSec = document.getElementById('analysisTabSection');

    sourceSec.classList.add('hidden');
    overviewSec.classList.add('hidden');
    settingsSec.classList.add('hidden');
    analysisSec.classList.add('hidden');

    if (tab === 'OVERVIEW') {
        overviewSec.classList.remove('hidden');
        renderData(); // Refresh overview
        // Recalculate scroll arrows state
        setTimeout(handleScroll, 100);
    } else if (tab === 'ANALYSIS') {
        analysisSec.classList.remove('hidden');
        renderTrendAnalysis();
    } else if (tab === 'SOURCE') {
        sourceSec.classList.remove('hidden');
        const currentDailyData = getCurrentDailyData();
        // Update config inputs from state
        const gsheetIdEl = document.getElementById('gsheetId');
        if (gsheetIdEl) gsheetIdEl.value = currentDailyData.config.sheetId || '';

        const colDate = document.getElementById('colDate');
        const colGroup = document.getElementById('colGroup');
        const colName = document.getElementById('colName');
        const colProj = document.getElementById('colProj');
        const colId = document.getElementById('colId');
        const colContent = document.getElementById('colContent');
        const colHours = document.getElementById('colHours');
        const colLink = document.getElementById('colLink');

        if (colDate) colDate.value = currentDailyData.config.cols.date;
        if (colGroup) colGroup.value = currentDailyData.config.cols.group;
        if (colName) colName.value = currentDailyData.config.cols.name;
        if (colProj) colProj.value = currentDailyData.config.cols.proj;
        if (colId) colId.value = currentDailyData.config.cols.id;
        if (colContent) colContent.value = currentDailyData.config.cols.content;
        if (colHours) colHours.value = currentDailyData.config.cols.hours;
        if (colLink) colLink.value = (currentDailyData.config.cols.link !== undefined) ? currentDailyData.config.cols.link : 7;

        updateRawPreview();
    } else if (tab === 'SETTINGS') {
        settingsSec.classList.remove('hidden');
        renderSettingsTab();
    }
}

/**
 * 更新原始資料預覽區域
 */
export function updateRawPreview() {
    const ta = document.getElementById('rawJsonPreview');
    const countSpan = document.getElementById('rawDataCount');
    const currentDailyData = getCurrentDailyData();

    if (!ta || !countSpan) return;

    if (currentDailyData.rows && currentDailyData.rows.length > 0) {
        ta.value = JSON.stringify(currentDailyData.rows, null, 2);
        countSpan.innerText = `${currentDailyData.rows.length} 筆資料`;
    } else {
        ta.value = '';
        countSpan.innerText = `0 筆資料`;
    }
}

/**
 * 動態渲染篩選按鈕
 * @param {Array} groups - 組別陣列
 */
export function renderDynamicFilterButtons(groups) {
    const container = document.getElementById('groupFilterButtons');
    if (!container) return;

    const activeFilterGroup = getActiveFilterGroup();

    // Always add 'ALL' button first
    let html = `
        <button class="filter-btn ${activeFilterGroup === 'ALL' ? 'active' : ''}"
                data-group="ALL"
                onclick="filterByGroup('ALL')">
            全部
        </button>
    `;

    groups.forEach(group => {
        if (!group) return; // skip empty
        const isActive = (activeFilterGroup === group);
        html += `
            <button class="filter-btn ${isActive ? 'active' : ''}"
                    data-group="${group}"
                    onclick="filterByGroup('${group}')">
                ${group}
            </button>
        `;
    });

    container.innerHTML = html;
}

/**
 * 渲染儀表板工時統計條形圖
 * @param {Array} userList - 用戶列表數據
 */
export function renderDashboardWidgets(userList) {
    const container = document.getElementById('hoursGridContainer');
    if (!container) return;

    container.innerHTML = '';

    // Sort by hours desc
    const sorted = [...userList].sort((a, b) => b.totalHours - a.totalHours);

    let rows = '';
    sorted.forEach(u => {
        let barColor = 'bg-emerald-500';
        let hoursClass = 'text-emerald-700';
        if (u.totalHours < 8) {
            barColor = 'bg-amber-400';
            hoursClass = 'text-amber-700';
        } else if (u.totalHours > 10) {
            barColor = 'bg-rose-500';
            hoursClass = 'text-rose-700';
        }

        let width = Math.min((u.totalHours / 12) * 100, 100);

        // Clean Name & Group
        const shortName = cleanAuthorName(u.name);
        const displayLabel = u.group ? `<span class="text-xs text-slate-400 mr-1">[${u.group}]</span>${shortName}` : shortName;

        // Pass name safely to scrollToUser (escape single quotes)
        const safeName = u.name.replace(/'/g, "\\'");

        rows += `
            <div onclick="scrollToUser('${safeName}')" class="cursor-pointer flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition" title="點擊跳轉到工作項目">
                <div class="font-bold text-sm text-slate-700 truncate w-32 shrink-0" title="${u.name}">${displayLabel}</div>
                <div class="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                     <div class="${barColor} h-2 rounded-full" style="width: ${width}%"></div>
                </div>
                <div class="font-mono text-sm font-bold ${hoursClass} w-12 text-right">${u.totalHours.toFixed(1)}</div>
            </div>
        `;
    });
    container.innerHTML = rows;
}

/**
 * 渲染詳細工作項目列表
 * @param {Array} userList - 用戶列表數據
 */
export function renderDetailList(userList) {
    const container = document.getElementById('detailView');
    if (!container) return;

    container.innerHTML = '';

    if (userList.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-slate-400 border border-slate-200 rounded-lg bg-white/50"><i class="fa-solid fa-filter text-lg mr-2"></i> 目前篩選條件下無匹配資料。</div>`;
        const analysisSection = document.getElementById('analysisSection');
        if (analysisSection) analysisSection.classList.add('hidden');
        return;
    }

    const analysisSection = document.getElementById('analysisSection');
    if (analysisSection) analysisSection.classList.remove('hidden');

    userList.forEach(u => {
        let hoursColor = 'bg-emerald-100 text-emerald-800';
        if (u.totalHours < 8) hoursColor = 'bg-amber-100 text-amber-800';
        if (u.totalHours > 10) hoursColor = 'bg-rose-100 text-rose-800';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row overflow-hidden mb-2';

        // Add ID for anchor scroll
        card.id = getUserId(u.name);

        // Clean Name & Group for Card Header
        const shortName = cleanAuthorName(u.name);

        let tasksHtml = u.tasks.map(t => {
            // Logic for Link Button
            let linkHtml = '';
            if (t.link && t.link.startsWith('http')) {
                linkHtml = `
                    <div class="mt-2 text-right">
                        <a href="${t.link}" target="_blank" class="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 hover:text-indigo-800 transition font-bold border border-indigo-100">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> 開啟連結
                        </a>
                    </div>
                  `;
            }

            return `
            <div class="border-b border-slate-100 last:border-0">
                <button class="accordion-btn w-full text-left p-2 flex items-center justify-between hover:bg-slate-50 transition group focus:outline-none" onclick="toggleTask(this)" aria-expanded="false">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 pr-4">
                        <span class="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-100" title="專案">${t.project}</span>
                        <span class="text-sm font-bold text-slate-700 font-mono" title="議題ID">${t.issue}</span>
                        <span class="text-xs font-bold text-corp-600 font-mono ml-auto md:ml-2" title="時數">: ${t.hours}hr</span>
                    </div>
                    <i class="fa-solid fa-chevron-down text-slate-300 text-xs accordion-icon group-hover:text-corp-600"></i>
                </button>
                <div class="accordion-content bg-slate-50/50">
                    <div class="text-xs leading-relaxed pl-1 pt-2 border-t border-slate-100 border-dashed mx-3 mb-2 text-slate-600 whitespace-pre-line">
                        ${formatContent(t.content)}
                    </div>
                    <div class="px-3 pb-2">
                        ${linkHtml}
                    </div>
                </div>
            </div>
        `}).join('');

        card.innerHTML = `
            <div onclick="toggleAllTasks(this)" class="cursor-pointer hover:bg-slate-100 transition p-2 md:w-32 bg-slate-50 md:border-r border-b md:border-b-0 border-slate-200 flex flex-row md:flex-col items-center justify-between md:justify-center gap-1 shrink-0" title="點擊展開/收合所有項目">
                <div class="flex flex-col items-center">
                    <div class="text-[10px] text-slate-400 font-bold mb-0.5">${u.originalGroup}</div>
                    <div class="font-bold text-sm text-slate-800 text-center leading-tight whitespace-nowrap truncate w-full px-1" title="${u.name}">
                        ${shortName}
                    </div>
                </div>
                <div class="px-2 py-0.5 rounded-full text-[10px] font-bold ${hoursColor} mt-1">${u.totalHours.toFixed(1)}h</div>
            </div>
            <div class="flex-1 bg-white flex flex-col">${tasksHtml}</div>
        `;
        container.appendChild(card);
    });
}

/**
 * 渲染設定分頁內容
 */
export function renderSettingsTab() {
    const globalSettings = getGlobalSettings();

    // Render Project Rules (Updated with Edit Button)
    const projContainer = document.getElementById('mergeRulesContainer');
    const noProjMsg = document.getElementById('noRulesMsg');

    if (!projContainer || !noProjMsg) return;

    if (globalSettings.projectMerges.length === 0) {
        projContainer.innerHTML = '';
        noProjMsg.classList.remove('hidden');
    } else {
        noProjMsg.classList.add('hidden');
        projContainer.innerHTML = globalSettings.projectMerges.map((rule, index) => `
            <div class="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-slate-700">${rule.alias}</span>
                        <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">專案合併</span>
                    </div>
                    <div class="text-xs text-slate-400 leading-relaxed break-all">
                        包含: ${rule.originals.join(', ')}
                    </div>
                </div>
                <div class="flex items-center">
                    <button onclick="openEditProjectRule(${index})" class="text-slate-400 hover:text-indigo-600 p-2 transition" title="編輯名稱">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteProjectRule(${index})" class="text-slate-400 hover:text-rose-500 p-2 transition" title="刪除規則">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render Group Rules
    const groupContainer = document.getElementById('groupRulesContainer');
    if (groupContainer) {
        groupContainer.innerHTML = globalSettings.groupMerges.map((rule, index) => `
            <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div class="flex-1 overflow-hidden">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-emerald-700">${rule.alias}</span>
                        <span class="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">組別</span>
                    </div>
                    <div class="text-xs text-slate-400 truncate" title="${rule.originals.join(', ')}">
                        ${rule.originals.join(', ')}
                    </div>
                </div>
                <div class="flex items-center">
                    <button onclick="openEditGroupRule(${index})" class="text-slate-300 hover:text-emerald-600 p-2 transition" title="編輯規則">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteGroupRule(${index})" class="text-slate-300 hover:text-rose-500 p-2 transition" title="刪除規則">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

/**
 * 展開/收合單個任務項目
 * @param {HTMLButtonElement} btn - 手風琴按鈕元素
 */
export function toggleTask(btn) {
    const container = btn.parentElement;
    const content = container.querySelector('.accordion-content');
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !isExpanded);
    if (!isExpanded) {
        content.classList.add('expanded', 'p-3', 'pt-0');
    } else {
        content.classList.remove('expanded', 'p-3', 'pt-0');
    }
}

/**
 * 展開/收合某用戶的所有任務項目
 * @param {HTMLElement} headerEl - 用戶卡片頭部元素
 */
export function toggleAllTasks(headerEl) {
    const card = headerEl.parentElement;
    const buttons = card.querySelectorAll('.accordion-btn');
    const contents = card.querySelectorAll('.accordion-content');

    // 檢查是否全部都已經展開（若全部展開，則動作為收合；若有任一未展開，則動作為全展開）
    const allExpanded = Array.from(buttons).every(btn => btn.getAttribute('aria-expanded') === 'true');
    const newState = !allExpanded;

    buttons.forEach(btn => {
        btn.setAttribute('aria-expanded', newState);
        // 同步旋轉箭頭 icon
        const icon = btn.querySelector('.accordion-icon');
        if (icon) {
            if (newState) icon.style.transform = 'rotate(180deg)';
            else icon.style.transform = 'rotate(0deg)';
        }
    });

    contents.forEach(content => {
        if (newState) {
            content.classList.add('expanded', 'p-3', 'pt-0');
        } else {
            content.classList.remove('expanded', 'p-3', 'pt-0');
        }
    });
}

/**
 * 主渲染函數 - 聚合並渲染所有數據
 */
export function renderData() {
    const currentDailyData = getCurrentDailyData();
    const rawRows = currentDailyData.rows || [];

    const analysisSection = document.getElementById('analysisSection');
    const resultSection = document.getElementById('resultSection');
    const emptyState = document.getElementById('emptyState');

    if (rawRows.length === 0) {
        if (analysisSection) analysisSection.classList.add('hidden');
        if (resultSection) resultSection.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');

        const headerTotalEl = document.getElementById('headerTotalManHours');
        if (headerTotalEl) headerTotalEl.innerText = "0 人 / 0.0hr";

        // Clear buttons on empty state
        const groupFilterButtons = document.getElementById('groupFilterButtons');
        if (groupFilterButtons) groupFilterButtons.innerHTML = '';
        return;
    }

    if (analysisSection) analysisSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    // 0. Dynamic Filter Buttons Generation
    // Extract unique groups from the actual data
    const uniqueGroups = Array.from(new Set(rawRows.map(r => cleanGroupName(r.group)))).sort();

    // Safety check: if current active filter no longer exists in data, reset to ALL
    const activeFilterGroup = getActiveFilterGroup();
    if (activeFilterGroup !== 'ALL' && !uniqueGroups.includes(activeFilterGroup)) {
        // Reset via state setter
        import('./state.js').then(module => {
            module.setActiveFilterGroup('ALL');
        });
    }

    renderDynamicFilterButtons(uniqueGroups);

    // 1. Group by User
    const userMap = {};
    let totalHoursGlobal = 0;

    rawRows.forEach(row => {
        // Ensure dynamic update of group name based on current settings
        const dynamicGroup = cleanGroupName(row.group);

        if (!userMap[row.name]) {
            userMap[row.name] = {
                name: row.name,
                group: dynamicGroup || '其他',
                originalGroup: row.group || '其他', // Store original for display
                totalHours: 0,
                tasks: []
            };
        }

        userMap[row.name].totalHours += row.hours;
        userMap[row.name].tasks.push(row);
        totalHoursGlobal += row.hours;
    });

    const userList = Object.values(userMap);

    // --- APPLY FILTER ---
    let filteredUserList = userList;
    if (activeFilterGroup !== 'ALL') {
        // Filter is applied against the already cleaned 'group' field in the user object
        filteredUserList = userList.filter(u => u.group === activeFilterGroup);
    }
    // --- END APPLY FILTER ---

    const userCount = userList.length; // Global count remains based on all data.

    // Update Header Stats (always use global total hours for header)
    const statsText = `${userCount}人 / ${totalHoursGlobal.toFixed(1)}hr`;
    const headerTotalEl = document.getElementById('headerTotalManHours');
    if (headerTotalEl) headerTotalEl.innerText = statsText;

    // Calculate filtered stats for the widget header
    let filteredHours = 0;
    filteredUserList.forEach(u => filteredHours += u.totalHours);
    const filteredStatsText = `${filteredUserList.length}人 / ${filteredHours.toFixed(1)}hr`;
    const widgetTotalEl = document.getElementById('widgetTotalManHours');
    if (widgetTotalEl) widgetTotalEl.innerText = filteredStatsText;

    // Sort for Detail View (Group > Hours) to create small group concepts
    filteredUserList.sort((a, b) => {
        if (a.group !== b.group) return a.group.localeCompare(b.group, 'zh-Hant');
        return b.totalHours - a.totalHours;
    });

    // 2. Render Detail View (NOW TOP) - Uses filtered list
    renderDetailList(filteredUserList);

    // 3. Render Dashboard Widgets (NOW BOTTOM) - Uses filtered list
    renderDashboardWidgets(filteredUserList);

    // 4. Render Project Pie Chart - Uses filtered list data
    renderProjectStats(filteredUserList);
}
