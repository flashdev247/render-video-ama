// Linh vật "tia" (brand.mascot = "tia"): tia chớp có mắt, miệng, tay, chân. Vẽ bằng SVG, mọi biểu cảm / tư thế
// nằm sẵn trong một hình, GSAP bật tắt từng nhóm theo thời gian: nhép miệng theo từng từ giọng đọc, chớp mắt,
// đổi tư thế theo cảnh, nhún nhảy. Bố cục: hook / point không ảnh đứng góc trái dưới, cảnh có ảnh đứng nhỏ bên trái
// khung ảnh, CTA đứng giữa to. Thân, viền, tia lửa tô theo màu brand qua biến CSS (--accent, --accent-light,
// --accent-soft, --accent-dark do documentHtml() khai báo); các màu còn lại (mắt, miệng, tay chân) trung tính.
// brand.mascot = "none" (mặc định): render.mjs không vẽ linh vật.

// Màu trung tính (không phải màu thương hiệu)
const C = {
    ink: '#1C1410',
    mouth: '#5B1D12',
    tongue: '#FB7185',
    limb: '#1F2430',
    limbEdge: '#4A5162',
    blush: '#FB7185',
};

export const MASCOT_W = 380; // px trên khung 1080×1920 (viewBox 400×580)
const MASCOT_H = Math.round((MASCOT_W * 580) / 400);
const r = (n) => Math.round(n * 1000) / 1000;

const BODY = 'M272 28 L118 304 L210 304 L166 500 L340 208 L248 208 L316 28 Z';

function eye(x, y, rr) {
    return `<ellipse cx="${x}" cy="${y}" rx="${rr * 0.86}" ry="${rr}" fill="url(#tEye)"/>
      <circle cx="${x + rr * 0.28}" cy="${y - rr * 0.36}" r="${rr * 0.3}" fill="#fff"/>
      <circle cx="${x - rr * 0.3}" cy="${y + rr * 0.38}" r="${rr * 0.14}" fill="#fff" opacity=".85"/>`;
}
const pair = (f) => f(192) + f(252);
const EYES = {
    normal: pair((x) => eye(x, 252, 22)),
    wide: pair((x) => eye(x, 249, 26)),
    look: pair((x) => eye(x + 6, 246, 21)),
    happy: pair((x) => `<path d="M${x - 18} 258 Q${x} 232 ${x + 18} 258" class="ln" stroke-width="8"/>`),
    closed: pair((x) => `<path d="M${x - 18} 252 Q${x} 266 ${x + 18} 252" class="ln" stroke-width="7"/>`),
    wink: eye(192, 252, 22) + `<path d="M234 256 Q252 238 270 256" class="ln" stroke-width="8"/>`,
};
const BROWS = {
    normal: ['M168 216 Q184 208 200 214', 'M234 214 Q250 208 266 216'],
    raised: ['M168 206 Q184 194 200 202', 'M234 202 Q250 194 266 206'],
    serious: ['M168 210 Q186 214 202 222', 'M232 222 Q248 214 266 210'],
    curious: ['M168 216 Q184 210 200 214', 'M234 204 Q250 194 266 204'],
};
const MOUTHS = {
    smile: `<path d="M212 290 Q225 302 238 290" class="ln" stroke-width="5"/>`,
    closed: `<path d="M216 294 Q225 298 234 294" class="ln" stroke-width="5"/>`,
    half: `<path d="M212 286 Q225 284 238 286 Q234 302 225 302 Q216 302 212 286 Z" fill="${C.mouth}"/>`,
    open: `<path d="M208 282 Q225 278 242 282 Q238 312 225 312 Q212 312 208 282 Z" fill="${C.mouth}"/>
      <path d="M214 304 Q225 296 236 304 Q232 312 225 312 Q218 312 214 304 Z" fill="${C.tongue}"/>`,
    grin: `<path d="M202 280 Q225 274 248 280 Q244 316 225 316 Q206 316 202 280 Z" fill="${C.mouth}"/>
      <path d="M212 308 Q225 298 238 308 Q234 316 225 316 Q216 316 212 308 Z" fill="${C.tongue}"/>`,
    o: `<ellipse cx="225" cy="298" rx="11" ry="14" fill="${C.mouth}"/>`,
    frown: `<path d="M213 300 Q225 290 237 300" class="ln" stroke-width="5"/>`,
};

// Tay: vai trái (140,300), vai phải (326,228)
const arm = (d) => `<path d="${d}" fill="none" stroke="${C.limbEdge}" stroke-width="17" stroke-linecap="round"/>
  <path d="${d}" fill="none" stroke="${C.limb}" stroke-width="11" stroke-linecap="round"/>`;
const glove = (x, y, rr = 17) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" stroke="${C.limbEdge}" stroke-width="4"/>`;
const fingerG = (x, y, w, h, rot = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="#fff" stroke="${C.limbEdge}" stroke-width="4" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"/>`;
const sparks = (x, y) => `<path d="M${x} ${y} l14 -12 M${x + 8} ${y + 30} l18 0 M${x} ${y + 60} l14 12" style="stroke: var(--accent-light)" stroke-width="5" stroke-linecap="round"/>`;
const palmG = (x, y) => glove(x, y) + fingerG(x - 15, y - 33, 11, 24, -16) + fingerG(x - 2, y - 38, 11, 26, 0) + fingerG(x + 11, y - 33, 11, 24, 16);
const fistG = (x, y) => `<rect x="${x - 20}" y="${y - 16}" width="40" height="32" rx="14" fill="#fff" stroke="${C.limbEdge}" stroke-width="4"/>
  <path d="M${x + 2} ${y - 6} h13 M${x + 2} ${y + 3} h13" stroke="${C.limbEdge}" stroke-width="3" stroke-linecap="round"/>
  <rect x="${x - 20}" y="${y - 48}" width="16" height="38" rx="8" fill="#fff" stroke="${C.limbEdge}" stroke-width="4" transform="rotate(-12 ${x - 12} ${y - 16})"/>`;
const L_DOWN = arm('M140 300 Q104 330 104 372') + glove(104, 378);
const ARMS = {
    idle: L_DOWN + arm('M326 228 Q362 262 360 306') + glove(360, 312),
    wave: L_DOWN + arm('M326 226 Q370 212 376 168') + palmG(378, 158) + sparks(404, 116),
    point: L_DOWN + arm('M326 230 Q364 238 394 224') + glove(400, 222) + fingerG(402, 211, 34, 12),
    thumbs: L_DOWN + arm('M326 230 Q366 246 370 222') + fistG(380, 214) + sparks(410, 150),
    surprised: arm('M140 300 Q104 278 124 238') + palmG(126, 230) + arm('M326 226 Q362 206 346 176') + palmG(346, 168),
    think: L_DOWN + arm('M326 232 Q318 290 262 312') + glove(256, 314, 15),
    explain: arm('M140 300 Q104 326 92 326') + `<ellipse cx="86" cy="328" rx="20" ry="13" fill="#fff" stroke="${C.limbEdge}" stroke-width="4"/>` +
        arm('M326 230 Q362 262 376 262') + `<ellipse cx="382" cy="264" rx="20" ry="13" fill="#fff" stroke="${C.limbEdge}" stroke-width="4"/>`,
    cheer: arm('M140 298 Q102 250 110 204') + glove(110, 196, 19) + arm('M326 224 Q364 178 360 138') + glove(360, 130, 19),
    stop: L_DOWN + arm('M326 230 Q370 246 384 200') + palmG(386, 190),
};

// Biểu cảm theo trường "mood" của cảnh (Claude chọn); thiếu thì tự chọn theo loại cảnh
export const MOODS = {
    surprised: { pose: 'surprised', eyes: 'wide', brows: 'raised', idle: 'o' },
    explain: { pose: 'explain', eyes: 'normal', brows: 'normal', idle: 'smile' },
    think: { pose: 'think', eyes: 'look', brows: 'curious', idle: 'closed' },
    happy: { pose: 'cheer', eyes: 'happy', brows: 'raised', idle: 'grin' },
    serious: { pose: 'stop', eyes: 'normal', brows: 'serious', idle: 'frown' },
    point: { pose: 'point', eyes: 'normal', brows: 'normal', idle: 'smile' },
};

/** Tư thế + biểu cảm cho cảnh. Cảnh có ảnh / lời khách: linh vật đứng nhỏ cạnh nên luôn chỉ tay vào nội dung. */
function acting(scene, i, small) {
    const auto = {
        hook: 'surprised',
        cta: 'happy',
        quote: 'happy',
        before: 'serious',
        after: 'happy',
        myth: 'serious',
        fact: 'happy',
        build: 'explain',
        choice: 'think',
        answer: 'happy',
    }[scene.type] ?? (small ? 'point' : ['explain', 'think', 'point'][i % 3]);
    const mood = MOODS[scene.mood] ? scene.mood : auto;
    const a = { ...MOODS[mood], mood };
    if (small && !['choice', 'answer'].includes(scene.type)) a.pose = 'point';
    if (scene.type === 'cta') return { ...a, pose: 'thumbs', idle: 'grin', end: { pose: 'cheer', eyes: 'happy' } };
    return a;
}

/** Vị trí linh vật theo cảnh: x, y góc trên trái (px), scale. */
function placement(scene, small) {
    if (scene.type === 'cta') return { x: 540 - (MASCOT_W * 0.85) / 2 - 30, y: 880, s: 0.85 };
    if (scene.type === 'quote') return { x: -20, y: 1150, s: 0.48 }; // dưới khung lời khách
    if (scene.type === 'choice' || scene.type === 'answer') return { x: 440, y: 1170, s: 0.4 }; // giữa, dưới 2 khung A/B
    if (scene.type === 'msg') return { x: -460, y: 1100, s: 0.5 }; // khung chat có avatar người dẫn riêng: linh vật lớn ra khỏi khung hình
    if (small) return { x: -30, y: 1060, s: 0.56 };
    return { x: 20, y: 930, s: 0.82 };
}

/** Khẩu hình theo nguyên âm chính của từ (bỏ dấu tiếng Việt). */
function mouthFor(word, d) {
    const w = word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (/[ou]/.test(w) && d > 0.12) return 'o';
    if (/a/.test(w) && d > 0.1) return 'open';
    return d > 0.22 ? 'open' : 'half';
}

/**
 * timings: [{ index, start, dur, voiceAt, words }], scenes: kịch bản. Trả { html, tweens, sfx: [{name, at, volume}] }.
 */
export function mascot(timings, scenes, { hasImage = () => false } = {}) {
    const small = (scene) => scene.type === 'quote' || hasImage(scene);
    const a0 = acting(scenes[0], 0, small(scenes[0]));
    const on = (group, key) => ({ eyes: a0.eyes, brows: a0.brows, mouth: a0.idle, arms: a0.pose })[group] === key ? 1 : 0;
    const p0 = placement(scenes[0], small(scenes[0]));
    const svg = `
  <div class="tia" id="tia" style="transform: translate(${p0.x}px, ${p0.y}px) scale(${p0.s})">
    <div class="tia-inner">
    <svg viewBox="40 0 400 580" width="${MASCOT_W}" height="${MASCOT_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color: var(--accent-soft)"/><stop offset=".55" style="stop-color: var(--accent-light)"/><stop offset="1" style="stop-color: var(--accent)"/></linearGradient>
        <radialGradient id="tEye" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#4A2A18"/><stop offset="1" stop-color="#1A0E08"/></radialGradient>
        <radialGradient id="tGlow"><stop offset="0" style="stop-color: var(--accent-light)" stop-opacity=".55"/><stop offset="1" style="stop-color: var(--accent-light)" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse class="t-glow" cx="225" cy="260" rx="190" ry="230" fill="url(#tGlow)" opacity="0"/>
      <ellipse class="t-shadow" cx="215" cy="562" rx="96" ry="12" fill="#000" opacity=".3"/>
      <g class="t-legs">
        <path d="M182 470 Q176 512 168 534" fill="none" stroke="${C.limbEdge}" stroke-width="17" stroke-linecap="round"/>
        <path d="M182 470 Q176 512 168 534" fill="none" stroke="${C.limb}" stroke-width="11" stroke-linecap="round"/>
        <path d="M196 448 Q236 500 250 532" fill="none" stroke="${C.limbEdge}" stroke-width="17" stroke-linecap="round"/>
        <path d="M196 448 Q236 500 250 532" fill="none" stroke="${C.limb}" stroke-width="11" stroke-linecap="round"/>
        <path d="M132 552 Q130 528 152 524 L176 524 Q190 528 190 552 Z" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
        <path d="M130 544 L192 544 L192 552 Q160 558 130 552 Z" style="fill: var(--accent)"/>
        <path d="M234 552 Q232 528 254 524 L278 524 Q292 528 292 552 Z" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
        <path d="M232 544 L294 544 L294 552 Q262 558 232 552 Z" style="fill: var(--accent)"/>
      </g>
      <g class="t-body">
        <path d="${BODY}" fill="url(#tBody)" style="stroke: var(--accent-dark)" stroke-width="10" stroke-linejoin="round"/>
        <path d="M268 54 L178 230" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".45"/>
        <ellipse cx="166" cy="282" rx="15" ry="8" fill="${C.blush}" opacity=".5"/>
        <ellipse cx="282" cy="278" rx="15" ry="8" fill="${C.blush}" opacity=".5"/>
        ${Object.entries(EYES).map(([k, v]) => `<g class="t-eyes t-eyes-${k}" opacity="${on('eyes', k)}">${v}</g>`).join('')}
        ${Object.entries(BROWS).map(([k, [a, b]]) => `<g class="t-brows t-brows-${k}" opacity="${on('brows', k)}"><path d="${a}" class="ln" stroke-width="6"/><path d="${b}" class="ln" stroke-width="6"/></g>`).join('')}
        ${Object.entries(MOUTHS).map(([k, v]) => `<g class="t-mouth t-mouth-${k}" opacity="${on('mouth', k)}">${v}</g>`).join('')}
      </g>
      ${Object.entries(ARMS).map(([k, v]) => `<g class="t-arms t-arms-${k}" opacity="${on('arms', k)}">${v}</g>`).join('')}
    </svg>
    </div>
  </div>`;

    const tweens = [];
    const sfx = [];
    const show = (group, key, at) => {
        tweens.push(`tl.set("#tia .t-${group}", { opacity: 0 }, ${r(at)});`);
        tweens.push(`tl.set("#tia .t-${group}-${key}", { opacity: 1 }, ${r(at)});`);
    };

    // Vào màn hình: bật lên từ dưới kèm tiếng "zap"
    const first = timings[0];
    tweens.push(`tl.fromTo("#tia .tia-inner", { y: 420, scaleY: 1.25, scaleX: 0.8 }, { y: 0, scaleY: 1, scaleX: 1, duration: 0.55, ease: "back.out(1.7)" }, 0.15);`);
    tweens.push(`tl.fromTo("#tia .t-glow", { opacity: 0.9 }, { opacity: 0, duration: 0.6 }, 0.35);`);
    sfx.push({ name: 'zap', at: 0.18, volume: 0.35 });

    let blinkAt = 1.6;
    timings.forEach((t, i) => {
        const scene = scenes[i];
        const sm = small(scene);
        const a = acting(scene, i, sm);
        const p = placement(scene, sm);
        const at = t.start;
        // Đổi vị trí / cỡ (cảnh đầu đặt ngay, cảnh sau nhảy sang)
        if (i > 0) {
            tweens.push(`tl.to("#tia", { x: ${p.x}, y: ${p.y}, scale: ${p.s}, duration: 0.45, ease: "back.inOut(1.4)" }, ${r(at - 0.1)});`);
            tweens.push(`tl.fromTo("#tia .tia-inner", { scaleY: 0.86, scaleX: 1.1 }, { scaleY: 1, scaleX: 1, duration: 0.35, ease: "elastic.out(1, 0.5)" }, ${r(at + 0.3)});`);
        }
        if (i > 0) {
            show('arms', a.pose, at);
            show('eyes', a.eyes, at);
            show('brows', a.brows, at);
            show('mouth', a.idle, at);
        }
        if (a.pose === 'thumbs' || a.pose === 'cheer') sfx.push({ name: 'pop', at: at + 0.3, volume: 0.3 });
        if (a.mood === 'serious') tweens.push(`tl.fromTo("#tia .t-body", { rotation: -6 }, { rotation: 6, duration: 0.12, repeat: 3, yoyo: true, ease: "sine.inOut", svgOrigin: "225 260" }, ${r(at + 0.25)});`);

        // Nhép miệng theo từng từ, xong câu về khẩu hình nghỉ của cảnh
        const base = at + t.voiceAt;
        t.words.forEach((w, wi) => {
            const next = t.words[wi + 1];
            const len = next ? Math.min(w.d * 0.7, next.t - w.t - 0.04) : w.d * 0.7;
            show('mouth', mouthFor(w.w, w.d), base + w.t);
            show('mouth', 'closed', base + w.t + Math.max(len, 0.06));
        });
        const last = t.words.at(-1);
        if (last) show('mouth', a.idle, base + last.t + last.d + 0.05);

        // Chớp mắt khoảng mỗi 3 giây (không chớp khi mắt đang cười)
        const sceneEnd = at + t.dur;
        while (blinkAt < sceneEnd - 0.2) {
            if (blinkAt > at + 0.3 && a.eyes !== 'happy') {
                show('eyes', 'closed', blinkAt);
                show('eyes', a.eyes, blinkAt + 0.12);
            }
            blinkAt += 2.6 + ((i * 7 + Math.round(blinkAt * 10)) % 9) / 10;
        }

        // Cuối CTA: giơ hai tay ăn mừng
        if (a.end) {
            const endAt = Math.max(sceneEnd - 1.1, at + 0.8);
            show('arms', a.end.pose, endAt);
            show('eyes', a.end.eyes, endAt);
            show('mouth', 'grin', endAt);
            tweens.push(`tl.fromTo("#tia .tia-inner", { y: 0 }, { y: -60, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }, ${r(endAt)});`);
            tweens.push(`tl.fromTo("#tia .t-glow", { opacity: 0.8 }, { opacity: 0, duration: 0.6 }, ${r(endAt)});`);
            sfx.push({ name: 'ding', at: endAt, volume: 0.3 });
        }
    });

    // Nhún nhẹ liên tục và nghiêng theo nhịp
    const total = timings.at(-1).start + timings.at(-1).dur;
    const bobs = Math.max(1, Math.floor((total - 0.8) / 0.5));
    tweens.push(`tl.to("#tia svg", { y: -10, duration: 0.5, yoyo: true, repeat: ${bobs}, ease: "sine.inOut" }, 0.8);`);
    tweens.push(`tl.to("#tia svg", { rotation: 3, duration: 1.3, yoyo: true, repeat: ${Math.max(1, Math.floor((total - 0.8) / 1.3))}, ease: "sine.inOut", transformOrigin: "50% 95%" }, 0.8);`);

    return { html: svg, tweens, sfx };
}

export const MASCOT_CSS = `
.tia { position: absolute; left: 0; top: 0; width: ${MASCOT_W}px; height: ${MASCOT_H}px; z-index: 3; transform-origin: 0 0; }
.tia-inner { width: 100%; height: 100%; transform-origin: 50% 100%; }
.tia svg { display: block; overflow: visible; }
.tia .ln { fill: none; stroke: ${C.ink}; stroke-linecap: round; stroke-linejoin: round; }
`;
