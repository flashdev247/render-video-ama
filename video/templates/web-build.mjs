// Dựng web 30 giây: nửa trên code HTML gõ dần (tô màu cú pháp), nửa dưới khung trình duyệt hiện dần từng phần web.
// Nội dung web demo do Claude viết dạng có cấu trúc (script.site), không viết HTML thô để luôn gọn và kiểm tra được.
import { ctaScene, esc, hookScene, words } from './base.mjs';

const r = (n) => Math.round(n * 1000) / 1000;

export const PALETTES = {
    peach: { bg: '#FFF7ED', primary: '#EA580C', ink: '#431407', soft: '#FED7AA' },
    mint: { bg: '#ECFDF5', primary: '#059669', ink: '#064E3B', soft: '#A7F3D0' },
    ocean: { bg: '#EFF6FF', primary: '#2563EB', ink: '#1E3A8A', soft: '#BFDBFE' },
    grape: { bg: '#FAF5FF', primary: '#9333EA', ink: '#3B0764', soft: '#E9D5FF' },
    rose: { bg: '#FFF1F2', primary: '#E11D48', ink: '#4C0519', soft: '#FECDD3' },
    slate: { bg: '#F8FAFC', primary: '#0F172A', ink: '#0F172A', soft: '#CBD5E1' },
};

// Chiều cao vùng nhìn trong khung trình duyệt (520 - thanh địa chỉ 40)
const VIEW_H = 480;

export const css = `
.wb-title { position: absolute; left: 72px; right: 180px; top: 236px; font-size: 58px; line-height: 1.15; font-weight: 700; }
.wb-title .w { display: inline-block; }
.code { position: absolute; left: 72px; width: 828px; top: 420px; height: 370px; border-radius: 26px; background: #0D1117; box-shadow: 0 30px 60px rgba(0,0,0,.45); padding: 26px 30px; font-family: 'DejaVu Sans Mono', 'Liberation Mono', monospace; font-size: 27px; line-height: 1.5; color: #E2E8F0; overflow: hidden; }
.code .dots { display: flex; gap: 10px; margin-bottom: 14px; }
.code .dots i { width: 14px; height: 14px; border-radius: 50%; display: block; background: #F87171; }
.code .dots i:nth-child(2) { background: #FBBF24; } .code .dots i:nth-child(3) { background: #4ADE80; }
.code .ln { white-space: pre; clip-path: inset(0 100% 0 0); }
.code .tg { color: var(--accent-light); } .code .at { color: #93C5FD; } .code .st { color: #86EFAC; }
.code .cursor { display: inline-block; width: 14px; height: 30px; background: var(--accent); vertical-align: middle; margin-left: 4px; }
.site-frame { position: absolute; left: 240px; top: 830px; width: 660px; height: 520px; border-radius: 26px; overflow: hidden; background: #fff; box-shadow: 0 40px 80px rgba(0,0,0,.45); }
.site-frame .chrome { height: 40px; background: #E2E8F0; display: flex; align-items: center; gap: 10px; padding-left: 20px; }
.site-frame .chrome i { width: 14px; height: 14px; border-radius: 50%; background: #94A3B8; display: block; }
.site-frame .chrome b { margin-left: 18px; font-size: 16px; font-weight: 400; color: #475569; background: #fff; border-radius: 8px; padding: 2px 14px; }
.site-frame .view { position: absolute; left: 0; right: 0; top: 40px; bottom: 0; overflow: hidden; }
.site { position: absolute; left: 0; top: 0; width: 660px; background: #fff; font-family: 'Be Vietnam Pro', sans-serif; }
.site .sec { padding: 26px 30px; }
.site .nav { display: flex; align-items: center; justify-content: space-between; font-size: 20px; font-weight: 700; margin-bottom: 26px; }
.site .nav span { display: flex; gap: 8px; } .site .nav span i { width: 34px; height: 8px; border-radius: 4px; display: block; opacity: .5; }
.site h1 { font-size: 40px; line-height: 1.15; margin-bottom: 12px; }
.site h2 { font-size: 28px; line-height: 1.2; margin-bottom: 16px; }
.site p { font-size: 19px; line-height: 1.45; opacity: .8; margin-bottom: 18px; }
.site .btn { display: inline-block; padding: 12px 26px; border-radius: 999px; color: #fff; font-size: 19px; font-weight: 700; }
.site .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.site .card { border-radius: 16px; padding: 16px 14px; font-size: 17px; line-height: 1.35; font-weight: 700; background: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.06); }
.site .card i { display: block; width: 30px; height: 30px; border-radius: 10px; margin-bottom: 10px; }
.site .steps { display: flex; flex-direction: column; gap: 10px; }
.site .step { display: flex; align-items: center; gap: 14px; font-size: 19px; font-weight: 700; }
.site .step b { width: 38px; height: 38px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; flex: none; }
.site .band { border-radius: 22px; padding: 26px; color: #fff; text-align: center; }
.site .band h2 { color: #fff; } .site .band .btn { background: #fff !important; }
.site .new { outline: 4px solid var(--accent); outline-offset: -4px; border-radius: 18px; }
.demo-tag { position: absolute; right: 196px; top: 806px; background: var(--accent); color: var(--on-accent); font-size: 22px; font-weight: 700; padding: 6px 16px; border-radius: 999px; z-index: 2; }
`;

const cut = (text, n = 30) => {
    const s = String(text ?? '');
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};
const domain = (brand) => `${String(brand).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '')}.vn`;
const tag = (name, attrs = '') => `<span class="tg">&lt;${name}</span>${attrs ? ` <span class="at">${attrs}</span>` : ''}<span class="tg">&gt;</span>`;
const close = (name) => `<span class="tg">&lt;/${name}&gt;</span>`;

/** Dòng code HTML (đã escape, có tô màu) cho một phần của web demo. */
export function codeLines(section) {
    const kind = section.kind;
    const lines = [`${tag('section', `class=<span class="st">"${kind}"</span>`)}`];
    if (section.heading) lines.push(`  ${tag(kind === 'hero' ? 'h1' : 'h2')}${esc(cut(section.heading, 28))}${close(kind === 'hero' ? 'h1' : 'h2')}`);
    if (section.text) lines.push(`  ${tag('p')}${esc(cut(section.text, 32))}${close('p')}`);
    (section.items ?? []).slice(0, 4).forEach((item) => lines.push(`  ${tag('li')}${esc(cut(item, 30))}${close('li')}`));
    if (section.button) lines.push(`  ${tag('a', 'class=<span class="st">"btn"</span>')}${esc(cut(section.button, 20))}${close('a')}`);
    lines.push(close('section'));
    return lines;
}

/** HTML của một phần web demo theo bảng màu. */
export function sectionHtml(section, pal, brand, cls = '') {
    const btn = section.button ? `<span class="btn" style="background:${pal.primary}">${esc(section.button)}</span>` : '';
    const inner = {
        hero: () => `<div class="nav" style="color:${pal.ink}">${esc(brand)}<span><i style="background:${pal.ink}"></i><i style="background:${pal.ink}"></i><i style="background:${pal.ink}"></i></span></div>
          <h1 style="color:${pal.ink}">${esc(section.heading)}</h1>${section.text ? `<p style="color:${pal.ink}">${esc(section.text)}</p>` : ''}${btn}`,
        features: () => `<h2 style="color:${pal.ink}">${esc(section.heading)}</h2><div class="cards">${(section.items ?? []).slice(0, 3)
            .map((item) => `<div class="card" style="color:${pal.ink}"><i style="background:${pal.soft}"></i>${esc(item)}</div>`).join('')}</div>`,
        steps: () => `<h2 style="color:${pal.ink}">${esc(section.heading)}</h2><div class="steps">${(section.items ?? []).slice(0, 4)
            .map((item, i) => `<div class="step" style="color:${pal.ink}"><b style="background:${pal.primary}">${i + 1}</b>${esc(item)}</div>`).join('')}</div>`,
        cta: () => `<div class="band" style="background:${pal.primary}"><h2>${esc(section.heading)}</h2>${section.text ? `<p>${esc(section.text)}</p>` : ''}${section.button ? `<span class="btn" style="color:${pal.primary}">${esc(section.button)}</span>` : ''}</div>`,
    }[section.kind] ?? (() => `<h2 style="color:${pal.ink}">${esc(section.heading)}</h2>`);
    return `<div class="sec ${cls}" style="background:${pal.bg}">${inner()}</div>`;
}

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);

    const site = ctx.script?.site ?? { brand: 'Web demo', palette: 'peach', sections: [] };
    const pal = PALETTES[site.palette] ?? PALETTES.peach;
    const idx = Math.min(scene.section ?? 0, site.sections.length - 1);
    const section = site.sections[idx];
    const id = `s${t.index}`;
    const lines = codeLines(section);
    const isLast = !ctx.script.scenes.slice(t.index + 1).some((s) => s.type === 'build');

    const sectionsHtml = site.sections.slice(0, idx + 1).map((s, i) => sectionHtml(s, pal, site.brand, i === idx ? 'new' : '')).join('');
    const html = `
  <div class="scene build" id="${id}" data-start="${r(t.start)}" data-duration="${r(t.dur)}">
    <div class="wb-title">${words(scene.title)}</div>
    <div class="code"><div class="dots"><i></i><i></i><i></i></div>${lines.map((l) => `<div class="ln">${l}</div>`).join('')}<span class="cursor"></span></div>
    <div class="demo-tag">Web demo</div>
    <div class="site-frame"><div class="chrome"><i></i><i></i><i></i><b>${esc(domain(site.brand))}</b></div>
      <div class="view"><div class="site">${sectionsHtml}</div></div></div>
  </div>`;

    // Gõ code trong ~60% lời thoại, rồi phần web mới hiện ra
    const typeEnd = t.voiceAt + Math.max(1.2, t.voice * 0.6);
    const per = typeEnd / lines.length;
    const tweens = [
        `tl.from("#${id} .wb-title .w", { opacity: 0, y: 40, duration: 0.4, stagger: 0.05, ease: "power3.out" }, ${r(t.start)});`,
        `tl.from("#${id} .code", { opacity: 0, y: -40, duration: 0.4, ease: "power3.out" }, ${r(t.start)});`,
        `tl.to("#${id} .code .ln", { clipPath: "inset(0 0% 0 0)", duration: ${r(per * 0.9)}, stagger: ${r(per)}, ease: "steps(14)" }, ${r(t.start + 0.2)});`,
        `tl.fromTo("#${id} .cursor", { opacity: 1 }, { opacity: 0, duration: 0.4, repeat: ${Math.ceil(t.dur / 0.4)}, yoyo: true, ease: "steps(1)" }, ${r(t.start)});`,
        `tl.fromTo("#${id} .site .new", { opacity: 0, scale: 0.9, transformOrigin: "50% 0%" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, ${r(t.start + 0.2 + typeEnd)});`,
        `tl.to("#${id} .site .new", { outlineColor: "rgba(${ctx.theme.accentRgb},0)", duration: 0.6 }, ${r(t.start + 0.9 + typeEnd)});`,
    ];

    // Cuộn theo chiều cao thật của các phần (đo trong trình duyệt khi tween chạy lần đầu):
    // đầu cảnh hiện đoạn cuối phần cũ, gõ xong cuộn tới phần mới; cảnh cuối cuộn từ đầu trang xuống (lướt cả trang).
    const newSel = `document.querySelector("#${id} .site .new")`;
    const until = (extra) => `() => -Math.max(0, ${newSel}.offsetTop + ${extra} - ${VIEW_H})`;
    if (idx > 0) {
        tweens.push(`tl.set("#${id} .site", { y: ${isLast ? 0 : until(120)} }, ${r(t.start)});`);
        tweens.push(`tl.to("#${id} .site", { y: ${until(`${newSel}.offsetHeight`)}, duration: ${isLast ? r(Math.max(1, typeEnd)) : 0.8}, ease: "${isLast ? 'sine.inOut' : 'power2.inOut'}" }, ${r(isLast ? t.start + 0.2 : t.start + typeEnd)});`);
    }

    const sfx = Array.from({ length: Math.min(6, lines.length) }, (_, i) => ({ name: 'type', at: t.start + 0.2 + i * per, volume: 0.22 }));
    sfx.push({ name: 'pop', at: t.start + 0.2 + typeEnd, volume: 0.3 });
    return { html, tweens, sfx };
}
