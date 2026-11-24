// prompts/kich-ban.md là template: Laravel thay các placeholder bằng hồ sơ brand trước khi gửi cho AI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const prompt = readFileSync(new URL('../prompts/kich-ban.md', import.meta.url), 'utf8');
export const PLACEHOLDERS = ['BRAND_NAME', 'BRAND_HOST', 'BRAND_HASHTAG', 'CTA_SPOKEN', 'AUDIENCE', 'CITY_COUNTRY'];

test('prompt có đủ placeholder brand', () => {
    for (const name of PLACEHOLDERS) assert.ok(prompt.includes(`{{${name}}}`), `thiếu {{${name}}}`);
});

test('prompt chỉ dùng placeholder đã biết', () => {
    const used = new Set([...prompt.matchAll(/\{\{\s*([A-Z_]+)\s*\}\}/g)].map((m) => m[1]));
    assert.deepEqual([...used].sort(), [...PLACEHOLDERS].sort());
});

test('prompt dùng speaker host (không còn tia)', () => {
    assert.match(prompt, /`host`/);
    assert.doesNotMatch(prompt, /`tia`/);
});
