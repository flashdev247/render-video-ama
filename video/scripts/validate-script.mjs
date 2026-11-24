#!/usr/bin/env node
// Kiểm tra script.json trước khi render.
// node scripts/validate-script.mjs --script script.json [--brief brief.json] [--errors-out errors.txt]
// Thoát mã 1 khi có lỗi; lỗi được ghi ra --errors-out để lần chạy lại đưa cho Claude.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { validateScript } from '../lib/rules.mjs';

const { values } = parseArgs({
    options: {
        script: { type: 'string', default: 'script.json' },
        brief: { type: 'string' },
        'errors-out': { type: 'string' },
    },
});

function fail(errors) {
    const text = errors.map((e) => `- ${e}`).join('\n');
    console.error(`Kịch bản không hợp lệ:\n${text}`);
    if (values['errors-out']) writeFileSync(values['errors-out'], `${text}\n`);
    process.exit(1);
}

if (!existsSync(values.script)) fail([`Không tìm thấy file ${values.script}.`]);

let script;
try {
    script = JSON.parse(readFileSync(values.script, 'utf8'));
} catch (e) {
    fail([`${values.script} không phải JSON hợp lệ: ${e.message}`]);
}

const brief = values.brief ? JSON.parse(readFileSync(values.brief, 'utf8')) : null;
const errors = validateScript(script, brief);
if (errors.length) fail(errors);

console.log(`Kịch bản hợp lệ: ${script.template}, ${script.scenes.length} cảnh.`);
