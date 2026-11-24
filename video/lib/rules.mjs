// Luật nội dung cho kịch bản video. Bản PHP tương ứng: VideoScriptValidator phía Laravel.
// Sửa luật ở đây thì sửa cả bên PHP (test hai bên cùng đọc video/samples/invalid/*.json).
// Speaker của cảnh "msg": "host" (người dẫn, đại diện brand) | "khach"; "tia" (kịch bản cũ) là alias của "host".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { speakerOf } from './brand.mjs';

const schemaPath = fileURLToPath(new URL('../schema/script.schema.json', import.meta.url));
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const validateSchema = new Ajv({ allErrors: true }).compile(schema);

// Lời thoại tiếng Việt của edge-tts (+12%, đã cắt khoảng lặng) ~4 từ/giây → 55–130 từ ≈ 20–35 giây
export const MIN_WORDS = 55;
export const MAX_WORDS = 130;

// Số kèm đơn vị tiền: "500k", "3 triệu", "1.500.000đ", "$20"...
const MONEY = /\d[\d.,]*\s*(k|đ|₫|vnđ|vnd|đồng|nghìn|ngàn|triệu|tr|củ|usd)(?![\p{L}\p{N}])|\$\s*\d/iu;
const NUMBER = /\d+(?:[.,]\d+)*/g;

export function wordCount(text) {
    return String(text).trim().split(/\s+/u).filter(Boolean).length;
}

/** Bỏ dấu * đánh dấu từ khóa trong title trước khi kiểm tra nội dung. */
const plain = (text) => String(text ?? '').replaceAll('*', '');

const lower = (text) => normalize(text).toLocaleLowerCase('vi');

function normalize(text) {
    return String(text ?? '').replace(/\s+/gu, ' ').trim();
}

/**
 * Trả về danh sách lỗi (chuỗi tiếng Việt). Rỗng = hợp lệ.
 * brief có thể null khi chỉ kiểm tra cấu trúc.
 */
export function validateScript(script, brief = null) {
    if (!validateSchema(script)) {
        return validateSchema.errors.map((e) => `Sai cấu trúc ${e.instancePath || '/'}: ${e.message}`);
    }

    const errors = [];
    const scenes = script.scenes;

    if (scenes[0].type !== 'hook') errors.push('Cảnh đầu tiên phải là "hook".');
    if (scenes.at(-1).type !== 'cta') errors.push('Cảnh cuối cùng phải là "cta".');
    if (scenes.filter((s) => s.type === 'cta').length !== 1) errors.push('Cần đúng 1 cảnh "cta".');

    if (script.template === 'tips') {
        const points = scenes.filter((s) => s.type === 'point');
        if (points.length < 2) errors.push('Mẫu "tips" cần ít nhất 2 cảnh "point".');
        if (points.some((s) => !s.index)) errors.push('Mỗi cảnh "point" của mẫu "tips" cần "index".');
    }
    if (script.template === 'review-quote' && scenes.filter((s) => s.type === 'quote').length !== 1) {
        errors.push('Mẫu "review-quote" cần đúng 1 cảnh "quote".');
    }
    if (script.template !== 'review-quote' && scenes.some((s) => s.type === 'quote')) {
        errors.push('Chỉ mẫu "review-quote" mới có cảnh "quote".');
    }
    if (script.template === 'project-showcase' && !scenes.some((s) => s.image)) {
        errors.push('Mẫu "project-showcase" cần ít nhất 1 cảnh có ảnh dự án.');
    }
    // Loại cảnh riêng của từng mẫu
    const ONLY = { before: 'before-after', after: 'before-after', myth: 'myth-fact', fact: 'myth-fact', build: 'web-build', choice: 'quiz-ab', answer: 'quiz-ab', msg: 'chat-skit', tour: 'site-tour' };
    for (const [type, template] of Object.entries(ONLY)) {
        if (script.template !== template && scenes.some((s) => s.type === type)) errors.push(`Chỉ mẫu "${template}" mới có cảnh "${type}".`);
    }
    if (script.template === 'before-after') {
        if (!scenes.some((s) => s.type === 'before')) errors.push('Mẫu "before-after" cần ít nhất 1 cảnh "before".');
        if (!scenes.some((s) => s.type === 'after' && s.image)) errors.push('Mẫu "before-after" cần ít nhất 1 cảnh "after" có ảnh dự án.');
    }
    if (script.template === 'myth-fact') {
        const myths = scenes.map((s, i) => [s, i]).filter(([s]) => s.type === 'myth');
        if (!myths.length) errors.push('Mẫu "myth-fact" cần ít nhất 1 cảnh "myth".');
        if (myths.some(([, i]) => scenes[i + 1]?.type !== 'fact')) errors.push('Mỗi cảnh "myth" phải có cảnh "fact" ngay sau.');
    }

    if (script.site && script.template !== 'web-build') errors.push('Chỉ mẫu "web-build" mới có "site".');
    if (script.quiz && script.template !== 'quiz-ab') errors.push('Chỉ mẫu "quiz-ab" mới có "quiz".');
    if (script.template === 'web-build') {
        const sections = script.site?.sections ?? [];
        const builds = scenes.filter((s) => s.type === 'build');
        if (!script.site) errors.push('Mẫu "web-build" cần "site" (web demo).');
        else if (sections[0].kind !== 'hero') errors.push('Phần đầu của site.sections phải là "hero".');
        sections.forEach((sec, i) => {
            if (['features', 'steps'].includes(sec.kind) && (sec.items ?? []).length < 2) errors.push(`site.sections[${i}] (${sec.kind}) cần 2–4 "items".`);
        });
        if (builds.length < 2 || builds.length > 4) errors.push('Mẫu "web-build" cần 2–4 cảnh "build".');
        const order = builds.map((s) => s.section);
        if (order.some((n) => n === undefined || n >= sections.length)) errors.push('Mỗi cảnh "build" cần "section" trỏ tới một phần có trong site.sections.');
        else if (order.some((n, i) => i > 0 && n <= order[i - 1])) errors.push('Các cảnh "build" phải dựng các phần theo thứ tự tăng dần.');
    }
    if (scenes.some((s) => s.section !== undefined && s.type !== 'build')) errors.push('Chỉ cảnh "build" mới có "section".');
    if (scenes.some((s) => s.hold !== undefined && s.type !== 'choice')) errors.push('Chỉ cảnh "choice" mới có "hold".');
    if (script.template === 'quiz-ab') {
        if (!script.quiz) errors.push('Mẫu "quiz-ab" cần "quiz" (mockup, chú thích A/B, đáp án).');
        const choices = scenes.map((s, i) => [s, i]).filter(([s]) => s.type === 'choice');
        if (choices.length !== 1 || scenes.filter((s) => s.type === 'answer').length !== 1) errors.push('Mẫu "quiz-ab" cần đúng 1 cảnh "choice" và 1 cảnh "answer".');
        else if (scenes[choices[0][1] + 1]?.type !== 'answer') errors.push('Cảnh "answer" phải ngay sau cảnh "choice".');
        if (choices.some(([s]) => s.hold === undefined || s.hold < 2)) errors.push('Cảnh "choice" cần "hold" 2–4 giây để người xem kịp chọn.');
    }

    if (scenes.some((s) => (s.speaker !== undefined) !== (s.type === 'msg'))) errors.push('Cảnh "msg" cần "speaker" (host | khach), cảnh khác không có "speaker".');
    if (script.template === 'chat-skit') {
        const msgs = scenes.filter((s) => s.type === 'msg');
        const count = (who) => msgs.filter((s) => speakerOf(s.speaker) === who).length;
        if (msgs.length < 4 || count('host') < 2 || count('khach') < 2) errors.push('Mẫu "chat-skit" cần 4–6 cảnh "msg", mỗi bên (host, khach) ít nhất 2 tin.');
        if (msgs[0] && msgs[0].speaker !== 'khach') errors.push('Tin nhắn đầu tiên phải là của khách (khach hỏi, host trả lời).');
        // Khách là nhân vật minh họa: không gắn số liệu, giá, thời gian cụ thể vào lời khách
        scenes.forEach((s, i) => {
            if (s.speaker === 'khach' && /\d/.test(`${s.title} ${s.voiceover}`)) errors.push(`Cảnh ${i + 1}: lời khách (nhân vật minh họa) không được có chữ số.`);
        });
    }

    if (scenes.some((s) => (s.target !== undefined || s.action !== undefined) && s.type !== 'tour')) errors.push('Chỉ cảnh "tour" mới có "target" / "action".');
    if (script.template === 'site-tour') {
        const tours = scenes.filter((s) => s.type === 'tour');
        if (tours.length < 2 || tours.length > 4) errors.push('Mẫu "site-tour" cần 2–4 cảnh "tour".');
        if (tours.some((s) => !s.target || !s.action)) errors.push('Mỗi cảnh "tour" cần "target" (chữ trên trang) và "action" (scroll | tap).');
        if (new Set(tours.map((s) => lower(s.target))).size !== tours.length) errors.push('Mỗi cảnh "tour" chỉ vào một chữ khác nhau.');
    }

    const words = scenes.reduce((sum, s) => sum + wordCount(plain(s.voiceover)), 0);
    if (words < MIN_WORDS || words > MAX_WORDS) {
        errors.push(`Tổng lời thoại ${words} từ, cần ${MIN_WORDS}–${MAX_WORDS} từ (≈ 20–35 giây).`);
    }

    // Dấu * chỉ dùng để đánh dấu từ khóa trong title, phải đi theo cặp
    scenes.forEach((s, i) => {
        if ((s.title.match(/\*/g) ?? []).length % 2) errors.push(`Cảnh ${i + 1}: dấu * trong title phải đi theo cặp (*từ khóa*).`);
        if ([s.body, s.voiceover].some((t) => String(t ?? '').includes('*'))) errors.push(`Cảnh ${i + 1}: chỉ dùng dấu * trong title.`);
    });
    for (const key of ['caption', 'youtube_title', 'youtube_description']) {
        if (script[key].includes('*')) errors.push(`Chỉ dùng dấu * trong title (${key}).`);
    }

    if (!script.youtube_title.includes('#Shorts')) errors.push('youtube_title phải có "#Shorts".');

    const texts = [
        ...scenes.flatMap((s, i) => [
            [`cảnh ${i + 1} title`, plain(s.title)],
            [`cảnh ${i + 1} body`, s.body ?? ''],
            [`cảnh ${i + 1} voiceover`, s.voiceover],
        ]),
        ...(script.site?.sections ?? []).flatMap((sec, i) => [sec.heading, sec.text, sec.button, ...(sec.items ?? [])]
            .filter(Boolean).map((text) => [`site.sections[${i}]`, text])),
        ...(script.quiz ? [['quiz.a', script.quiz.a], ['quiz.b', script.quiz.b]] : []),
        ['caption', script.caption],
        ['youtube_title', script.youtube_title],
        ['youtube_description', script.youtube_description],
    ];
    for (const [where, text] of texts) {
        if (MONEY.test(text)) errors.push(`Không được ghi giá tiền (${where}).`);
    }

    if (brief) {
        if (brief.template && script.template !== brief.template) {
            errors.push(`template phải là "${brief.template}" như trong brief.`);
        }

        const images = new Set(brief.images ?? []);
        scenes.forEach((s, i) => {
            if (s.image && !images.has(s.image)) errors.push(`Cảnh ${i + 1} dùng ảnh không có trong brief.`);
        });

        // Quay web thật: chỉ được chỉ vào chữ đang hiện trên trang (VPS đọc từ trang trước khi AI viết)
        const landmarks = (brief.facts?.tour?.landmarks ?? []).map((l) => lower(l));
        if (landmarks.length) {
            scenes.forEach((s, i) => {
                if (s.type === 'tour' && s.target && !landmarks.includes(lower(s.target))) errors.push(`Cảnh ${i + 1}: "target" phải là một chữ trong brief.facts.tour.landmarks.`);
            });
        }

        // Đố vui: loại mockup và đáp án do Laravel chọn sẵn trong brief, Claude không được đổi
        const topic = brief.facts?.topic;
        if (script.quiz && topic?.mock) {
            if (script.quiz.mock !== topic.mock) errors.push(`quiz.mock phải là "${topic.mock}" như trong brief.`);
            if (topic.correct && script.quiz.correct !== topic.correct) errors.push(`quiz.correct phải là "${topic.correct}" như trong brief.`);
        }

        const quote = normalize(brief.facts?.review?.quote);
        scenes.forEach((s, i) => {
            if (s.type !== 'quote') return;
            const body = normalize(s.body);
            if (!body || !quote.includes(body)) {
                errors.push(`Cảnh ${i + 1}: "body" phải trích nguyên văn lời khách trong brief.`);
            }
        });

        // SEO: từ khóa chọn trong brief.seo.keywords phải có ở đầu tiêu đề YouTube, dòng đầu caption, câu đầu mô tả và lời thoại 2 cảnh đầu
        const keywords = (brief.seo?.keywords ?? []).map((k) => lower(k));
        if (keywords.length) {
            const keyword = lower(script.keyword);
            if (!keyword) {
                errors.push('Thiếu "keyword" (chọn một từ khóa trong brief.seo.keywords).');
            } else if (!keywords.includes(keyword)) {
                errors.push(`"keyword" phải là một từ khóa trong brief.seo.keywords.`);
            } else {
                if (!lower(script.youtube_title).includes(keyword)) errors.push('youtube_title phải chứa từ khóa (keyword).');
                if (!lower(script.caption.split('\n')[0]).includes(keyword)) errors.push('Dòng đầu caption phải chứa từ khóa (keyword).');
                if (!lower(script.youtube_description.slice(0, 200)).includes(keyword)) errors.push('Câu đầu youtube_description phải chứa từ khóa (keyword).');
                if (!scenes.slice(0, 2).some((s) => lower(s.voiceover).includes(keyword))) errors.push('Lời thoại 2 cảnh đầu phải nói từ khóa (keyword).');
            }
        }

        // Số lớn hơn 10 hoặc phần trăm phải có sẵn trong dữ liệu brief (không bịa số liệu)
        // Khối brand: chỉ tính chữ nói được (tên, tên miền, nhãn CTA, hashtag); bỏ màu / giọng / font / logo
        // để mã màu như "#1E293B" không vô tình "hợp thức hóa" số 293.
        const b = brief.brand && typeof brief.brand === 'object' ? brief.brand : null;
        const briefText = JSON.stringify({ ...brief, brand: b ? { name: b.name, host: b.host, cta_label: b.cta_label, hashtags: b.hashtags } : undefined });
        for (const [where, text] of texts) {
            for (const match of text.matchAll(NUMBER)) {
                const isPercent = text.slice(match.index + match[0].length).trimStart().startsWith('%');
                const value = Number(match[0].replace(/[.,]/g, ''));
                if ((isPercent || value > 10) && !briefText.includes(match[0])) {
                    errors.push(`Số "${match[0]}" (${where}) không có trong dữ liệu brief.`);
                }
            }
        }
    }

    return [...new Set(errors)];
}
