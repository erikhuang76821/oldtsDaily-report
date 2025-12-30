/**
 * 圖表渲染模塊
 * 負責處理所有圖表相關的渲染邏輯
 * 包括專案圓餅圖、趨勢分析圖表等
 */

import { getColor } from './config.js';
import {
    getProjectChartInstance,
    setProjectChartInstance,
    getTrendChartInstance,
    setTrendChartInstance,
    getGlobalSettings,
    getIsMergeMode,
    getAnalysisMode,
    getActiveTrendFilter,
    setActiveTrendFilter,
    getSelectedPersons,
    getSelectedProjects,
    getShouldSelectAllPersons,
    getShouldSelectAllProjects,
    setShouldSelectAllPersons,
    setShouldSelectAllProjects,
    getCurrentTotalEntitiesCount,
    setCurrentTotalEntitiesCount
} from './state.js';
import { getDB } from './storage.js';
import { cleanGroupName, cleanAuthorName } from './utils.js';
import { togglePersonSelection, toggleProjectSelection, resetPersonSelection, resetProjectSelection } from './filters.js';

/**
 * 渲染專案工時佔比圓餅圖和統計表格
 * @param {Array} userList - 用戶列表數據
 */
export function renderProjectStats(userList) {
    // Check visibility
    const canvas = document.getElementById('projectPieChart');
    if (!canvas || canvas.offsetParent === null) {
        // If hidden, destroy instance to prevent leaks/errors and return
        const chartInstance = getProjectChartInstance();
        if (chartInstance) {
            chartInstance.destroy();
            setProjectChartInstance(null);
        }
        return;
    }

    // Flatten tasks from all filtered users
    let allTasks = [];
    userList.forEach(u => allTasks.push(...u.tasks));

    if (allTasks.length === 0) {
        document.getElementById('projectTableBody').innerHTML = '';
        const chartInstance = getProjectChartInstance();
        if (chartInstance) {
            chartInstance.destroy();
            setProjectChartInstance(null);
        }
        return;
    }

    // Aggregate hours by project (Applying Merges)
    const counts = {};
    let total = 0;
    const globalSettings = getGlobalSettings();

    allTasks.forEach(t => {
        let p = t.project || '未分類';

        // Check if this project name matches any original name in merge rules
        const mergeRule = globalSettings.projectMerges.find(rule => rule.originals.includes(p));
        if (mergeRule) {
            p = mergeRule.alias; // Use the alias
        }

        counts[p] = (counts[p] || 0) + t.hours;
        total += t.hours;
    });

    // Convert to array and sort by hours desc
    const dataArr = Object.keys(counts).map(k => ({
        name: k,
        hours: counts[k],
        percent: (counts[k] / total * 100).toFixed(1)
    })).sort((a, b) => b.hours - a.hours);

    // Render Table (With Conditional Checkboxes)
    const tbody = document.getElementById('projectTableBody');

    // Handle header visibility based on isMergeMode
    const thCheckbox = document.getElementById('thCheckbox');
    const isMergeMode = getIsMergeMode();
    if (isMergeMode) thCheckbox.classList.remove('hidden');
    else thCheckbox.classList.add('hidden');

    tbody.innerHTML = dataArr.map((d, i) => {
        // Safely escape quotes for value attribute
        const safeName = d.name.replace(/"/g, '&quot;');
        return `
        <tr class="hover:bg-slate-50 border-b border-slate-100 last:border-0 group">
            <td class="px-3 py-2 text-center ${isMergeMode ? '' : 'hidden'}">
                <input type="checkbox" class="proj-checkbox rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" value="${safeName}">
            </td>
            <td class="px-3 py-2 font-bold text-slate-700 flex items-center">
                <span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getColor(i)}"></span>
                <span class="truncate max-w-[120px]" title="${d.name}">${d.name}</span>
            </td>
            <td class="px-3 py-2 text-right font-mono">${d.hours.toFixed(1)}</td>
            <td class="px-3 py-2 text-right font-mono text-slate-400">${d.percent}%</td>
        </tr>
    `}).join('');

    // Render Chart using Chart.js
    const ctx = document.getElementById('projectPieChart').getContext('2d');

    let chartInstance = getProjectChartInstance();
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null; // Ensure null after destroy
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dataArr.map(d => d.name),
            datasets: [{
                data: dataArr.map(d => d.hours),
                backgroundColor: dataArr.map((_, i) => getColor(i)),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            let value = context.parsed.toFixed(1);
                            let percentage = (context.parsed / total * 100).toFixed(1) + '%';
                            return label + value + 'hr (' + percentage + ')';
                        }
                    }
                }
            },
            cutout: '65%',
            layout: { padding: 10 }
        }
    });

    setProjectChartInstance(chartInstance);
}

/**
 * 渲染趨勢分析圖表
 * 支持專案視角、人員比對、組別視角三種模式
 */
export function renderTrendAnalysis() {
    const analysisMode = getAnalysisMode();
    const activeTrendFilter = getActiveTrendFilter();

    // UI Filter Hint (Only for GROUP mode now)
    const hintBox = document.getElementById('trendFilterHint');
    const hintText = document.getElementById('trendFilterText');

    if (analysisMode === 'GROUP' && activeTrendFilter) {
        hintBox.classList.remove('hidden');
        hintText.innerText = `目前聚焦：${activeTrendFilter}`;
    } else {
        hintBox.classList.add('hidden');
    }

    // Get DB history
    const db = getDB();
    const daysToAnalyze = parseInt(document.getElementById('analysisDays').value) || 7;

    // Get Dates
    const today = new Date();
    const dates = [];
    for (let i = daysToAnalyze - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    // Aggregate Data
    const aggregated = {};
    const allEntities = new Set();
    const entityTotals = {};
    const personGroups = {}; // Helper for person grouping

    // NEW: Track unique authors per row (date) to calculate averages for GROUP mode
    const rowStats = {}; // { date: { totalHours: 0, uniqueAuthors: Set() } }

    const globalSettings = getGlobalSettings();

    dates.forEach(date => {
        aggregated[date] = {};

        // Initialize row stats for this date
        if (!rowStats[date]) {
            rowStats[date] = { totalHours: 0, uniqueAuthors: new Set() };
        }

        if (db[date] && db[date].rows) {
            db[date].rows.forEach(row => {
                let key = '';
                let isRelevantForGroupStats = false;

                if (analysisMode === 'PROJECT') {
                    key = row.project || '未分類';
                    const mergeRule = globalSettings.projectMerges.find(rule => rule.originals.includes(key));
                    if (mergeRule) key = mergeRule.alias;
                } else if (analysisMode === 'PERSON') {
                    key = cleanAuthorName(row.name);
                    personGroups[key] = cleanGroupName(row.group);
                } else if (analysisMode === 'GROUP') {
                    key = cleanGroupName(row.group);

                    // Check relevance for Group Stats (Average calculation)
                    // If no filter, all rows count. If filter active, only matching rows count.
                    if (!activeTrendFilter || key === activeTrendFilter) {
                        isRelevantForGroupStats = true;
                    }
                }

                const val = row.hours;
                aggregated[date][key] = (aggregated[date][key] || 0) + val;
                allEntities.add(key);
                entityTotals[key] = (entityTotals[key] || 0) + val;

                // Accumulate stats for Group View Average Column
                if (analysisMode === 'GROUP' && isRelevantForGroupStats) {
                    rowStats[date].totalHours += val;
                    rowStats[date].uniqueAuthors.add(row.name);
                }
            });
        }
    });

    let entitiesArr = Array.from(allEntities);
    setCurrentTotalEntitiesCount(entitiesArr.length);
    const currentTotalEntitiesCount = getCurrentTotalEntitiesCount();
    entitiesArr.sort((a, b) => entityTotals[b] - entityTotals[a]);

    // --- COMPARISON MODE LOGIC (PERSON & PROJECT) ---
    if (analysisMode === 'PERSON' || analysisMode === 'PROJECT') {
        const isProjectMode = (analysisMode === 'PROJECT');
        const selectedSet = isProjectMode ? getSelectedProjects() : getSelectedPersons();
        const shouldSelectAll = isProjectMode ? getShouldSelectAllProjects() : getShouldSelectAllPersons();
        const btnReset = isProjectMode ? document.getElementById('btnResetProject') : document.getElementById('btnResetPerson');

        // Handle Select All Flag
        if (shouldSelectAll && entitiesArr.length > 0) {
            entitiesArr.forEach(p => selectedSet.add(p));
            if (isProjectMode) setShouldSelectAllProjects(false);
            else setShouldSelectAllPersons(false);
        }

        // Check if currently "All Selected" to toggle Reset Button visibility
        // Logic: If selection size < total count => Show Button. Else (Full selection) => Hide Button.
        // Note: We also check > 0 to avoid showing it when there is no data at all.
        if (selectedSet.size < currentTotalEntitiesCount && selectedSet.size > 0) {
            btnReset.classList.remove('hidden');
        } else {
            btnReset.classList.add('hidden');
        }

        // Render Selection UI
        const unselectedContainer = document.getElementById('unselectedEntityContainer');
        unselectedContainer.innerHTML = '';

        // Group unselected entities
        const unselectedByGroup = {};
        entitiesArr.forEach(p => {
            if (!selectedSet.has(p)) {
                let grp = '其他';
                if (isProjectMode) {
                    grp = '專案清單'; // Projects just go into one list
                } else {
                    grp = personGroups[p] || '其他';
                }

                if (!unselectedByGroup[grp]) unselectedByGroup[grp] = [];
                unselectedByGroup[grp].push(p);
            }
        });

        const sortedGroups = Object.keys(unselectedByGroup).sort();
        if (sortedGroups.length === 0) {
            unselectedContainer.innerHTML = '<div class="text-xs text-slate-400 italic">所有項目已在圖表中</div>';
        } else {
            sortedGroups.forEach(grp => {
                const groupDiv = document.createElement('div');
                groupDiv.className = "mb-1";

                const groupTitle = document.createElement('h5');
                groupTitle.className = "text-[10px] font-bold text-slate-400 mb-1 ml-1";
                groupTitle.innerText = grp;
                groupDiv.appendChild(groupTitle);

                const btnContainer = document.createElement('div');
                btnContainer.className = "flex flex-wrap gap-2";

                unselectedByGroup[grp].forEach(p => {
                    const btn = document.createElement('button');
                    btn.className = "text-[10px] font-medium px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-corp-600 transition flex items-center gap-1 shadow-sm";
                    btn.innerHTML = `<i class="fa-solid fa-plus text-slate-300"></i> ${p}`;
                    btn.onclick = () => isProjectMode ? toggleProjectSelection(p) : togglePersonSelection(p);
                    btnContainer.appendChild(btn);
                });

                groupDiv.appendChild(btnContainer);
                unselectedContainer.appendChild(groupDiv);
            });
        }

        // Filter Chart Entities to only selected
        entitiesArr = Array.from(selectedSet);
        entitiesArr.sort((a, b) => entityTotals[b] - entityTotals[a]);
    }
    // --- GROUP MODE LOGIC ---
    else {
        if (activeTrendFilter) {
            entitiesArr = entitiesArr.filter(e => e === activeTrendFilter);
        }
    }

    // Prepare Chart DataSets
    let isStacked = false;
    if (analysisMode === 'GROUP') {
        isStacked = true;
    } else if (analysisMode === 'PROJECT') {
        const selectedProjects = getSelectedProjects();
        const allSelected = (selectedProjects.size === currentTotalEntitiesCount && currentTotalEntitiesCount > 0);
        isStacked = allSelected;
    }

    const datasets = entitiesArr.map((entity, i) => {
        return {
            label: entity,
            data: dates.map(date => aggregated[date][entity] || 0),
            backgroundColor: getColor(i),
            stack: isStacked ? 'Stack 0' : undefined,
        };
    });

    // Render Chart
    const ctxEl = document.getElementById('trendChart');
    if (!ctxEl) return;
    const ctx = ctxEl.getContext('2d');

    let trendChartInstance = getTrendChartInstance();
    if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
    }

    trendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (evt, activeElements, chart) => {
                if (activeElements.length > 0) {
                    const datasetIndex = activeElements[0].datasetIndex;
                    const label = chart.data.datasets[datasetIndex].label;

                    if (analysisMode === 'PERSON') {
                        togglePersonSelection(label);
                    } else if (analysisMode === 'PROJECT') {
                        toggleProjectSelection(label);
                    } else {
                        // Group Mode Drill Down
                        if (activeTrendFilter === label) {
                            setActiveTrendFilter(null);
                        } else {
                            setActiveTrendFilter(label);
                        }
                        setTimeout(() => renderTrendAnalysis(), 0);
                    }
                }
            },
            scales: {
                x: {
                    stacked: isStacked
                },
                y: {
                    stacked: isStacked,
                    beginAtZero: true,
                    title: { display: true, text: '總工時 (hr)' }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 10, font: { size: 10 } },
                    onClick: (e, legendItem, legend) => {
                        const label = legendItem.text;
                        if (analysisMode === 'PERSON') {
                            togglePersonSelection(label);
                        } else if (analysisMode === 'PROJECT') {
                            toggleProjectSelection(label);
                        } else {
                            if (activeTrendFilter === label) {
                                setActiveTrendFilter(null);
                            } else {
                                setActiveTrendFilter(label);
                            }
                            setTimeout(() => renderTrendAnalysis(), 0);
                        }
                    }
                }
            }
        }
    });

    setTrendChartInstance(trendChartInstance);
    renderTrendTable(dates, entitiesArr, aggregated, rowStats);
}

/**
 * 渲染趨勢分析詳細數據表格
 * @param {Array} dates - 日期陣列
 * @param {Array} entities - 實體陣列（專案、人員或組別）
 * @param {Object} dataMap - 數據映射 { date: { entity: hours } }
 * @param {Object} rowStats - 每日統計數據（用於組別模式的平均值計算）
 */
export function renderTrendTable(dates, entities, dataMap, rowStats) {
    const table = document.getElementById('trendTable');
    const analysisMode = getAnalysisMode();

    const totals = {};
    entities.forEach(e => {
        totals[e] = dates.reduce((sum, date) => sum + (dataMap[date][e] || 0), 0);
    });
    const sortedEntities = entities.sort((a, b) => totals[b] - totals[a]);

    // Determine if we show the Avg column
    const showAvg = (analysisMode === 'GROUP');

    let html = `
        <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
                <th class="px-2 py-2 font-bold text-slate-500">日期</th>
                ${sortedEntities.map(e => `<th class="px-2 py-2 text-center text-slate-700 whitespace-nowrap">${e}</th>`).join('')}
                <th class="px-2 py-2 text-right font-bold text-slate-700">總計</th>
                ${showAvg ? '<th class="px-2 py-2 text-right font-bold text-indigo-600 bg-indigo-50/30">平均/人</th>' : ''}
            </tr>
        </thead>
        <tbody>
    `;

    const reversedDates = [...dates].reverse();

    reversedDates.forEach(date => {
        let rowTotal = 0;
        const cells = sortedEntities.map(e => {
            const val = dataMap[date][e] || 0;
            rowTotal += val;
            return `<td class="px-2 py-2 text-center border-b border-slate-50 ${val === 0 ? 'text-slate-200' : 'text-slate-600 font-mono'}">${val > 0 ? val.toFixed(1) : '-'}</td>`;
        });

        // Calculate Avg for Group View
        let avgCell = '';
        if (showAvg) {
            const stats = rowStats[date] || { totalHours: 0, uniqueAuthors: new Set() };
            const count = stats.uniqueAuthors.size;
            const total = stats.totalHours;
            const avg = count > 0 ? (total / count).toFixed(1) : '-';
            // Optional tooltip to show calculation details
            const title = count > 0 ? `共 ${count} 人 (${total.toFixed(1)}hr)` : '';
            avgCell = `<td class="px-2 py-2 text-right font-bold font-mono text-indigo-600 border-b border-slate-50 bg-indigo-50/30" title="${title}">${avg}</td>`;
        }

        html += `
            <tr class="hover:bg-slate-50 transition">
                <td class="px-2 py-2 font-bold text-slate-500 border-b border-slate-50 whitespace-nowrap">${date}</td>
                ${cells.join('')}
                <td class="px-2 py-2 text-right font-bold text-slate-800 border-b border-slate-50 bg-slate-50/50">${rowTotal.toFixed(1)}</td>
                ${avgCell}
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;
}
