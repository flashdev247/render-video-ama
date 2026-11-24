// Hồ sơ brand trong brief (khối "brand"): mọi trường tùy chọn, thiếu / sai thì dùng mặc định trung tính.
// Renderer KHÔNG viết cứng thương hiệu nào: màu, font, logo, linh vật, giọng đọc, tên miền CTA đều lấy từ đây.
// Laravel (VideoBriefBuilder) điền khối này từ hồ sơ brand; xem docs/video-renderer.md.
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = join(ROOT, 'assets', 'fonts');

/** Màu mặc định trung tính (slate + indigo). */
export const DEFAULT_COLORS = Object.freeze({
    primary: '#1E293B',
    accent: '#4F46E5',
    background: '#0F172A',
    text: '#FFFFFF',
});

/** Font đóng gói sẵn trong assets/fonts, dùng khi brand không chọn hoặc chọn font không có sẵn. */
export const DEFAULT_FONT = 'Be Vietnam Pro';

/** Giọng edge-tts mặc định: người dẫn (host) giọng nữ, khách giọng nam. */
export const DEFAULT_VOICES = Object.freeze({ host: 'vi-VN-HoaiMyNeural', khach: 'vi-VN-NamMinhNeural' });

export const MASCOTS = ['none', 'tia'];

/** Kịch bản cũ dùng speaker "tia": coi là alias của "host" (người dẫn đại diện brand). */
export const speakerOf = (speaker) => (speaker === 'tia' ? 'host' : speaker);

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const VOICE = /^[a-z]{2,3}-[A-Z]{2}-[A-Za-z]+Neural$/;

/** "#abc" | "#AABBCC" → [r, g, b]; sai định dạng → null. */
export function hexToRgb(hex) {
    if (!HEX.test(String(hex ?? ''))) return null;
    let h = hex.slice(1);
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const toHex = (rgb) => `#${rgb.map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/** Trộn màu a với màu b theo tỉ lệ t (0 = a, 1 = b). */
export function mix(a, b, t) {
    const x = hexToRgb(a);
    const y = hexToRgb(b);
    return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

/** Độ sáng tương đối (WCAG) 0..1. */
export function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Chữ trắng hay chữ tối trên nền màu này (chọn cái tương phản hơn). */
export function onColor(hex) {
    const l = luminance(hex);
    return (1.05 / (l + 0.05)) >= ((l + 0.05) / (luminance('#0F172A') + 0.05)) ? '#FFFFFF' : '#0F172A';
}

const rgbList = (hex) => hexToRgb(hex).join(',');

/** Tỉ lệ tương phản WCAG giữa hai màu (1..21). */
export function contrast(a, b) {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
}

/** Màu nhấn dùng cho CHỮ trên nền brand: làm sáng / tối dần tới khi đủ tương phản (≥ 3) để đọc được. */
export function readableOn(color, bg, min = 3) {
    const toward = luminance(bg) < 0.4 ? '#FFFFFF' : '#000000';
    for (let t = 0; t <= 1; t += 0.05) {
        const c = mix(color, toward, t);
        if (contrast(c, bg) >= min) return c;
    }
    return toward.toUpperCase();
}

/** "Be Vietnam Pro" → "BeVietnamPro": tên file font trong assets/fonts là <Tên liền>-Regular.ttf / -Bold.ttf. */
const compact = (family) => String(family).replace(/[^A-Za-z0-9]/g, '');

/** Các font có sẵn (đủ bản Regular + Bold) trong assets/fonts: { 'Be Vietnam Pro': {regular, bold} } theo tên liền. */
export function availableFonts(dir = FONT_DIR) {
    const files = existsSync(dir) ? readdirSync(dir) : [];
    const out = {};
    for (const f of files) {
        const m = /^(.+)-Regular\.(ttf|otf|woff2?)$/i.exec(f);
        if (!m) continue;
        const bold = files.find((x) => new RegExp(`^${m[1]}-Bold\\.(ttf|otf|woff2?)$`, 'i').test(x));
        if (bold) out[m[1]] = { regular: f, bold };
    }
    return out;
}

/** Font của brand nếu có sẵn trong assets, không thì font mặc định. Trả { family, regular, bold }. */
export function resolveFont(family, fonts = availableFonts()) {
    const wanted = fonts[compact(family ?? '')];
    // Tên font đi vào CSS: chỉ giữ chữ, số, khoảng trắng, gạch ngang
    if (family && wanted) return { family: String(family).replace(/[^\p{L}\p{N} -]/gu, '').trim(), ...wanted };
    return { family: DEFAULT_FONT, ...(fonts[compact(DEFAULT_FONT)] ?? { regular: 'BeVietnamPro-Regular.ttf', bold: 'BeVietnamPro-Bold.ttf' }) };
}

const str = (v, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Chuẩn hóa khối brand của brief. Không bao giờ ném lỗi: dữ liệu sai bị thay bằng mặc định.
 * @returns {{name: string, host: string|null, ctaLabel: string|null, colors: object, font: object, logoUrl: string|null,
 *            mascot: 'none'|'tia', voices: {host: string, khach: string}, narrator: string|null, hashtags: string[]}}
 */
export function resolveBrand(brief) {
    const b = brief?.brand && typeof brief.brand === 'object' ? brief.brand : {};
    const c = b.colors && typeof b.colors === 'object' ? b.colors : {};
    const colors = Object.fromEntries(Object.entries(DEFAULT_COLORS).map(([k, def]) => [k, hexToRgb(c[k]) ? toHex(hexToRgb(c[k])) : def]));
    const v = b.voices && typeof b.voices === 'object' ? b.voices : {};
    const voice = (key) => (VOICE.test(String(v[key] ?? '')) ? v[key] : DEFAULT_VOICES[key]);
    const host = str(b.host, 80);
    return {
        name: str(b.name, 60) ?? host ?? '',
        host,
        ctaLabel: str(b.cta_label, 60),
        colors,
        font: resolveFont(str(b.font, 60)),
        logoUrl: str(b.logo_url, 2000),
        mascot: MASCOTS.includes(b.mascot) ? b.mascot : 'none',
        voices: { host: voice('host'), khach: voice('khach') },
        // Giọng người dẫn brand chọn rõ ràng: đọc mọi cảnh (thay script.voice); null = dùng script.voice
        narrator: VOICE.test(String(v.host ?? '')) ? v.host : null,
        hashtags: Array.isArray(b.hashtags) ? b.hashtags.filter((h) => typeof h === 'string' && /^#[A-Za-z0-9_]{2,40}$/.test(h)) : [],
    };
}

/** Chữ cái đầu của tên (avatar chữ khi không có linh vật). */
export function initial(name, fallback = '•') {
    const ch = [...String(name ?? '').trim()].find((x) => /[\p{L}\p{N}]/u.test(x));
    return ch ? ch.toLocaleUpperCase('vi') : fallback;
}

/**
 * Bảng màu dựng hình suy ra từ 4 màu brand. Mọi CSS dùng biến (--accent, --accent-rgb…); GSAP cần màu cụ thể
 * thì lấy trực tiếp từ object này (vd nền phụ đề karaoke).
 */
export function theme(brand) {
    const { primary, accent, background, text } = brand.colors;
    const t = {
        primary,
        accent,
        background,
        text,
        accentDark: mix(accent, '#000000', 0.3),
        accentLight: mix(accent, '#FFFFFF', 0.45),
        accentSoft: mix(accent, '#FFFFFF', 0.75),
        onAccent: onColor(accent),
        accentText: readableOn(accent, background),
        muted: mix(text, background, 0.25),
        glow: mix(primary, '#FFFFFF', 0.3),
        accentRgb: rgbList(accent),
        backgroundRgb: rgbList(background),
        font: brand.font.family,
    };
    t.vars = `:root {
  --primary: ${t.primary}; --accent: ${t.accent}; --bg: ${t.background}; --text: ${t.text};
  --accent-dark: ${t.accentDark}; --accent-light: ${t.accentLight}; --accent-soft: ${t.accentSoft}; --on-accent: ${t.onAccent}; --accent-text: ${t.accentText};
  --muted: ${t.muted}; --glow: ${t.glow}; --accent-rgb: ${t.accentRgb}; --bg-rgb: ${t.backgroundRgb};
  --font: '${t.font.replaceAll("'", '')}';
}`;
    return t;
}
