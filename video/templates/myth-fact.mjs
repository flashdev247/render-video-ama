// Hiểu lầm vs Sự thật: con dấu đỏ "HIỂU LẦM" đập xuống + gạch ngang câu sai, rồi con dấu xanh "SỰ THẬT".
// Ảnh (nếu có, minh họa AI từ brief) làm nền mờ phía sau.
import { ctaScene, esc, hookScene, pointScene } from './base.mjs';

export const css = `
.stamp { display: inline-block; align-self: flex-start; padding: 10px 30px; border: 8px solid; border-radius: 18px; font-size: 64px; font-weight: 700; letter-spacing: .08em; transform: rotate(-7deg); }
.myth .stamp { color: #F87171; border-color: #F87171; background: rgba(220,38,38,.12); }
.fact .stamp { color: #4ADE80; border-color: #4ADE80; background: rgba(22,163,74,.12); transform: rotate(5deg); }
.myth .title { position: relative; }
.myth .title::before { content: ''; position: absolute; left: -10px; right: -10px; top: 52%; height: 12px; border-radius: 6px; background: #F87171; transform-origin: 0 50%; transform: scaleX(var(--strike, 0)); z-index: 2; }
.myth .title .hl { color: #FCA5A5; }
.mf-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .22; }
.mf-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(var(--bg-rgb),.6) 0%, rgba(var(--bg-rgb),.95) 70%); }
`;

function background(scene, ctx) {
    if (!scene.image) return '';
    const img = ctx.image(scene.image);
    return `<img class="mf-bg" src="${esc(img.file)}" /><div class="mf-shade"></div>`;
}

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);
    const id = `s${t.index}`;
    if (scene.type === 'myth' || scene.type === 'fact') {
        const myth = scene.type === 'myth';
        // Ảnh làm nền mờ, không vào khung trình duyệt (ảnh minh họa, không phải sản phẩm)
        const p = pointScene({ ...scene, image: null }, t, ctx, { cls: scene.type, lead: `<div class="stamp">${myth ? 'HIỂU LẦM' : 'SỰ THẬT'}</div>` });
        p.html = p.html.replace('>', `>\n    ${background(scene, ctx)}`);
        p.tweens.push(`tl.fromTo("#${id} .stamp", { scale: 2.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: "power4.in" }, ${t.start + 0.5});`);
        p.tweens.push(`tl.fromTo("#${id} .head", { y: 0 }, { y: 8, duration: 0.05, repeat: 3, yoyo: true, ease: "none" }, ${t.start + 0.78});`);
        if (myth) p.tweens.push(`tl.fromTo("#${id} .title", { "--strike": 0 }, { "--strike": 1, duration: 0.35, ease: "power2.out" }, ${t.start + 0.85});`);
        if (scene.image) p.tweens.push(`tl.fromTo("#${id} .mf-bg", { scale: 1.12 }, { scale: 1, duration: ${t.dur}, ease: "none" }, ${t.start});`);
        p.sfx = [{ name: myth ? 'hit' : 'ding', at: t.start + 0.76, volume: myth ? 0.38 : 0.28 }];
        return p;
    }
    return pointScene(scene, t, ctx);
}
