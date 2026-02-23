// src/logic.test.js
import { describe, it, expect } from 'vitest';
import {
    getColLetter,
    cleanGroupName,
    cleanAuthorName,
    getUserId,
    formatContent,
    getColor,
    deduplicateAndSortDates,
    parseGlobalSettings,
    isValidSettingsData,
    buildMergedProjectRules,
    parseSheetDate,
    CHART_COLORS,
    DEFAULT_GROUP_MERGES,
} from './logic.js';

// ============================================================
// getColLetter
// ============================================================
describe('getColLetter', () => {
    it('should convert 0 to A', () => {
        expect(getColLetter(0)).toBe('A');
    });

    it('should convert 1 to B', () => {
        expect(getColLetter(1)).toBe('B');
    });

    it('should convert 25 to Z', () => {
        expect(getColLetter(25)).toBe('Z');
    });

    it('should convert 26 to AA', () => {
        expect(getColLetter(26)).toBe('AA');
    });

    it('should convert 27 to AB', () => {
        expect(getColLetter(27)).toBe('AB');
    });

    it('should convert 51 to AZ', () => {
        expect(getColLetter(51)).toBe('AZ');
    });

    it('should convert 52 to BA', () => {
        expect(getColLetter(52)).toBe('BA');
    });

    it('should convert 702 to AAA', () => {
        expect(getColLetter(702)).toBe('AAA');
    });
});

// ============================================================
// cleanGroupName
// ============================================================
describe('cleanGroupName', () => {
    const merges = [
        { alias: '品檢', originals: ['品檢組', '品檢'] },
        { alias: '技術', originals: ['技術', '技術組'] },
    ];

    it('should return alias when original matches a rule', () => {
        expect(cleanGroupName('品檢組', merges)).toBe('品檢');
        expect(cleanGroupName('技術組', merges)).toBe('技術');
    });

    it('should return original name when no rule matches', () => {
        expect(cleanGroupName('客服組', merges)).toBe('客服組');
    });

    it('should return 其他 for null/undefined/empty', () => {
        expect(cleanGroupName(null, merges)).toBe('其他');
        expect(cleanGroupName(undefined, merges)).toBe('其他');
        expect(cleanGroupName('', merges)).toBe('其他');
    });

    it('should trim whitespace before matching', () => {
        expect(cleanGroupName('  品檢  ', merges)).toBe('品檢');
        expect(cleanGroupName(' 技術 ', merges)).toBe('技術');
    });

    it('should return original when no merges provided', () => {
        expect(cleanGroupName('網頁組', [])).toBe('網頁組');
    });
});

// ============================================================
// cleanAuthorName
// ============================================================
describe('cleanAuthorName', () => {
    it('should return last 5 characters of a Chinese name', () => {
        // 假設 name = "張三丰abc" → 最後5字 = "三丰abc" → 去掉開頭英文 = "三丰abc"... 
        // 等等讓我更精確地測試
        expect(cleanAuthorName('王小明')).toBe('王小明'); // 3 chars, < 5
    });

    it('should slice last 5 chars and strip leading English', () => {
        // "ABCDEabc小明" → last 5 = "abc小明" → strip leading eng = "小明"
        expect(cleanAuthorName('ABCDEabc小明')).toBe('小明');
    });

    it('should return full name if 5 chars or less', () => {
        expect(cleanAuthorName('小明')).toBe('小明');
    });

    it('should strip leading English from sliced result', () => {
        // "testUser張三" → last 5 = "er張三" ... wait
        // "testUser張三" has 10 chars → last 5 = "r張三" ... no
        // Let me count: t-e-s-t-U-s-e-r-張-三 = 10 chars → last 5 = "ser張三" ... no
        // Actually: t(0) e(1) s(2) t(3) U(4) s(5) e(6) r(7) 張(8) 三(9) → 10 chars
        // slice(-5) = "er張三" ... no, that's 4 chars from index 5
        // slice(-5) with 10 chars → index 5 to 9 = "ser張三" ... still 5? 
        // s(5) e(6) r(7) 張(8) 三(9) = "ser張三" → strip leading eng → "張三"
        expect(cleanAuthorName('testUser張三')).toBe('張三');
    });

    it('should return Unknown for null/undefined', () => {
        expect(cleanAuthorName(null)).toBe('Unknown');
        expect(cleanAuthorName(undefined)).toBe('Unknown');
    });

    it('should handle empty string', () => {
        expect(cleanAuthorName('')).toBe('Unknown');
    });

    it('should handle all-English name', () => {
        // "JohnSmith" → last 5 = "Smith" → strip leading eng = "" 
        expect(cleanAuthorName('JohnSmith')).toBe('');
    });
});

// ============================================================
// getUserId
// ============================================================
describe('getUserId', () => {
    it('should prefix with user_card_', () => {
        expect(getUserId('test')).toBe('user_card_test');
    });

    it('should preserve Chinese characters', () => {
        expect(getUserId('小明')).toBe('user_card_小明');
    });

    it('should replace special characters with underscore', () => {
        expect(getUserId('張-三.丰')).toBe('user_card_張_三_丰');
    });

    it('should preserve alphanumeric characters', () => {
        expect(getUserId('user123')).toBe('user_card_user123');
    });

    it('should handle spaces', () => {
        expect(getUserId('小 明')).toBe('user_card_小_明');
    });
});

// ============================================================
// formatContent
// ============================================================
describe('formatContent', () => {
    it('should wrap 測試內容 with bold span', () => {
        const result = formatContent('今天做了測試內容相關工作');
        expect(result).toContain('<span class="font-bold text-slate-800">測試內容</span>');
    });

    it('should wrap 工作事項 with bold span', () => {
        const result = formatContent('工作事項如下');
        expect(result).toContain('<span class="font-bold text-slate-800">工作事項</span>');
    });

    it('should wrap 問題回報 with bold span', () => {
        const result = formatContent('問題回報：bug修復');
        expect(result).toContain('<span class="font-bold text-slate-800">問題回報</span>');
    });

    it('should handle multiple keywords', () => {
        const result = formatContent('測試內容和工作事項');
        expect(result).toContain('<span class="font-bold text-slate-800">測試內容</span>');
        expect(result).toContain('<span class="font-bold text-slate-800">工作事項</span>');
    });

    it('should return (無內容) for null/undefined/empty', () => {
        expect(formatContent(null)).toBe('(無內容)');
        expect(formatContent(undefined)).toBe('(無內容)');
        expect(formatContent('')).toBe('(無內容)');
    });

    it('should return original text if no keyword matches', () => {
        expect(formatContent('普通文字')).toBe('普通文字');
    });
});

// ============================================================
// getColor
// ============================================================
describe('getColor', () => {
    it('should return first color for index 0', () => {
        expect(getColor(0)).toBe('#3b82f6');
    });

    it('should return correct color for valid index', () => {
        expect(getColor(2)).toBe('#10b981');
    });

    it('should cycle colors when index exceeds array length', () => {
        expect(getColor(15)).toBe(CHART_COLORS[0]); // 15 % 15 = 0
        expect(getColor(16)).toBe(CHART_COLORS[1]); // 16 % 15 = 1
    });

    it('should handle large indices', () => {
        expect(getColor(100)).toBe(CHART_COLORS[100 % CHART_COLORS.length]);
    });
});

// ============================================================
// deduplicateAndSortDates
// ============================================================
describe('deduplicateAndSortDates', () => {
    it('should remove duplicates', () => {
        const result = deduplicateAndSortDates(['2024-01-01', '2024-01-01', '2024-01-02']);
        expect(result).toEqual(['2024-01-02', '2024-01-01']);
    });

    it('should sort in descending order', () => {
        const result = deduplicateAndSortDates(['2024-01-01', '2024-03-15', '2024-02-10']);
        expect(result).toEqual(['2024-03-15', '2024-02-10', '2024-01-01']);
    });

    it('should handle empty array', () => {
        expect(deduplicateAndSortDates([])).toEqual([]);
    });

    it('should handle single element', () => {
        expect(deduplicateAndSortDates(['2024-05-01'])).toEqual(['2024-05-01']);
    });

    it('should handle all-duplicate array', () => {
        const result = deduplicateAndSortDates(['2024-01-01', '2024-01-01', '2024-01-01']);
        expect(result).toEqual(['2024-01-01']);
    });
});

// ============================================================
// parseGlobalSettings
// ============================================================
describe('parseGlobalSettings', () => {
    it('should return defaults when storedJson is null', () => {
        const result = parseGlobalSettings(null);
        expect(result.projectMerges).toEqual([]);
        expect(result.groupMerges).toEqual(DEFAULT_GROUP_MERGES);
    });

    it('should use stored values when valid JSON is provided', () => {
        const stored = JSON.stringify({
            projectMerges: [{ alias: 'A', originals: ['B', 'C'] }],
            groupMerges: [{ alias: 'X', originals: ['Y'] }],
        });
        const result = parseGlobalSettings(stored);
        expect(result.projectMerges).toHaveLength(1);
        expect(result.projectMerges[0].alias).toBe('A');
        expect(result.groupMerges[0].alias).toBe('X');
    });

    it('should fill missing projectMerges with empty array', () => {
        const stored = JSON.stringify({ groupMerges: [{ alias: 'X', originals: ['Y'] }] });
        const result = parseGlobalSettings(stored);
        expect(result.projectMerges).toEqual([]);
    });

    it('should fill missing groupMerges with defaults', () => {
        const stored = JSON.stringify({ projectMerges: [] });
        const result = parseGlobalSettings(stored);
        expect(result.groupMerges).toEqual(DEFAULT_GROUP_MERGES);
    });

    it('should not share reference with DEFAULT_GROUP_MERGES', () => {
        const result = parseGlobalSettings(null);
        result.groupMerges.push({ alias: 'test', originals: [] });
        expect(result.groupMerges.length).not.toBe(DEFAULT_GROUP_MERGES.length);
    });
});

// ============================================================
// isValidSettingsData
// ============================================================
describe('isValidSettingsData', () => {
    it('should return true when projectMerges exists', () => {
        expect(isValidSettingsData({ projectMerges: [] })).toBe(true);
    });

    it('should return true when groupMerges exists', () => {
        expect(isValidSettingsData({ groupMerges: [] })).toBe(true);
    });

    it('should return true when both exist', () => {
        expect(isValidSettingsData({ projectMerges: [], groupMerges: [] })).toBe(true);
    });

    it('should return false for null/undefined', () => {
        expect(isValidSettingsData(null)).toBe(false);
        expect(isValidSettingsData(undefined)).toBe(false);
    });

    it('should return false for object without required keys', () => {
        expect(isValidSettingsData({ foo: 'bar' })).toBe(false);
        expect(isValidSettingsData({})).toBe(false);
    });
});

// ============================================================
// buildMergedProjectRules
// ============================================================
describe('buildMergedProjectRules', () => {
    it('should create a new merge rule from selected names', () => {
        const result = buildMergedProjectRules(['ProjectA', 'ProjectB'], 'Merged', []);
        expect(result).toHaveLength(1);
        expect(result[0].alias).toBe('Merged');
        expect(result[0].originals).toEqual(['ProjectA', 'ProjectB']);
    });

    it('should absorb existing rule originals when selected name matches an alias', () => {
        const existing = [
            { alias: 'ExistingGroup', originals: ['Sub1', 'Sub2'] },
        ];
        const result = buildMergedProjectRules(['ExistingGroup', 'NewProject'], 'BigMerge', existing);
        expect(result).toHaveLength(1);
        expect(result[0].alias).toBe('BigMerge');
        expect(result[0].originals).toContain('Sub1');
        expect(result[0].originals).toContain('Sub2');
        expect(result[0].originals).toContain('NewProject');
    });

    it('should remove the old rule when its alias is selected for merge', () => {
        const existing = [
            { alias: 'GroupA', originals: ['A1', 'A2'] },
            { alias: 'GroupB', originals: ['B1'] },
        ];
        const result = buildMergedProjectRules(['GroupA', 'GroupB'], 'AllMerged', existing);
        // Both old rules should be removed, replaced by one new rule
        expect(result).toHaveLength(1);
        expect(result[0].alias).toBe('AllMerged');
        expect(result[0].originals).toEqual(['A1', 'A2', 'B1']);
    });

    it('should not mutate the original merges array', () => {
        const existing = [{ alias: 'X', originals: ['Y'] }];
        const existingCopy = JSON.parse(JSON.stringify(existing));
        buildMergedProjectRules(['X', 'Z'], 'New', existing);
        expect(existing).toEqual(existingCopy);
    });

    it('should preserve unrelated existing rules', () => {
        const existing = [
            { alias: 'Keep', originals: ['K1'] },
            { alias: 'ToMerge', originals: ['M1'] },
        ];
        const result = buildMergedProjectRules(['ToMerge', 'NewItem'], 'Merged', existing);
        expect(result).toHaveLength(2);
        expect(result[0].alias).toBe('Keep');
        expect(result[1].alias).toBe('Merged');
    });
});

// ============================================================
// parseSheetDate
// ============================================================
describe('parseSheetDate', () => {
    it('should parse Date(YYYY,MM,DD) format (month is 0-indexed)', () => {
        // Date(2024,0,15) → January 15, 2024
        expect(parseSheetDate('Date(2024,0,15)')).toBe('2024-01-15');
    });

    it('should parse Date with higher month values', () => {
        // Date(2024,11,25) → December 25, 2024
        expect(parseSheetDate('Date(2024,11,25)')).toBe('2024-12-25');
    });

    it('should parse standard date string YYYY-MM-DD', () => {
        expect(parseSheetDate('2024-03-20')).toBe('2024-03-20');
    });

    it('should parse date string with slashes YYYY/MM/DD', () => {
        expect(parseSheetDate('2024/06/15')).toBe('2024-06-15');
    });

    it('should return null for null/undefined/empty', () => {
        expect(parseSheetDate(null)).toBeNull();
        expect(parseSheetDate(undefined)).toBeNull();
        expect(parseSheetDate('')).toBeNull();
    });

    it('should return null for invalid date strings', () => {
        expect(parseSheetDate('not-a-date')).toBeNull();
        expect(parseSheetDate('abc')).toBeNull();
    });

    it('should trim whitespace', () => {
        expect(parseSheetDate('  2024-01-01  ')).toBe('2024-01-01');
    });

    it('should pad single-digit months and days', () => {
        // Date(2024,0,5) → 2024-01-05
        expect(parseSheetDate('Date(2024,0,5)')).toBe('2024-01-05');
    });
});
