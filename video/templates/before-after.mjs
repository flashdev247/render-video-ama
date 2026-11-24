// Trước / Sau: vấn đề cũ của khách (nền xám lạnh, dấu ✗ đỏ, rung nhiễu) → giải pháp của brand (ảnh thật, dấu ✓ xanh).
// Nhãn mặc định "TRƯỚC ĐÂY" / "BÂY GIỜ"; brief.labels.before / brief.labels.after (tùy chọn) để đổi chữ.
import { ctaScene, esc, hookScene, pointScene } from './base.mjs';

const ICON = {
    x: '<svg viewBox="0 0 24 24" width="78" height="78"><path d="M6 6 L18 18 M18 6 L6 18" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="82" height="82"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export const css = `
.ba-tag { display: inline-flex; align-items: center; gap: 18px; font-size: 44px; font-weight: 700; letter-spacing: .06em; }
.ba-tag i { width: 112px; height: 112px; border-radius: 32px; display: flex; align-items: center; justify-content: center; }
.before .ba-tag i { background: #DC2626; box-shadow: 0 20px 40px rgba(220,38,38,.35); }
.after .ba-tag i { background: #16A34A; box-shadow: 0 20px 40px rgba(22,163,74,.35); }
.before .ba-tag { color: #FCA5A5; } .after .ba-tag { color: #86EFAC; }
.ba-grey { position: absolute; inset: 0; background: linear-gradient(165deg, #2B3240 0%, #151A23 75%); }
.before .title, .before .body { color: #D1D5DB; }
.before .title .hl { color: #F87171; }
.before .title .hl::after { background: #F87171; }
.ba-reveal { position: absolute; inset: 0; background: linear-gradient(165deg, #2B3240 0%, #151A23 75%); z-index: 0; transform-origin: 100% 50%; }
.after .head, .after .frame { z-index: 1; }
`;

const label = (ctx, key, def) => String(ctx.brief?.labels?.[key] ?? '').trim().slice(0, 28) || def;

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);
    const id = `s${t.index}`;
    if (scene.type === 'before') {
        const p = pointScene(scene, t, ctx, { cls: 'before', lead: `<div class="ba-tag"><i>${ICON.x}</i>${esc(label(ctx, 'before', 'TRƯỚC ĐÂY'))}</div>` });
        p.html = p.html.replace('>', '>\n    <div class="ba-grey"></div>');
        p.tweens.push(`tl.fromTo("#${id} .head", { x: -10 }, { x: 10, duration: 0.04, repeat: 7, yoyo: true, ease: "none" }, ${t.start + 0.2});`);
        p.tweens.push(`tl.fromTo("#${id} .ba-tag i", { scale: 1.6, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.35, ease: "back.out(2.5)" }, ${t.start + 0.1});`);
        p.sfx = [{ name: 'hit', at: t.start + 0.15, volume: 0.35 }];
        return p;
    }
    if (scene.type === 'after') {
        const p = pointScene(scene, t, ctx, { cls: 'after', lead: `<div class="ba-tag"><i>${ICON.ok}</i>${esc(label(ctx, 'after', 'BÂY GIỜ'))}</div>` });
        p.html = p.html.replace('>', '>\n    <div class="ba-reveal"></div>');
        // Màn xám trượt đi để lộ cảnh có màu (từ "trước" sang "sau")
        p.tweens.unshift(`tl.fromTo("#${id} .ba-reveal", { scaleX: 1 }, { scaleX: 0, duration: 0.6, ease: "power3.inOut" }, ${t.start + 0.05});`);
        p.tweens.push(`tl.fromTo("#${id} .ba-tag i", { scale: 0.3 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }, ${t.start + 0.5});`);
        p.sfx = [{ name: 'ding', at: t.start + 0.55, volume: 0.28 }];
        return p;
    }
    return pointScene(scene, t, ctx);
}
