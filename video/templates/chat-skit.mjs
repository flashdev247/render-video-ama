// Tiểu phẩm khung chat: khách nhắn hỏi trang của brand, người dẫn (host, đại diện brand) trả lời. Khung kiểu Messenger,
// mỗi cảnh "msg" là một tin nhắn (hiện "đang gõ…" rồi bong bóng bật ra kèm tiếng "ting"), tin cũ đẩy lên trên.
// Giọng đọc theo speaker (render.mjs: brand.voices.host / brand.voices.khach). Luôn có nhãn "Tình huống minh họa":
// khách không phải người thật. Avatar host: linh vật tia chớp (brand.mascot = "tia") hoặc chữ cái đầu tên brand.
// Speaker "tia" của kịch bản cũ là alias của "host".
import { speakerOf } from '../lib/brand.mjs';
import { ctaScene, esc, hookScene, words } from './base.mjs';

const r = (n) => Math.round(n * 1000) / 1000;

const KHACH_AVATAR = `<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="32" fill="#3B82F6"/><circle cx="32" cy="25" r="11" fill="#DBEAFE"/><path d="M12 54 Q14 38 32 38 Q50 38 52 54 Z" fill="#DBEAFE"/></svg>`;

/** Avatar người dẫn: tia chớp tô màu brand (mascot "tia") hoặc chữ cái đầu tên brand trên nền màu nhấn. */
export function hostAvatar(ctx) {
    const t = ctx.theme;
    if (ctx.brand?.mascot === 'tia') {
        return `<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="32" fill="${t.accent}"/><path d="M36 10 L20 36 H31 L27 54 L45 26 H34 Z" fill="${t.accentSoft}" stroke="${t.accentDark}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
    }
    return `<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="32" fill="${t.accent}"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="${esc(t.font)}, 'Be Vietnam Pro', sans-serif" font-size="30" font-weight="700" fill="${t.onAccent}">${esc(ctx.initial)}</text></svg>`;
}

const avatar = (who, ctx) => (who === 'host' ? hostAvatar(ctx) : KHACH_AVATAR);

export const css = `
.chat { position: absolute; left: 72px; width: 828px; top: 300px; height: 1060px; border-radius: 36px; background: #F8FAFC; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,.45); color: #0F172A; }
.chat .cbar { height: 120px; background: #fff; border-bottom: 2px solid #E2E8F0; display: flex; align-items: center; gap: 20px; padding: 0 28px; }
.chat .cbar svg { width: 76px; height: 76px; }
.chat .who { display: flex; flex-direction: column; gap: 4px; }
.chat .who b { font-size: 36px; }
.chat .who span { font-size: 24px; color: #16A34A; }
.chat .demo { margin-left: auto; background: #FEF3C7; color: #92400E; font-size: 22px; font-weight: 700; padding: 8px 16px; border-radius: 999px; }
.chat .list { position: absolute; left: 0; right: 0; top: 120px; bottom: 0; padding: 0 26px 30px; display: flex; flex-direction: column; justify-content: flex-end; gap: 22px; }
.chat .day { align-self: center; font-size: 22px; color: #94A3B8; }
.msg-row { display: flex; align-items: flex-end; gap: 14px; overflow: hidden; }
.msg-row.from-host { flex-direction: row-reverse; }
.msg-row svg { flex: none; width: 60px; height: 60px; }
.bubble { max-width: 600px; padding: 20px 28px; border-radius: 34px; font-size: 40px; line-height: 1.3; font-weight: 700; }
.msg-row.from-khach .bubble { background: #E2E8F0; border-bottom-left-radius: 10px; }
.msg-row.from-host .bubble { background: var(--accent); color: var(--on-accent); border-bottom-right-radius: 10px; }
.bubble .w { display: inline; }
.msg-row.from-khach .bubble .hl { color: var(--accent-dark); }
.msg-row.from-host .bubble .hl { text-decoration: underline; text-decoration-thickness: 5px; text-underline-offset: 7px; }
.typing { display: flex; gap: 10px; padding: 24px 28px; border-radius: 34px; background: #E2E8F0; }
.from-host .typing { background: var(--accent-light); }
.typing i { width: 16px; height: 16px; border-radius: 50%; background: #64748B; display: block; }
.from-host .typing i { background: #fff; }
`;

/** Bỏ dấu chuyển cảnh (dải màu / chớp trắng) giữa hai tin nhắn liên tiếp: khung chat đứng yên. */
export function continuous(prev, cur) {
    return prev?.type === 'msg' && cur?.type === 'msg';
}

function row(scene, ctx, cls = '') {
    const who = speakerOf(scene.speaker);
    return `<div class="msg-row from-${who} ${cls}">${avatar(who, ctx)}<div class="bubble">${words(scene.title)}</div></div>`;
}

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);

    const id = `s${t.index}`;
    const who = speakerOf(scene.speaker);
    const history = ctx.script.scenes.slice(0, t.index).filter((s) => s.type === 'msg');
    const first = history.length === 0;
    const html = `
  <div class="scene msg" id="${id}" data-start="${r(t.start)}" data-duration="${r(t.dur)}">
    <div class="chat">
      <div class="cbar">${KHACH_AVATAR}<div class="who"><b>Khách hàng</b><span>● Đang hoạt động</span></div><div class="demo">Tình huống minh họa</div></div>
      <div class="list"><div class="day">Hôm nay</div>${history.map((s) => row(s, ctx)).join('')}
        <div class="msg-row from-${who} wait">${avatar(who, ctx)}<div class="typing"><i></i><i></i><i></i></div></div>${row(scene, ctx, 'new')}</div>
    </div>
  </div>`;

    const pop = t.start + 0.45;
    const tweens = [
        // "Đang gõ…": 3 chấm nhấp nhô rồi tin nhắn bật ra, tin cũ đẩy lên
        `tl.set("#${id} .msg-row.new", { display: "none" }, ${r(t.start)});`,
        `tl.from("#${id} .msg-row.wait", { height: 0, opacity: 0, duration: 0.15 }, ${r(t.start + 0.02)});`,
        `tl.fromTo("#${id} .typing i", { y: 0 }, { y: -10, duration: 0.12, stagger: 0.06, repeat: 1, yoyo: true, ease: "sine.inOut" }, ${r(t.start + 0.05)});`,
        `tl.set("#${id} .msg-row.wait", { display: "none" }, ${r(pop)});`,
        `tl.set("#${id} .msg-row.new", { display: "flex" }, ${r(pop)});`,
        `tl.from("#${id} .msg-row.new .bubble", { scale: 0.4, opacity: 0, duration: 0.35, ease: "back.out(2.2)", transformOrigin: "${who === 'host' ? '100% 100%' : '0% 100%'}" }, ${r(pop)});`,
    ];
    if (first) tweens.unshift(`tl.from("#${id} .chat", { opacity: 0, y: 120, scale: 0.94, duration: 0.5, ease: "power3.out" }, ${r(t.start)});`);
    return { html, tweens, sfx: [{ name: 'ting', at: pop, volume: 0.35 }] };
}
