/**
 * 規則管理模塊
 * 負責處理專案合併規則、組別合併規則的增刪改查
 */

import {
    getIsMergeMode,
    setIsMergeMode,
    getRuleToDeleteIndex,
    setRuleToDeleteIndex,
    getRuleToEditIndex,
    setRuleToEditIndex,
    getRuleToEditGroupIndex,
    setRuleToEditGroupIndex,
    getDeleteType,
    setDeleteType,
    getGlobalSettings
} from './state.js';
import { saveGlobalSettings } from './storage.js';
import { showToast } from './utils.js';

/**
 * 處理合併按鈕點擊事件
 * 切換合併模式或開啟合併對話框
 */
export function handleMergeButtonClick() {
    const btn = document.getElementById('btnMergeAction');
    const span = btn.querySelector('span');
    const cancelBtn = document.getElementById('btnCancelMerge');
    const thCheckbox = document.getElementById('thCheckbox');
    const hint = document.getElementById('mergeHint');
    const isMergeMode = getIsMergeMode();

    if (!isMergeMode) {
        // Enter Merge Mode
        setIsMergeMode(true);
        span.innerText = "合併選取項目";
        cancelBtn.classList.remove('hidden');
        thCheckbox.classList.remove('hidden');
        hint.classList.remove('hidden');
        // Re-render to show checkboxes
        if (window.renderData) {
            window.renderData();
        }
    } else {
        // Execute Merge Action -> OPEN MODAL
        openMergeDialog();
    }
}

/**
 * 取消合併模式
 */
export function cancelMergeMode() {
    const btn = document.getElementById('btnMergeAction');
    const span = btn.querySelector('span');
    const cancelBtn = document.getElementById('btnCancelMerge');
    const thCheckbox = document.getElementById('thCheckbox');
    const hint = document.getElementById('mergeHint');

    setIsMergeMode(false);
    span.innerText = "合併設定";
    cancelBtn.classList.add('hidden');
    thCheckbox.classList.add('hidden');
    hint.classList.add('hidden');
    if (window.renderData) {
        window.renderData();
    }
}

/**
 * 開啟合併對話框
 */
export function openMergeDialog() {
    const checkboxes = document.querySelectorAll('.proj-checkbox:checked');
    if (checkboxes.length < 2) {
        return showToast('請至少勾選兩個專案進行合併');
    }

    const selectedNames = Array.from(checkboxes).map(cb => cb.value);
    const defaultName = selectedNames[0];

    // Populate Modal
    document.getElementById('mergeNameInput').value = defaultName;
    const listEl = document.getElementById('mergeListPreview');
    listEl.innerHTML = selectedNames.map(name => `<li>${name}</li>`).join('');

    // Show Modal
    document.getElementById('mergeDialogOverlay').classList.remove('hidden');
    document.getElementById('mergeNameInput').focus();
}

/**
 * 關閉合併對話框
 */
export function closeMergeDialog() {
    document.getElementById('mergeDialogOverlay').classList.add('hidden');
}

/**
 * 確認合併操作
 */
export function confirmMerge() {
    const newName = document.getElementById('mergeNameInput').value;
    if (!newName || !newName.trim()) {
        alert('請輸入合併後的名稱');
        return;
    }

    const checkboxes = document.querySelectorAll('.proj-checkbox:checked');
    const selectedNames = Array.from(checkboxes).map(cb => cb.value);

    // Resolve actual original names from selected aliases (in case user merges already merged groups)
    let actualOriginals = [];
    const globalSettings = getGlobalSettings();

    selectedNames.forEach(name => {
        // Check if this 'name' is an alias for an existing rule
        const existingRuleIndex = globalSettings.projectMerges.findIndex(r => r.alias === name);

        if (existingRuleIndex > -1) {
            // It's an existing merged group, grab its originals and remove the old rule
            actualOriginals.push(...globalSettings.projectMerges[existingRuleIndex].originals);
            globalSettings.projectMerges.splice(existingRuleIndex, 1);
        } else {
            // It's a raw project name
            actualOriginals.push(name);
        }
    });

    // Create new rule
    globalSettings.projectMerges.push({
        alias: newName.trim(),
        originals: actualOriginals
    });

    saveGlobalSettings();

    closeMergeDialog();
    cancelMergeMode(); // Exit merge mode and refresh
    showToast('合併成功！可至「控制台」管理規則');
}

/**
 * 切換所有專案複選框
 * @param {HTMLInputElement} source - 來源複選框元素
 */
export function toggleAllProjectCheckboxes(source) {
    const checkboxes = document.querySelectorAll('.proj-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

/**
 * 新增組別規則
 */
export function addGroupRule() {
    const aliasInput = document.getElementById('newGroupAlias');
    const sourceInput = document.getElementById('newGroupSources');

    const alias = aliasInput.value.trim();
    const sourcesRaw = sourceInput.value.trim();

    if (!alias || !sourcesRaw) {
        return showToast('請填寫完整資訊');
    }

    const sources = sourcesRaw.split(/[,\s，]+/).filter(s => s.trim() !== '');
    if (sources.length === 0) return showToast('請輸入至少一個原始名稱');

    const globalSettings = getGlobalSettings();
    globalSettings.groupMerges.unshift({
        alias: alias,
        originals: sources
    });

    saveGlobalSettings();

    // Clear inputs
    aliasInput.value = '';
    sourceInput.value = '';
    showToast('來源規則已新增');
}

/**
 * 刪除組別規則
 * @param {number} index - 規則索引
 */
export function deleteGroupRule(index) {
    setRuleToDeleteIndex(index);
    setDeleteType('group');
    document.getElementById('confirmDialogOverlay').classList.remove('hidden');
}

/**
 * 開啟編輯組別規則對話框
 * @param {number} index - 規則索引
 */
export function openEditGroupRule(index) {
    setRuleToEditGroupIndex(index);
    const globalSettings = getGlobalSettings();
    const rule = globalSettings.groupMerges[index];
    if (!rule) return;

    const aliasInput = document.getElementById('editGroupAliasInput');
    const sourcesInput = document.getElementById('editGroupSourcesInput');

    aliasInput.value = rule.alias;
    sourcesInput.value = rule.originals.join(', ');

    document.getElementById('editGroupDialogOverlay').classList.remove('hidden');
    aliasInput.focus();
}

/**
 * 關閉編輯組別規則對話框
 */
export function closeEditGroupDialog() {
    document.getElementById('editGroupDialogOverlay').classList.add('hidden');
    setRuleToEditGroupIndex(-1);
}

/**
 * 儲存編輯後的組別規則
 */
export function saveEditedGroupRule() {
    const ruleToEditGroupIndex = getRuleToEditGroupIndex();
    if (ruleToEditGroupIndex === -1) return;

    const aliasInput = document.getElementById('editGroupAliasInput');
    const sourcesInput = document.getElementById('editGroupSourcesInput');

    const newAlias = aliasInput.value.trim();
    const newSourcesRaw = sourcesInput.value.trim();

    if (!newAlias || !newSourcesRaw) {
        return alert('請填寫完整資訊');
    }

    const newSources = newSourcesRaw.split(/[,\s，]+/).filter(s => s.trim() !== '');
    if (newSources.length === 0) return alert('請輸入至少一個原始名稱');

    // Update
    const globalSettings = getGlobalSettings();
    globalSettings.groupMerges[ruleToEditGroupIndex] = {
        alias: newAlias,
        originals: newSources
    };
    saveGlobalSettings();

    closeEditGroupDialog();
    if (window.renderData) {
        window.renderData();
    }
    showToast('來源規則已更新');
}

/**
 * 刪除專案規則
 * @param {number} index - 規則索引
 */
export function deleteProjectRule(index) {
    setRuleToDeleteIndex(index);
    setDeleteType('project');
    document.getElementById('confirmDialogOverlay').classList.remove('hidden');
}

/**
 * 開啟編輯專案規則對話框
 * @param {number} index - 規則索引
 */
export function openEditProjectRule(index) {
    setRuleToEditIndex(index);
    const globalSettings = getGlobalSettings();
    const rule = globalSettings.projectMerges[index];
    if (!rule) return;

    // Pre-fill input
    const input = document.getElementById('editAliasInput');
    input.value = rule.alias;

    document.getElementById('editDialogOverlay').classList.remove('hidden');
    input.focus();
}

/**
 * 關閉編輯專案規則對話框
 */
export function closeEditDialog() {
    document.getElementById('editDialogOverlay').classList.add('hidden');
    setRuleToEditIndex(-1);
}

/**
 * 儲存編輯後的專案規則
 */
export function saveEditedProjectRule() {
    const ruleToEditIndex = getRuleToEditIndex();
    if (ruleToEditIndex === -1) return;

    const input = document.getElementById('editAliasInput');
    const newAlias = input.value.trim();

    if (!newAlias) {
        return alert('請輸入名稱');
    }

    // Update
    const globalSettings = getGlobalSettings();
    globalSettings.projectMerges[ruleToEditIndex].alias = newAlias;
    saveGlobalSettings();

    // Refresh
    closeEditDialog();
    if (window.renderData) {
        window.renderData(); // Make sure pie chart updates immediately if on overview
    }
    showToast('名稱已更新');
}

/**
 * 執行刪除規則操作
 */
export function executeDeleteRule() {
    const ruleToDeleteIndex = getRuleToDeleteIndex();
    if (ruleToDeleteIndex === -1) return;

    const deleteType = getDeleteType();
    const globalSettings = getGlobalSettings();

    if (deleteType === 'project') {
        globalSettings.projectMerges.splice(ruleToDeleteIndex, 1);
    } else if (deleteType === 'group') {
        globalSettings.groupMerges.splice(ruleToDeleteIndex, 1);
    }

    saveGlobalSettings();

    if (window.renderData) {
        window.renderData();
    }

    closeConfirmDialog();
    showToast('已刪除規則');
}

/**
 * 關閉確認對話框
 */
export function closeConfirmDialog() {
    document.getElementById('confirmDialogOverlay').classList.add('hidden');
    setRuleToDeleteIndex(-1);
    setDeleteType('');
}
