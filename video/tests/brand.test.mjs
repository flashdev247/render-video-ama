import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrast, DEFAULT_COLORS, DEFAULT_FONT, DEFAULT_VOICES, initial, onColor, readableOn, resolveBrand, resolveFont, speakerOf, theme } from '../lib/brand.mjs';
import { sceneVoices } from '../lib/compose.mjs';
import { validateScript } from '../lib/rules.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(`../samples/${p}`, import.meta.url), 'utf8'));

test('brief không có brand: dùng mặc định trung tính', () => {
    const b = resolveBrand({});
    assert.deepEqual(b.colors, DEFAULT_COLORS);
    assert.equal(b.font.family, DEFAULT_FONT);
    assert.equal(b.mascot, 'none');
    assert.deepEqual(b.voices, DEFAULT_VOICES);
    assert.equal(b.narrator, null);
    assert.equal(b.logoUrl, null);
    assert.equal(b.name, '');
    assert.equal(resolveBrand(null).mascot, 'none');
});

test('brand sai dữ liệu: màu / font / linh vật / giọng sai thì lùi về mặc định', () => {
    const b = resolveBrand({
        brand: {
            name: '  Tiệm Hoa Nhỏ ',
            colors: { primary: 'red', accent: '#0a0', background: '#12345', text: '#fff;}body{' },
            font: 'Comic Sans MS',
            mascot: 'rong',
            voices: { host: 'giong-la', khach: 'vi-VN-NamMinhNeural' },
            hashtags: ['#TiemHoa', 'khong-hop-le'],
        },
    });
    assert.equal(b.name, 'Tiệm Hoa Nhỏ');
    assert.deepEqual(b.colors, { ...DEFAULT_COLORS, accent: '#00AA00' });
    assert.equal(b.font.family, DEFAULT_FONT);
    assert.equal(b.mascot, 'none');
    assert.equal(b.voices.host, DEFAULT_VOICES.host);
    assert.equal(b.narrator, null);
    assert.deepEqual(b.hashtags, ['#TiemHoa']);
});

test('font: chỉ dùng font có sẵn trong assets/fonts (đủ Regular + Bold)', () => {
    const fonts = { BeVietnamPro: { regular: 'BeVietnamPro-Regular.ttf', bold: 'BeVietnamPro-Bold.ttf' }, Inter: { regular: 'Inter-Regular.ttf', bold: 'Inter-Bold.ttf' } };
    assert.equal(resolveFont('Inter', fonts).regular, 'Inter-Regular.ttf');
    assert.equal(resolveFont('Be Vietnam Pro', fonts).family, 'Be Vietnam Pro');
    assert.equal(resolveFont('Roboto', fonts).family, DEFAULT_FONT);
    assert.equal(resolveFont(null, fonts).family, DEFAULT_FONT);
});

test('theme: biến CSS theo màu brand, chữ trên nền nhấn đủ tương phản', () => {
    const t = theme(resolveBrand({ brand: { colors: { accent: '#FACC15' } } }));
    assert.equal(t.accent, '#FACC15');
    assert.equal(t.accentRgb, '250,204,21');
    assert.match(t.vars, /--accent: #FACC15;/);
    assert.equal(t.onAccent, '#0F172A'); // nền vàng sáng → chữ tối
    assert.equal(onColor('#4F46E5'), '#FFFFFF');
});

test('chữ màu nhấn trên nền brand luôn đủ tương phản', () => {
    for (const accent of ['#4F46E5', '#1E3A8A', '#14B8A6', '#000000', '#FACC15']) {
        const t = theme(resolveBrand({ brand: { colors: { accent } } }));
        assert.ok(contrast(t.accentText, t.background) >= 3, `${accent} → ${t.accentText}`);
    }
    assert.equal(readableOn('#FACC15', '#0F172A'), '#FACC15'); // đã đủ sáng thì giữ nguyên
});

test('avatar chữ: chữ cái đầu tên brand', () => {
    assert.equal(initial('  ánh dương studio'), 'Á');
    assert.equal(initial(''), '•');
});

test('speaker "tia" là alias của "host"', () => {
    assert.equal(speakerOf('tia'), 'host');
    assert.equal(speakerOf('khach'), 'khach');
});

test('kịch bản cũ dùng speaker "tia" vẫn hợp lệ', () => {
    const script = read('chat-skit.script.json');
    const old = { ...script, scenes: script.scenes.map((s) => (s.speaker === 'host' ? { ...s, speaker: 'tia' } : s)) };
    assert.ok(old.scenes.some((s) => s.speaker === 'tia'));
    assert.deepEqual(validateScript(old, read('chat-skit.brief.json')), []);
});

test('giọng đọc: cảnh msg theo speaker từ brand.voices, giọng chính theo brand.voices.host nếu có', () => {
    const script = read('chat-skit.script.json');
    const custom = resolveBrand({ brand: { voices: { host: 'vi-VN-NamMinhNeural', khach: 'vi-VN-HoaiMyNeural' } } });
    const v = sceneVoices(script, custom);
    assert.equal(v.voice, 'vi-VN-NamMinhNeural');
    script.scenes.forEach((s, i) => {
        if (s.speaker === 'khach') assert.equal(v.voices[i], 'vi-VN-HoaiMyNeural');
        else if (s.speaker) assert.equal(v.voices[i], 'vi-VN-NamMinhNeural');
        else assert.equal(v.voices[i], null);
    });
    // Không đặt giọng: giữ script.voice
    assert.equal(sceneVoices(script, resolveBrand({})).voice, script.voice);
});
