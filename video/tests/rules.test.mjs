import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { validateScript } from '../lib/rules.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(`../samples/${p}`, import.meta.url), 'utf8'));

for (const name of ['tips', 'project-showcase', 'review-quote', 'before-after', 'myth-fact', 'web-build', 'quiz-ab', 'chat-skit', 'site-tour']) {
    test(`mẫu hợp lệ: ${name}`, () => {
        assert.deepEqual(validateScript(read(`${name}.script.json`), read(`${name}.brief.json`)), []);
    });
}

for (const file of readdirSync(new URL('../samples/invalid/', import.meta.url))) {
    test(`mẫu sai bị chặn: ${file}`, () => {
        const { brief, script, expect } = read(`invalid/${file}`);
        const errors = validateScript(script, brief);
        assert.ok(errors.some((e) => e.includes(expect)), `Cần lỗi chứa "${expect}", nhận: ${JSON.stringify(errors)}`);
    });
}
