// src/security.js
// 資安工具函式 — 消毒、驗證、靜態掃描

// ============================================================
// XSS 防護：HTML 實體轉義
// ============================================================
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;',
};

/**
 * 將字串中的 HTML 特殊字元轉義，防止 XSS 注入
 */
export function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char]);
}

// ============================================================
// URL 安全驗證
// ============================================================

/**
 * 只允許 http / https 開頭的 URL，且不含可破壞 HTML 屬性的字元
 * 回傳安全的 URL 或空字串
 */
export function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();

    // 只允許 http / https
    if (!/^https?:\/\//i.test(trimmed)) return '';

    // 阻擋會破壞 HTML 屬性的字元 (雙引號、事件注入)
    if (/["'<>]/.test(trimmed)) return '';

    return trimmed;
}

// ============================================================
// HTML 屬性安全化
// ============================================================

/**
 * 清理要插入 HTML 屬性的字串 (移除引號、尖括號等)
 */
export function sanitizeForAttribute(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/['"<>&`]/g, '');
}

// ============================================================
// Prototype Pollution 防護
// ============================================================

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * 遞迴檢查物件是否含有可造成 Prototype Pollution 的 key
 * @returns {string[]} 發現的危險 key 路徑陣列
 */
export function detectPrototypePollution(obj, path = '') {
    const findings = [];
    if (!obj || typeof obj !== 'object') return findings;

    for (const key of Object.keys(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        if (DANGEROUS_KEYS.includes(key)) {
            findings.push(currentPath);
        }
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            findings.push(...detectPrototypePollution(obj[key], currentPath));
        }
    }
    return findings;
}

/**
 * 深度移除物件中的危險 key，回傳清理後的新物件
 */
export function stripDangerousKeys(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(stripDangerousKeys);

    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (DANGEROUS_KEYS.includes(key)) continue;
        clean[key] = typeof value === 'object' && value !== null ? stripDangerousKeys(value) : value;
    }
    return clean;
}

// ============================================================
// Settings Schema 驗證
// ============================================================

/**
 * 嚴格驗證匯入的設定結構
 * 每個 merge rule 必須有 string alias 和 string[] originals
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSettingsSchema(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['資料不是有效的物件'] };
    }

    // 檢查 prototype pollution
    const polluted = detectPrototypePollution(data);
    if (polluted.length > 0) {
        errors.push(`偵測到危險的 key: ${polluted.join(', ')}`);
    }

    // 驗證 projectMerges
    if (data.projectMerges !== undefined) {
        if (!Array.isArray(data.projectMerges)) {
            errors.push('projectMerges 必須是陣列');
        } else {
            data.projectMerges.forEach((rule, i) => {
                if (!rule.alias || typeof rule.alias !== 'string') {
                    errors.push(`projectMerges[${i}].alias 必須是非空字串`);
                }
                if (!Array.isArray(rule.originals)) {
                    errors.push(`projectMerges[${i}].originals 必須是陣列`);
                } else if (rule.originals.some((o) => typeof o !== 'string')) {
                    errors.push(`projectMerges[${i}].originals 中包含非字串元素`);
                }
            });
        }
    }

    // 驗證 groupMerges
    if (data.groupMerges !== undefined) {
        if (!Array.isArray(data.groupMerges)) {
            errors.push('groupMerges 必須是陣列');
        } else {
            data.groupMerges.forEach((rule, i) => {
                if (!rule.alias || typeof rule.alias !== 'string') {
                    errors.push(`groupMerges[${i}].alias 必須是非空字串`);
                }
                if (!Array.isArray(rule.originals)) {
                    errors.push(`groupMerges[${i}].originals 必須是陣列`);
                }
            });
        }
    }

    if (!data.projectMerges && !data.groupMerges) {
        errors.push('必須至少包含 projectMerges 或 groupMerges');
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================
// 靜態 HTML 掃描
// ============================================================

/**
 * 掃描 HTML 原始碼，回報資安問題
 * @param {string} htmlContent - HTML 原始碼
 * @returns {{ severity: string, category: string, message: string, line?: number }[]}
 */
export function auditHtmlFile(htmlContent) {
    const findings = [];
    const lines = htmlContent.split('\n');

    lines.forEach((line, i) => {
        const lineNum = i + 1;

        // 偵測 innerHTML 使用
        if (/\.innerHTML\s*[=+]/.test(line)) {
            findings.push({
                severity: 'HIGH',
                category: 'XSS',
                message: `使用 innerHTML 可能導致 XSS 注入`,
                line: lineNum,
            });
        }

        // 偵測 CDN 缺少 integrity (SRI)
        if (/<script\s+src=/.test(line) && !/integrity=/.test(line) && /https?:\/\//.test(line)) {
            findings.push({
                severity: 'MEDIUM',
                category: 'SRI',
                message: `外部 script 缺少 integrity 屬性 (Subresource Integrity)`,
                line: lineNum,
            });
        }
        if (/<link\s+href=/.test(line) && !/integrity=/.test(line) && /https?:\/\//.test(line)) {
            findings.push({
                severity: 'MEDIUM',
                category: 'SRI',
                message: `外部 link 缺少 integrity 屬性 (Subresource Integrity)`,
                line: lineNum,
            });
        }

        // 偵測 target="_blank" 缺少 rel="noopener"
        if (/target\s*=\s*["']_blank["']/.test(line) && !/rel\s*=\s*["'][^"]*noopener/.test(line)) {
            findings.push({
                severity: 'LOW',
                category: 'TABNABBING',
                message: `target="_blank" 缺少 rel="noopener noreferrer"，可能遭受 tabnabbing 攻擊`,
                line: lineNum,
            });
        }

        // 偵測字串拼接 onclick (使用者資料可能被注入)
        if (/onclick\s*=\s*["'].*\$\{/.test(line) || /onclick\s*=\s*["'].*\+/.test(line)) {
            findings.push({
                severity: 'HIGH',
                category: 'XSS',
                message: `onclick 屬性中使用動態字串拼接，可能導致程式碼注入`,
                line: lineNum,
            });
        }
    });

    // 全域檢查：CSP
    if (!/<meta\s+http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(htmlContent)) {
        findings.push({
            severity: 'MEDIUM',
            category: 'CSP',
            message: '缺少 Content-Security-Policy meta 標籤',
        });
    }

    return findings;
}

// ============================================================
// XSS Payload 檢測
// ============================================================

/** 常見 XSS 攻擊向量 */
export const XSS_PAYLOADS = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '"><img src=x onerror=alert(1)>',
    "' onfocus=alert(1) autofocus='",
    '<iframe src="javascript:alert(1)">',
    '<div onmouseover="alert(1)">hover</div>',
    '{{constructor.constructor("alert(1)")()}}',
    '<a href="javascript:alert(1)">click</a>',
    '<math><mi xlink:href="javascript:alert(1)">click</mi></math>',
];

/** 危險 URL 向量 */
export const DANGEROUS_URLS = [
    'javascript:alert(1)',
    'javascript:void(0)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    '  javascript:alert(1)',
    'http://evil.com" onclick="alert(1)',
    "http://evil.com' onfocus='alert(1)",
];
