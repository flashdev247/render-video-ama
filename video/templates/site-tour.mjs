// Quay màn hình web thật: ảnh chụp toàn trang (scripts/capture.mjs, khung điện thoại 390×844) cuộn trong khung điện
// thoại, mỗi cảnh "tour" cuộn tới một chữ có thật trên trang, khung màu nhấn bao quanh, con trỏ di tới và (action "tap")
// bấm kèm vòng sóng + tiếng click. Không bấm thật nên không rời trang.
import { ctaScene, esc, hookScene, words } from './base.mjs';

const r = (n) => Math.round(n * 1000) / 1000;

// Màn hình điện thoại trong video (px trên khung 1080×1920), tỉ lệ đúng khung chụp 390×844
const SCREEN = { left: 304, top: 390, width: 452, height: Math.round((452 * 844) / 390) };
const K = SCREEN.width / 390;
const VIEW_H = 844;

export const css = `
.st-title { position: absolute; left: 72px; right: 180px; top: 214px; font-size: 56px; line-height: 1.15; font-weight: 700; }
.st-title .w { display: inline-block; }
.st-phone { position: absolute; left: ${SCREEN.left}px; top: ${SCREEN.top}px; width: ${SCREEN.width}px; height: ${SCREEN.height}px; border-radius: 40px; overflow: hidden; background: #fff; box-shadow: 0 0 0 14px #0F172A, 0 0 0 17px #334155, 0 40px 90px rgba(0,0,0,.55); }
.st-phone .notch { position: absolute; left: 50%; top: 10px; width: 120px; height: 30px; margin-left: -60px; border-radius: 16px; background: #0F172A; z-index: 3; }
.st-page { position: absolute; left: 0; top: 0; width: ${SCREEN.width}px; }
.st-box { position: absolute; border: 6px solid var(--accent); border-radius: 14px; box-shadow: 0 0 0 9999px rgba(15,23,42,.28); z-index: 2; opacity: 0; }
.st-cursor { position: absolute; left: 0; top: 0; width: 72px; height: 72px; z-index: 4; opacity: 0; filter: drop-shadow(0 6px 10px rgba(0,0,0,.45)); }
.st-ripple { position: absolute; width: 90px; height: 90px; margin: -45px 0 0 -45px; border-radius: 50%; border: 6px solid var(--accent); background: rgba(var(--accent-rgb),.25); z-index: 3; opacity: 0; }
`;

const CURSOR = `<svg class="st-cursor" viewBox="0 0 24 24"><path d="M9 11.2V4.5a1.5 1.5 0 0 1 3 0v5.6l.6-.1a1.5 1.5 0 0 1 1.7 1.1 1.5 1.5 0 0 1 2.4.9 1.5 1.5 0 0 1 2.3 1.3V17a5 5 0 0 1-5 5h-1.6a5 5 0 0 1-4-2L4.9 15.6a1.5 1.5 0 0 1 2.2-2L9 15.3z" fill="#fff" stroke="#0F172A" stroke-width="1.3" stroke-linejoin="round"/></svg>`;

/** Vị trí cuộn (px CSS) cho từng cảnh tour: chữ cần chỉ nằm ở 1/3 màn hình; không tìm thấy chữ thì cuộn đều theo thứ tự. */
export function scrolls(scenes, tour) {
    const tours = scenes.filter((s) => s.type === 'tour');
    const max = Math.max(0, tour.height - VIEW_H);
    return tours.map((s, j) => {
        const rect = tour.points[j]?.rect;
        return rect ? Math.round(Math.max(0, Math.min(rect.y - VIEW_H * 0.32, max))) : Math.round((max * (j + 1)) / (tours.length + 1));
    });
}

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);

    const tour = ctx.tour;
    const id = `s${t.index}`;
    const j = ctx.script.scenes.slice(0, t.index).filter((s) => s.type === 'tour').length;
    const all = scrolls(ctx.script.scenes, tour);
    const to = all[j];
    const from = j > 0 ? all[j - 1] : 0;
    const rect = tour.points[j]?.rect ?? null;

    // Khung màu nhấn quanh chữ (tọa độ trong màn hình điện thoại, kẹp trong màn hình)
    let box = '';
    let cx = 0;
    let cy = 0;
    if (rect) {
        const x = Math.max(4, rect.x * K - 8);
        const y = Math.max(4, (rect.y - to) * K - 8);
        const w = Math.min(SCREEN.width - x - 4, rect.w * K + 16);
        const h = Math.min(SCREEN.height - y - 4, rect.h * K + 16);
        box = `<div class="st-box" style="left:${r(x)}px;top:${r(y)}px;width:${r(w)}px;height:${r(h)}px"></div>`;
        cx = SCREEN.left + x + w / 2;
        cy = SCREEN.top + y + Math.min(h / 2, 60);
    }

    const html = `
  <div class="scene tour" id="${id}" data-start="${r(t.start)}" data-duration="${r(t.dur)}">
    <div class="st-title">${words(scene.title)}</div>
    <div class="st-phone"><div class="notch"></div><img class="st-page" src="${esc(tour.file)}" />${box}</div>
    ${rect ? `<div class="st-ripple" style="left:${r(cx)}px;top:${r(cy)}px"></div>${CURSOR}` : ''}
  </div>`;

    const scrollAt = t.start + 0.25;
    const pointAt = scrollAt + 1.05;
    const tweens = [
        `tl.from("#${id} .st-title .w", { opacity: 0, y: 40, duration: 0.4, stagger: 0.05, ease: "power3.out" }, ${r(t.start)});`,
        `tl.fromTo("#${id} .st-page", { y: ${r(-from * K)} }, { y: ${r(-to * K)}, duration: 1, ease: "power2.inOut" }, ${r(scrollAt)});`,
    ];
    if (j === 0) tweens.push(`tl.from("#${id} .st-phone", { opacity: 0, y: 120, scale: 0.92, duration: 0.5, ease: "power3.out" }, ${r(t.start)});`);
    const sfx = [];
    if (rect) {
        // Con trỏ đi từ dưới màn hình lên chữ, khung màu nhấn hiện; "tap" thì nhấn + vòng sóng + tiếng click
        tweens.push(
            `tl.fromTo("#${id} .st-cursor", { opacity: 0, x: ${r(SCREEN.left + SCREEN.width * 0.7)}, y: ${r(SCREEN.top + SCREEN.height * 0.9)} }, { opacity: 1, x: ${r(cx - 18)}, y: ${r(cy - 6)}, duration: 0.55, ease: "power2.out" }, ${r(pointAt - 0.35)});`,
            `tl.fromTo("#${id} .st-box", { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, ${r(pointAt + 0.2)});`,
        );
        if (scene.action === 'tap') {
            const tap = pointAt + 0.3;
            tweens.push(
                `tl.to("#${id} .st-cursor", { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, ${r(tap)});`,
                `tl.fromTo("#${id} .st-ripple", { opacity: 1, scale: 0.2 }, { opacity: 0, scale: 2.4, duration: 0.6, ease: "power2.out" }, ${r(tap + 0.05)});`,
            );
            sfx.push({ name: 'click', at: tap + 0.05, volume: 0.5 });
        }
    }
    sfx.push({ name: 'whoosh', at: scrollAt, volume: 0.12 });
    return { html, tweens, sfx };
}
