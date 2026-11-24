// Đố vui A/B: 2 khung điện thoại mô phỏng cài sẵn (bản tốt / bản chưa tốt theo script.quiz.mock), đếm ngược 3‑2‑1
// để người xem tự chọn, rồi cảnh đáp án tô xanh khung đúng, làm mờ khung sai. Mockup do mẫu vẽ, Claude chỉ chọn loại.
import { ctaScene, esc, hookScene, words } from './base.mjs';

const r = (n) => Math.round(n * 1000) / 1000;

export const css = `
.qz-title { position: absolute; left: 72px; right: 180px; top: 250px; font-size: 68px; line-height: 1.15; font-weight: 700; }
.qz-title .w { display: inline-block; }
.qz-card { position: absolute; top: 470px; width: 420px; height: 700px; border-radius: 34px; background: rgba(255,255,255,.06); border: 5px solid rgba(255,255,255,.18); padding: 22px; }
.qz-card.a { left: 72px; } .qz-card.b { left: 552px; }
.qz-card .lbl { position: absolute; left: -18px; top: -30px; width: 92px; height: 92px; border-radius: 28px; background: var(--accent); color: var(--on-accent); font-size: 60px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 16px 32px rgba(0,0,0,.35); z-index: 2; }
.qz-card.b .lbl { background: #2563EB; }
.qz-card .qz-cap { position: absolute; left: 22px; right: 22px; bottom: 22px; font-size: 32px; line-height: 1.25; font-weight: 700; text-align: center; color: #E2E8F0; }
.qz-card .verdict { position: absolute; right: -16px; top: -26px; width: 96px; height: 96px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; z-index: 2; }
.qz-card.good .verdict { background: #16A34A; } .qz-card.bad .verdict { background: #DC2626; }
.phone { position: relative; width: 100%; height: 540px; border-radius: 26px; background: #fff; overflow: hidden; color: #1E293B; font-family: 'Be Vietnam Pro', sans-serif; }
.phone .top { height: 54px; background: #F1F5F9; display: flex; align-items: center; padding: 0 18px; gap: 10px; }
.phone .top i { width: 26px; height: 26px; border-radius: 8px; background: var(--accent); display: block; }
.phone .top b { width: 120px; height: 12px; border-radius: 6px; background: #CBD5E1; display: block; }
.phone .pad { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.ph-img { height: 190px; border-radius: 16px; background: linear-gradient(135deg, var(--accent-light), var(--accent) 60%, var(--accent-dark)); position: relative; overflow: hidden; }
.ph-img::after { content: ''; position: absolute; left: 50%; top: 50%; width: 110px; height: 110px; margin: -55px 0 0 -55px; border-radius: 50%; background: rgba(255,255,255,.55); }
.ph-img.dull { background: linear-gradient(135deg, #E2E8F0, #CBD5E1); filter: blur(3px); }
.ph-img.dull::after { background: rgba(148,163,184,.6); border-radius: 12px; }
.ph-img .wm { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 700; color: rgba(100,116,139,.7); transform: rotate(-18deg); z-index: 1; }
.ph-h { font-size: 30px; font-weight: 700; line-height: 1.2; }
.ph-line { height: 14px; border-radius: 7px; background: #CBD5E1; }
.ph-line.s { width: 70%; }
.ph-tiny { display: flex; flex-direction: column; gap: 6px; }
.ph-tiny i { display: block; height: 7px; border-radius: 4px; background: #CBD5E1; }
.ph-btn { height: 74px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 30px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 22px rgba(var(--accent-rgb),.35); }
.ph-link { font-size: 18px; color: #94A3B8; text-decoration: underline; text-align: right; }
.ph-field { height: 48px; border-radius: 12px; border: 3px solid #CBD5E1; }
.ph-field.sm { height: 26px; border-width: 2px; border-radius: 6px; }
.ph-spin { width: 110px; height: 110px; margin: 120px auto 0; border-radius: 50%; border: 14px solid #E2E8F0; border-top-color: #94A3B8; }
.ph-fab { position: absolute; right: 18px; bottom: 18px; width: 92px; height: 92px; border-radius: 50%; background: #16A34A; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 24px rgba(22,163,74,.45); }
.qz-count { position: absolute; left: 50%; top: 735px; width: 170px; height: 170px; margin-left: -85px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-size: 104px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 50px rgba(var(--accent-rgb),.5); opacity: 0; z-index: 3; }
.qz-count span { position: absolute; opacity: 0; }
.qz-vs { position: absolute; left: 50%; top: 778px; width: 84px; height: 84px; margin-left: -42px; border-radius: 50%; background: var(--primary); border: 5px solid rgba(255,255,255,.3); color: #fff; font-size: 30px; font-weight: 700; display: flex; align-items: center; justify-content: center; z-index: 2; }
`;

const CHECK = '<svg viewBox="0 0 24 24" width="60" height="60"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24" width="54" height="54"><path d="M6 6 L18 18 M18 6 L6 18" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/></svg>';
const PHONE_ICON = '<svg viewBox="0 0 24 24" width="48" height="48"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" fill="#fff"/></svg>';

const lines = (n, cls = '') => Array.from({ length: n }, (_, i) => `<div class="ph-line ${i === n - 1 ? 's' : ''} ${cls}"></div>`).join('');
const tiny = (n) => `<div class="ph-tiny">${Array.from({ length: n }, (_, i) => `<i style="width:${70 + ((i * 37) % 30)}%"></i>`).join('')}</div>`;

/** Nội dung màn hình điện thoại mô phỏng: bản tốt (good) hoặc chưa tốt theo loại câu đố. */
export function mock(kind, good) {
    const body = {
        button: () => good
            ? `<div class="ph-img"></div><div class="ph-h">Bánh kem tươi</div>${lines(2)}<div class="ph-btn">Đặt ngay</div>`
            : `<div class="ph-img"></div><div class="ph-h">Bánh kem tươi</div>${lines(4)}<div class="ph-link">xem thêm</div>`,
        text: () => good
            ? `<div class="ph-h">Giao trong ngày</div>${lines(2)}<div class="ph-h">Đổi trả dễ</div>${lines(2)}<div class="ph-btn">Xem sản phẩm</div>`
            : tiny(26),
        form: () => good
            ? `<div class="ph-h">Nhận tư vấn</div><div class="ph-field"></div><div class="ph-field"></div><div class="ph-btn">Gửi</div>`
            : `<div class="ph-h">Đăng ký</div>${Array.from({ length: 10 }, () => '<div class="ph-field sm"></div>').join('')}`,
        speed: () => good
            ? `<div class="ph-img"></div><div class="ph-h">Spa thư giãn</div>${lines(2)}<div class="ph-btn">Đặt lịch</div>`
            : '<div class="ph-spin"></div>',
        contact: () => good
            ? `<div class="ph-img"></div><div class="ph-h">Phòng khám</div>${lines(3)}`
            : `<div class="ph-img"></div><div class="ph-h">Phòng khám</div>${lines(3)}`,
        photo: () => good
            ? `<div class="ph-img"></div><div class="ph-h">Ảnh thật tại tiệm</div>${lines(2)}`
            : `<div class="ph-img dull"><div class="wm">STOCK</div></div><div class="ph-h">Ảnh mạng</div>${lines(2)}`,
    }[kind] ?? (() => lines(4));
    const fab = kind === 'contact' && good ? `<div class="ph-fab">${PHONE_ICON}</div>` : '';
    return `<div class="phone"><div class="top"><i></i><b></b></div><div class="pad">${body()}</div>${fab}</div>`;
}

function cards(quiz, revealed) {
    const card = (side) => {
        const good = quiz.correct === side;
        return `<div class="qz-card ${side} ${revealed ? (good ? 'good' : 'bad') : ''}">
      <div class="lbl">${side.toUpperCase()}</div>${revealed ? `<div class="verdict">${good ? CHECK : CROSS}</div>` : ''}
      ${mock(quiz.mock, good)}
      <div class="qz-cap">${esc(quiz[side])}</div>
    </div>`;
    };
    return `${card('a')}<div class="qz-vs">VS</div>${card('b')}`;
}

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);

    const quiz = ctx.script?.quiz ?? { mock: 'button', a: 'A', b: 'B', correct: 'a' };
    const id = `s${t.index}`;
    const answer = scene.type === 'answer';
    const html = `
  <div class="scene ${scene.type}" id="${id}" data-start="${r(t.start)}" data-duration="${r(t.dur)}">
    <div class="qz-title">${words(scene.title)}</div>
    ${cards(quiz, answer)}
    ${answer ? '' : '<div class="qz-count"><span>3</span><span>2</span><span>1</span></div>'}
  </div>`;

    const tweens = [`tl.from("#${id} .qz-title .w", { opacity: 0, y: 40, duration: 0.4, stagger: 0.05, ease: "power3.out" }, ${r(t.start)});`];
    const sfx = [];
    if (!answer) {
        tweens.push(
            `tl.from("#${id} .qz-card.a", { opacity: 0, x: -200, rotation: -6, duration: 0.55, ease: "back.out(1.6)" }, ${r(t.start + 0.25)});`,
            `tl.from("#${id} .qz-card.b", { opacity: 0, x: 200, rotation: 6, duration: 0.55, ease: "back.out(1.6)" }, ${r(t.start + 0.4)});`,
            `tl.from("#${id} .qz-vs", { scale: 0, duration: 0.4, ease: "back.out(3)" }, ${r(t.start + 0.8)});`,
        );
        // Đếm ngược trong khoảng "hold" sau lời thoại (render.mjs đã cộng hold vào thời lượng cảnh)
        const hold = Math.max(1.5, scene.hold ?? 3);
        const from = t.start + t.voiceAt + t.voice + 0.1;
        const step = hold / 3;
        tweens.push(`tl.to("#${id} .qz-vs", { opacity: 0, duration: 0.15 }, ${r(from)});`);
        tweens.push(`tl.to("#${id} .qz-count", { opacity: 1, duration: 0.2 }, ${r(from)});`);
        [0, 1, 2].forEach((i) => {
            const at = from + i * step;
            tweens.push(`tl.fromTo("#${id} .qz-count span:nth-child(${i + 1})", { opacity: 1, scale: 1.6 }, { scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, ${r(at)});`);
            tweens.push(`tl.to("#${id} .qz-count span:nth-child(${i + 1})", { opacity: 0, duration: 0.1 }, ${r(at + step - 0.1)});`);
            sfx.push({ name: 'tick', at, volume: 0.45 });
        });
        tweens.push(`tl.fromTo("#${id} .qz-card", { y: 0 }, { y: -10, duration: ${r(step / 2)}, repeat: 5, yoyo: true, ease: "sine.inOut" }, ${r(from)});`);
    } else {
        const good = `#${id} .qz-card.good`;
        const bad = `#${id} .qz-card.bad`;
        tweens.push(
            `tl.to("${bad}", { opacity: 0.35, scale: 0.92, duration: 0.45, ease: "power2.out" }, ${r(t.start + 0.3)});`,
            `tl.to("${good}", { scale: 1.05, borderColor: "#22C55E", boxShadow: "0 0 60px rgba(34,197,94,.55)", duration: 0.45, ease: "back.out(2)" }, ${r(t.start + 0.3)});`,
            `tl.fromTo("${good} .verdict", { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(3)" }, ${r(t.start + 0.55)});`,
            `tl.fromTo("${bad} .verdict", { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, ${r(t.start + 0.45)});`,
        );
        sfx.push({ name: 'ding', at: t.start + 0.55, volume: 0.32 });
    }
    return { html, tweens, sfx };
}
