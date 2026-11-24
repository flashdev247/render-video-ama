// Phần dùng chung của mọi mẫu video: khung 1080×1920, nền, logo, phụ đề karaoke, cảnh hook/point/cta mặc định.
// Vùng an toàn Reels/Shorts: chữ không xuống quá y=1536 (20% dưới) và cách mép phải 180px (15%).
// Màu và font lấy từ hồ sơ brand (lib/brand.mjs → theme()): CSS chỉ dùng biến --accent, --primary, --bg, --text…,
// documentHtml() khai báo giá trị biến theo brand. Không viết cứng màu thương hiệu ở đây.

export const W = 1080;
export const H = 1920;

// Khung ảnh dự án (cửa sổ trình duyệt)
export const MEDIA = { top: 860, left: 240, width: 660, height: 480, bar: 40 };

export function esc(text) {
    return String(text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

export const js = (value) => JSON.stringify(value);

const r = (n) => Math.round(n * 1000) / 1000;

/** Tách tiêu đề thành từng từ để chạy hiệu ứng lần lượt; cụm trong *...* tô màu nhấn của brand (từ khóa). */
export function words(text, cls = 'w') {
    const out = [];
    String(text).split(/(\*[^*]+\*)/u).forEach((part) => {
        const hl = /^\*[^*]+\*$/u.test(part);
        part.replaceAll('*', '').split(/\s+/u).filter(Boolean).forEach((w) => {
            if (/^[\p{P}]+$/u.test(w) && out.length) out[out.length - 1] = out[out.length - 1].replace(/<\/span>$/u, `${esc(w)}</span>`);
            else out.push(`<span class="${cls}${hl ? ' hl' : ''}">${esc(w)}</span>`);
        });
    });
    return out.join(' ');
}

/** Bỏ dấu * đánh dấu từ khóa (dùng cho giọng đọc, phụ đề). */
export const plain = (text) => String(text ?? '').replaceAll('*', '');

export const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--bg); }
#root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: var(--font), 'Be Vietnam Pro', sans-serif; color: var(--text); }
.bg { position: absolute; inset: 0; background: linear-gradient(165deg, var(--primary) 0%, var(--bg) 70%); }
.glow { position: absolute; border-radius: 50%; filter: blur(120px); opacity: .55; }
.glow.a { width: 760px; height: 760px; background: var(--accent); left: -260px; top: -200px; opacity: .28; }
.glow.b { width: 640px; height: 640px; background: var(--glow); right: -280px; bottom: 120px; opacity: .22; }
.progress { position: absolute; left: 0; top: 0; height: 10px; width: ${W}px; background: var(--accent); transform-origin: 0 50%; transform: scaleX(0); }
.logo { position: absolute; left: 72px; top: 150px; height: 54px; max-width: 420px; object-fit: contain; object-position: left center; z-index: 3; }
.logo-text { height: auto; max-width: 640px; font-size: 44px; line-height: 54px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logo-text::before { content: ''; display: inline-block; width: 18px; height: 18px; border-radius: 6px; background: var(--accent); margin-right: 16px; vertical-align: middle; }
.scene { position: absolute; inset: 0; z-index: 1; }
.point.no-media .head { top: 250px; gap: 30px; }
.point.no-media .title { font-size: 92px; }
.point.no-media .body { font-size: 52px; }
.head { position: absolute; left: 72px; right: 180px; top: 290px; display: flex; flex-direction: column; gap: 28px; }
.title { font-size: 80px; line-height: 1.14; font-weight: 700; letter-spacing: -0.02em; }
.title .w { display: inline-block; }
.body { font-size: 44px; line-height: 1.35; color: var(--muted); }
.bar { width: 120px; height: 12px; border-radius: 6px; background: var(--accent); }
.frame { position: absolute; left: ${MEDIA.left}px; top: ${MEDIA.top}px; width: ${MEDIA.width}px; height: ${MEDIA.height}px; border-radius: 28px; overflow: hidden; background: #fff; box-shadow: 0 40px 80px rgba(0,0,0,.45); }
.frame .chrome { height: ${MEDIA.bar}px; background: #E2E8F0; display: flex; align-items: center; gap: 12px; padding-left: 22px; }
.frame .chrome i { width: 16px; height: 16px; border-radius: 50%; background: #94A3B8; display: block; }
.frame .view { position: absolute; left: 0; right: 0; top: ${MEDIA.bar}px; bottom: 0; overflow: hidden; }
.frame .view img { position: absolute; left: 0; top: 0; width: 100%; }
.hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .32; }
.hero-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(var(--bg-rgb),.55) 0%, rgba(var(--bg-rgb),.92) 75%); }
.hook .head { top: 300px; }
.hook .title { font-size: 104px; }
.badge { width: 150px; height: 150px; border-radius: 40px; background: var(--accent); color: var(--on-accent); font-size: 96px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 24px 48px rgba(var(--accent-rgb),.35); }
.cta { display: flex; flex-direction: column; align-items: center; text-align: center; }
.cta .inner { position: absolute; left: 72px; right: 180px; top: 470px; display: flex; flex-direction: column; align-items: center; gap: 44px; }
.cta .big-logo { width: 600px; max-height: 300px; object-fit: contain; }
.cta .big-logo.big-logo-text { width: auto !important; max-width: 828px; font-size: 96px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; color: var(--text); overflow-wrap: anywhere; }
.cta .title { font-size: 84px; }
.pill { display: inline-block; padding: 26px 56px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 52px; font-weight: 700; }
.cta .body { font-size: 42px; }
.title .hl { color: var(--accent-text); position: relative; }
.title .hl::after { content: ''; position: absolute; left: 0; right: 0; bottom: 4px; height: 14px; border-radius: 7px; background: var(--accent); opacity: .35; transform-origin: 0 50%; transform: scaleX(var(--u, 1)); }
.segs { position: absolute; left: 36px; right: 36px; top: 22px; display: flex; gap: 10px; z-index: 5; }
.segs i { flex: 1; height: 9px; border-radius: 5px; background: rgba(255,255,255,.22); overflow: hidden; display: block; }
.segs b { display: block; height: 100%; width: 100%; background: var(--accent); transform-origin: 0 50%; transform: scaleX(0); }
.wipe { position: absolute; left: -400px; top: -200px; width: 1880px; height: 2320px; background: linear-gradient(90deg, var(--accent), var(--accent-light)); transform: translateX(-1900px) skewX(-14deg); z-index: 6; }
.flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 6; }
.cta .inner { top: 300px !important; gap: 34px !important; }
.cta .big-logo { width: 380px !important; }
.caps { position: absolute; left: 72px; right: 180px; top: 1385px; height: 150px; z-index: 4; }
.cap { position: absolute; left: 0; right: 0; top: 0; text-align: center; font-size: 66px; line-height: 1.2; font-weight: 700; }
.cap span { display: inline-block; background-color: rgba(var(--accent-rgb),0); padding: 2px 12px; border-radius: 16px; -webkit-text-stroke: 3px #0B1020; paint-order: stroke fill; text-shadow: 0 6px 18px rgba(0,0,0,.7); }
`;

/**
 * Logo góc / logo cảnh CTA: ảnh logo của brand (render.mjs tải về work/) hoặc tên brand dạng chữ khi không có logo.
 * logo = { file: 'logo.png' | null, name: 'Tên brand' }. attrs: thuộc tính thêm (vd data-start của HyperFrames).
 */
export function logoHtml(logo, cls, attrs = '') {
    const extra = attrs ? ` ${attrs}` : '';
    if (logo?.file) return `<img class="${cls}" src="${esc(logo.file)}"${extra} />`;
    return `<div class="${cls} ${cls}-text"${extra}>${esc(logo?.name ?? '')}</div>`;
}

const hasLogo = (logo) => Boolean(logo?.file || logo?.name);

/** Nền + thanh tiến độ chia đoạn theo cảnh (kiểu Stories) + logo xuyên suốt video (không có logo lẫn tên thì bỏ). */
export function chrome(duration, logoUntil, timings = [], logo = null) {
    const segs = timings.length ? timings : [{ start: 0, dur: duration }];
    const html = `
  <div class="bg" data-start="0" data-duration="${r(duration)}"></div>
  <div class="glow a" data-start="0" data-duration="${r(duration)}"></div>
  <div class="glow b" data-start="0" data-duration="${r(duration)}"></div>
  <div class="segs" data-start="0" data-duration="${r(duration)}">${segs.map((_, i) => `<i><b id="seg${i}"></b></i>`).join('')}</div>${
      hasLogo(logo) ? `\n  ${logoHtml(logo, 'logo', `data-start="0" data-duration="${r(logoUntil)}"`)}` : ''}`;
    const tweens = [
        `tl.to(".glow.a", { x: 260, y: 180, duration: ${r(duration)}, ease: "sine.inOut" }, 0);`,
        `tl.to(".glow.b", { x: -200, y: -260, duration: ${r(duration)}, ease: "sine.inOut" }, 0);`,
        ...segs.map((t, i) => `tl.to("#seg${i}", { scaleX: 1, duration: ${r(t.dur)}, ease: "none" }, ${r(t.start)});`),
    ];
    if (hasLogo(logo)) tweens.push(`tl.from(".logo", { opacity: 0, y: -20, duration: 0.5, ease: "power2.out" }, 0.1);`);
    return { html, tweens };
}

/** Chuyển cảnh: xoay vòng dải màu nhấn quét chéo / chớp trắng + zoom; trả kèm mốc tiếng "whoosh". skip(t) = true: cảnh nối liền, không chuyển. */
export function transitions(timings, skip = () => false) {
    let html = '';
    const tweens = [];
    const sfx = [];
    timings.slice(1).forEach((t, i) => {
        if (skip(t)) return;
        const at = t.start;
        if (i % 2 === 0) {
            html += `\n  <div class="wipe" id="wp${i}" data-start="${r(at - 0.3)}" data-duration="0.62"></div>`;
            tweens.push(`tl.fromTo("#wp${i}", { x: -1900 }, { x: 1300, duration: 0.6, ease: "power2.inOut" }, ${r(at - 0.3)});`);
        } else {
            html += `\n  <div class="flash" id="fl${i}" data-start="${r(at - 0.05)}" data-duration="0.35"></div>`;
            tweens.push(`tl.fromTo("#fl${i}", { opacity: 0.85 }, { opacity: 0, duration: 0.3, ease: "power2.out" }, ${r(at - 0.05)});`);
            tweens.push(`tl.fromTo("#s${t.index}", { scale: 1.12 }, { scale: 1, duration: 0.45, ease: "power3.out" }, ${r(at)});`);
        }
        sfx.push({ name: 'whoosh', at: at - 0.3, volume: 0.32 });
    });
    return { html, tweens, sfx };
}

/** Khung trình duyệt có ảnh dự án; ảnh dài thì cuộn từ trên xuống trong suốt cảnh. */
export function frame(id, image, start, dur) {
    const viewH = MEDIA.height - MEDIA.bar;
    const imgH = image.width ? (MEDIA.width * image.height) / image.width : viewH;
    const html = `
    <div class="frame" id="${id}">
      <div class="chrome"><i></i><i></i><i></i></div>
      <div class="view"><img src="${esc(image.file)}" /></div>
    </div>`;
    const tweens = [`tl.from("#${id}", { opacity: 0, y: 80, scale: 0.94, duration: 0.6, ease: "power3.out" }, ${r(start + 0.25)});`];
    if (imgH > viewH + 40) {
        const pan = Math.min(imgH - viewH, 1800);
        tweens.push(`tl.to("#${id} .view img", { y: ${-Math.round(pan)}, duration: ${r(Math.max(dur - 1.2, 1))}, ease: "sine.inOut" }, ${r(start + 0.8)});`);
    } else {
        tweens.push(`tl.fromTo("#${id} .view img", { scale: 1 }, { scale: 1.08, duration: ${r(dur)}, ease: "none", transformOrigin: "50% 0%" }, ${r(start)});`);
    }
    return { html, tweens };
}

function head(id, scene, start, { badge = null, lead = null } = {}) {
    const first = lead ?? (badge ? `<div class="badge">${esc(badge)}</div>` : '<div class="bar"></div>');
    const html = `
    <div class="head">
      ${first}
      <div class="title">${words(scene.title)}</div>
      ${scene.body ? `<div class="body">${esc(plain(scene.body))}</div>` : ''}
    </div>`;
    const tweens = [
        `tl.from("#${id} .head > :first-child", { opacity: 0, x: -60, duration: 0.45, ease: "back.out(2)" }, ${r(start)});`,
        `tl.from("#${id} .title .w", { opacity: 0, y: 50, duration: 0.45, stagger: 0.06, ease: "power3.out" }, ${r(start + 0.1)});`,
    ];
    tweens.push(`tl.fromTo("#${id} .title .hl", { "--u": 0 }, { "--u": 1, duration: 0.4, ease: "power2.out" }, ${r(start + 0.5)});`);
    if (scene.body) tweens.push(`tl.from("#${id} .body", { opacity: 0, y: 30, duration: 0.5, ease: "power2.out" }, ${r(start + 0.5)});`);
    return { html, tweens };
}

function wrap(id, cls, start, dur, inner) {
    return `
  <div class="scene ${cls}" id="${id}" data-start="${r(start)}" data-duration="${r(dur)}">${inner}
  </div>`;
}

export function hookScene(scene, t, ctx) {
    const id = `s${t.index}`;
    const image = scene.image ? ctx.image(scene.image) : null;
    const html = `
    <div class="head">
      <div class="title">${words(scene.title)}</div>
      ${scene.body ? `<div class="body">${esc(plain(scene.body))}</div>` : ''}
    </div>`;
    const bg = image ? `<img class="hero-img" src="${esc(image.file)}" /><div class="hero-shade"></div>` : '';
    const tweens = [
        `tl.fromTo("#${id} .title", { scale: 1.18 }, { scale: 1, duration: 0.3, ease: "back.out(2.5)", transformOrigin: "0% 50%" }, ${r(t.start)});`,
        `tl.fromTo("#${id} .title", { x: -8 }, { x: 8, duration: 0.05, repeat: 5, yoyo: true, ease: "none" }, ${r(t.start + 0.3)});`,
        `tl.fromTo("#${id} .title .hl", { "--u": 0 }, { "--u": 1, duration: 0.4, ease: "power2.out" }, ${r(t.start + 0.6)});`,
    ];
    if (scene.body) tweens.push(`tl.from("#${id} .body", { opacity: 0, y: 30, duration: 0.4, ease: "power2.out" }, ${r(t.start + 0.5)});`);
    if (image) tweens.push(`tl.fromTo("#${id} .hero-img", { scale: 1.15 }, { scale: 1, duration: ${r(t.dur)}, ease: "none" }, ${r(t.start)});`);
    return { html: wrap(id, 'hook', t.start, t.dur, bg + html), tweens };
}

/** Cảnh nội dung: tiêu đề + dòng phụ + ảnh (nếu có). lead = HTML thay cho vạch màu nhấn / số thứ tự; cls = class thêm cho cảnh. */
export function pointScene(scene, t, ctx, { badge = null, lead = null, cls = '' } = {}) {
    const id = `s${t.index}`;
    const h = head(id, scene, t.start, { badge, lead });
    let html = h.html;
    const tweens = [...h.tweens];
    if (scene.image) {
        const f = frame(`${id}f`, ctx.image(scene.image), t.start, t.dur);
        html += f.html;
        tweens.push(...f.tweens);
    }
    return { html: wrap(id, `${scene.image ? 'point' : 'point no-media'} ${cls}`.trim(), t.start, t.dur, html), tweens };
}

/** Chữ trên nút CTA: nhãn riêng của video (brief.cta.label) → brand.cta_label → tên miền brand; không có thì bỏ nút. */
export function ctaLabel(ctx) {
    return ctx.brief?.cta?.label || ctx.brand?.ctaLabel || ctx.brand?.host || '';
}

export function ctaScene(scene, t, ctx) {
    const id = `s${t.index}`;
    const label = ctaLabel(ctx);
    const html = `
    <div class="inner">
      ${hasLogo(ctx.logo) ? logoHtml(ctx.logo, 'big-logo') : ''}
      <div class="title">${words(scene.title)}</div>
      ${label ? `<div class="pill">${esc(label)}</div>` : ''}
      ${scene.body ? `<div class="body">${esc(scene.body)}</div>` : ''}
    </div>`;
    const tweens = [`tl.from("#${id} .title .w", { opacity: 0, y: 40, duration: 0.4, stagger: 0.06, ease: "power3.out" }, ${r(t.start + 0.3)});`];
    if (hasLogo(ctx.logo)) tweens.unshift(`tl.from("#${id} .big-logo", { opacity: 0, scale: 0.8, duration: 0.6, ease: "back.out(1.8)" }, ${r(t.start)});`);
    if (label) {
        tweens.push(
            `tl.from("#${id} .pill", { opacity: 0, scale: 0.6, duration: 0.5, ease: "back.out(2)" }, ${r(t.start + 0.7)});`,
            `tl.to("#${id} .pill", { scale: 1.06, duration: 0.5, yoyo: true, repeat: ${Math.max(1, Math.floor((t.dur - 1.4) / 0.5))}, ease: "sine.inOut" }, ${r(t.start + 1.2)});`,
        );
    }
    if (scene.body) tweens.push(`tl.from("#${id} .body", { opacity: 0, duration: 0.5 }, ${r(t.start + 0.9)});`);
    return { html: wrap(id, 'cta', t.start, t.dur, html), tweens };
}

/**
 * Phụ đề kiểu TikTok: cụm ngắn ≤ 16 ký tự (2–4 từ) "bật" vào, từ đang đọc có nền màu nhấn của brand.
 * timings[i] = { start, dur, voiceAt, words: [{t, d, w}] } (t tính từ đầu file giọng của cảnh).
 * theme: lib/brand.mjs → theme() (GSAP cần màu cụ thể, không đọc được biến CSS).
 */
export function captions(timings, theme) {
    const on = `rgba(${theme.accentRgb},1)`;
    const off = `rgba(${theme.accentRgb},0)`;
    let html = '';
    const tweens = [];
    let n = 0;
    for (const t of timings) {
        const chunks = [];
        let cur = [];
        for (const w of t.words) {
            const len = cur.reduce((s, x) => s + x.w.length + 1, 0);
            if (cur.length && (len + w.w.length > 16 || cur.length >= 4)) {
                chunks.push(cur);
                cur = [];
            }
            cur.push(w);
        }
        if (cur.length) chunks.push(cur);

        const sceneEnd = t.start + t.dur;
        chunks.forEach((chunk, ci) => {
            const begin = t.start + t.voiceAt + chunk[0].t;
            const next = chunks[ci + 1];
            const last = chunk.at(-1);
            const end = next ? t.start + t.voiceAt + next[0].t : Math.min(t.start + t.voiceAt + last.t + last.d + 0.35, sceneEnd);
            const id = `c${n++}`;
            html += `\n  <div class="cap" id="${id}" data-start="${r(begin)}" data-duration="${r(Math.max(end - begin, 0.2))}">${chunk
                .map((w) => `<span>${esc(w.w)}</span>`)
                .join(' ')}</div>`;
            tweens.push(`tl.fromTo("#${id}", { scale: 0.7, y: 20 }, { scale: 1, y: 0, duration: 0.18, ease: "back.out(3)" }, ${r(begin)});`);
            chunk.forEach((w, wi) => {
                const at = t.start + t.voiceAt + w.t;
                // Tắt nền màu nhấn khi từ kế tiếp bắt đầu (edge-tts có khi tính cả khoảng lặng vào độ dài từ)
                const nextW = chunk[wi + 1];
                const off = nextW ? Math.min(Math.max(w.d, 0.14), nextW.t - w.t - 0.02) : Math.max(w.d, 0.14);
                const sel = `#${id} span:nth-child(${wi + 1})`;
                tweens.push(`tl.fromTo("${sel}", { backgroundColor: "${off}", scale: 1 }, { backgroundColor: "${on}", scale: 1.08, duration: 0.06, immediateRender: false }, ${r(at)});`);
                tweens.push(`tl.fromTo("${sel}", { backgroundColor: "${on}", scale: 1.08 }, { backgroundColor: "${off}", scale: 1, duration: 0.06, immediateRender: false }, ${r(at + Math.max(off, 0.08))});`);
            });
        });
    }
    return { html: `\n  <div class="caps">${html}\n  </div>`, tweens };
}

/** Font đóng gói luôn khai báo (mockup trong quiz-ab / web-build dùng), cộng font của brand nếu khác. */
function fontFaces(font) {
    const faces = [{ family: 'Be Vietnam Pro', regular: 'BeVietnamPro-Regular.ttf', bold: 'BeVietnamPro-Bold.ttf' }];
    if (font && font.family !== 'Be Vietnam Pro') faces.push(font);
    return faces.map((f) => `
@font-face { font-family: '${f.family}'; font-weight: 400; src: url('fonts/${f.regular}'); }
@font-face { font-family: '${f.family}'; font-weight: 700; src: url('fonts/${f.bold}'); }`).join('');
}

/** theme: lib/brand.mjs → theme() (giá trị biến CSS màu), font: brand.font ({ family, regular, bold }). */
export function documentHtml({ duration, css, rootClass = '', body, tweens, theme, font }) {
    return `<!doctype html>
<html lang="vi" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="gsap.min.js"></script>
<style>${fontFaces(font)}
${theme.vars}
${CSS}${css ?? ''}</style>
</head>
<body>
<div id="root" class="${esc(rootClass)}" data-composition-id="main" data-start="0" data-duration="${r(duration)}" data-width="${W}" data-height="${H}">${body}
</div>
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
${tweens.join('\n')}
window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
}
