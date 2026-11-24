// Đánh giá khách: sao + lời khách NGUYÊN VĂN (lấy từ brief, validator đã đối chiếu) + tên khách.
import { ctaScene, esc, hookScene, js, pointScene, words } from './base.mjs';

export const css = `
.quote .head { top: 290px; }
.stars { font-size: 64px; letter-spacing: 8px; color: #FBBF24; }
.quote-box { position: absolute; left: 72px; right: 180px; top: 560px; padding: 56px 52px 48px; border-radius: 36px; background: rgba(255,255,255,.07); border: 2px solid rgba(255,255,255,.12); }
.quote-box .mark { position: absolute; left: 36px; top: -70px; font-size: 200px; line-height: 1; color: var(--accent); font-weight: 700; }
.quote-box .text { font-size: 50px; line-height: 1.4; font-weight: 700; }
.quote-box .who { margin-top: 32px; font-size: 38px; color: var(--muted); }
`;

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);
    if (scene.type !== 'quote') return pointScene(scene, t, ctx);

    const id = `s${t.index}`;
    const review = ctx.brief?.facts?.review ?? {};
    const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
    const who = [review.author, review.project_name].filter(Boolean).join(' · ');
    const long = scene.body.length > 150;
    // Ảnh dự án làm nền mờ phía sau, không chiếm chỗ của lời khách
    const image = scene.image ? ctx.image(scene.image) : null;
    let html = image ? `<img class="hero-img" src="${esc(image.file)}" /><div class="hero-shade"></div>` : '';
    html += `
    <div class="head">
      <div class="stars">${'★'.repeat(rating)}</div>
      <div class="title">${words(scene.title)}</div>
    </div>
    <div class="quote-box"${long ? ' style="top:520px"' : ''}>
      <div class="mark">“</div>
      <div class="text"${long ? ' style="font-size:42px"' : ''}>${esc(scene.body)}</div>
      ${who ? `<div class="who">— ${esc(who)}</div>` : ''}
    </div>`;
    const tweens = [
        `tl.from(${js(`#${id} .stars`)}, { opacity: 0, scale: 0.5, duration: 0.5, ease: "back.out(2)" }, ${t.start});`,
        `tl.from(${js(`#${id} .title .w`)}, { opacity: 0, y: 40, duration: 0.4, stagger: 0.05 }, ${t.start + 0.2});`,
        `tl.from(${js(`#${id} .quote-box`)}, { opacity: 0, y: 60, duration: 0.6, ease: "power3.out" }, ${t.start + 0.5});`,
    ];
    if (image) tweens.push(`tl.fromTo(${js(`#${id} .hero-img`)}, { scale: 1.12 }, { scale: 1, duration: ${t.dur}, ease: "none" }, ${t.start});`);
    return {
        html: `\n  <div class="scene quote" id="${id}" data-start="${t.start}" data-duration="${t.dur}">${html}\n  </div>`,
        tweens,
    };
}
