// Dựng composition HTML cho từng mẫu với mốc giọng đọc giả (không cần edge-tts / ffmpeg / Chrome):
// kiểm tra màu, logo, linh vật, avatar lấy theo brand và không còn màu thương hiệu cũ viết cứng.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveBrand } from '../lib/brand.mjs';
import { compose } from '../lib/compose.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(`../samples/${p}`, import.meta.url), 'utf8'));
const NAMES = ['tips', 'project-showcase', 'review-quote', 'before-after', 'myth-fact', 'web-build', 'quiz-ab', 'chat-skit', 'site-tour'];
// Màu thương hiệu bản gốc (cam, xanh navy, navy đậm) viết dạng RGB để chính file test không chứa mã màu cũ
const OLD_RGB = [[249, 115, 22], [11, 31, 58], [7, 20, 39]];
const hex = (rgb) => `#${rgb.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
const OLD = new RegExp(OLD_RGB.flatMap((c) => [hex(c), c.join(',\\s*')]).join('|'), 'i');

/** Mốc thời gian giả: mỗi từ 0,3 giây. */
function fakeTimings(script) {
    let cursor = 0;
    return script.scenes.map((s, index) => {
        const words = s.voiceover.split(/\s+/u).map((w, i) => ({ t: i * 0.3, d: 0.25, w }));
        const voice = words.length * 0.3;
        const dur = Math.max(2.4, 0.3 + voice + 0.45 + (s.hold ?? 0));
        const t = { index, start: cursor, dur, voice, voiceAt: 0.3, words };
        cursor += dur;
        return t;
    });
}

async function build(name, briefPatch = null, opts = {}) {
    const script = read(`${name}.script.json`);
    const brief = { ...read(`${name}.brief.json`), ...(briefPatch ?? {}) };
    const brand = resolveBrand(brief);
    const images = new Map((brief.images ?? []).map((src, i) => [src, { file: `img-${i}.jpg`, width: 1000, height: 2000 }]));
    const tour = name === 'site-tour' ? { file: 'page.jpg', height: 3000, points: script.scenes.filter((s) => s.type === 'tour').map(() => ({ rect: { x: 20, y: 600, w: 200, h: 40 } })) } : null;
    const timings = fakeTimings(script);
    return compose({ script, brief, brand, timings, voiceFiles: timings.map((t) => ({ file: `voice-${t.index}.mp3` })), images, tour, ...opts });
}

for (const name of NAMES) {
    test(`dựng ${name}: màu theo brand, không còn màu cũ viết cứng`, async () => {
        const { html, duration } = await build(name);
        assert.ok(duration > 10);
        assert.doesNotMatch(html, OLD);
        assert.match(html, /--accent: #[0-9A-F]{6};/);
        assert.match(html, /data-composition-id="main"/);
    });
}

test('màu brand đi vào biến CSS và nền phụ đề karaoke', async () => {
    const { html } = await build('tips', { brand: { name: 'Tiệm Hoa', colors: { accent: '#E11D48', primary: '#1F2937', background: '#111827' } } });
    assert.match(html, /--accent: #E11D48;/);
    assert.match(html, /--primary: #1F2937;/);
    assert.match(html, /--bg: #111827;/);
    assert.match(html, /rgba\(225,29,72,1\)/);
});

test('không có logo: logo góc và cảnh CTA hiện tên brand dạng chữ', async () => {
    const { html } = await build('myth-fact', { brand: { name: 'Tiệm <Hoa> Nhỏ', host: 'tiemhoa.vn' } });
    assert.match(html, /class="logo logo-text"[^>]*>Tiệm &lt;Hoa&gt; Nhỏ</);
    assert.match(html, /class="big-logo big-logo-text"/);
    assert.match(html, /<div class="pill">example\.com<\/div>/); // brief.cta.label ưu tiên hơn brand
    assert.doesNotMatch(html, /logo\.png/);
});

test('có logo: dùng file logo đã tải vào work', async () => {
    const { html } = await build('tips', null, { logoFile: 'logo.svg' });
    assert.match(html, /<img class="logo" src="logo\.svg" data-start="0"/);
    assert.match(html, /<img class="big-logo" src="logo\.svg"/);
});

test('nút CTA: thiếu brief.cta.label thì lấy brand.cta_label, rồi brand.host', async () => {
    const a = await build('tips', { cta: { url: 'https://tiemhoa.vn' }, brand: { name: 'Tiệm Hoa', host: 'tiemhoa.vn', cta_label: 'tiemhoa.vn/dat-hoa' } });
    assert.match(a.html, /<div class="pill">tiemhoa\.vn\/dat-hoa<\/div>/);
    const b = await build('tips', { cta: { url: 'https://tiemhoa.vn' }, brand: { name: 'Tiệm Hoa', host: 'tiemhoa.vn' } });
    assert.match(b.html, /<div class="pill">tiemhoa\.vn<\/div>/);
});

test('linh vật: "none" không vẽ, "tia" vẽ và tô theo màu brand', async () => {
    const none = await build('project-showcase');
    assert.doesNotMatch(none.html, /id="tia"/);
    const tia = await build('project-showcase', { brand: { mascot: 'tia', colors: { accent: '#14B8A6' } } });
    assert.match(tia.html, /id="tia"/);
    assert.match(tia.html, /stop-color: var\(--accent\)/);
    assert.ok(tia.sfx.some((x) => x.name === 'zap'));
});

test('chat-skit: avatar người dẫn là chữ cái đầu tên brand khi không có linh vật', async () => {
    const { html } = await build('chat-skit', { brand: { name: 'Tiệm Hoa' } });
    assert.match(html, /from-host/);
    assert.match(html, />T<\/text>/);
    const tia = await build('chat-skit', { brand: { name: 'Tiệm Hoa', mascot: 'tia' } });
    assert.doesNotMatch(tia.html, />T<\/text>/);
    assert.match(tia.html, /M36 10 L20 36/);
});

test('before-after: nhãn trung tính, đổi được qua brief.labels', async () => {
    const a = await build('before-after');
    assert.match(a.html, /TRƯỚC ĐÂY/);
    assert.match(a.html, /BÂY GIỜ/);
    const b = await build('before-after', { labels: { after: 'SAU KHI DÙNG APP' } });
    assert.match(b.html, /SAU KHI DÙNG APP/);
});
