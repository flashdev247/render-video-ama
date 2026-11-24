// Phụ đề SRT từ mốc thời gian từng từ của TTS: YouTube dùng để hiểu nội dung video (tìm kiếm) và cho người xem tắt tiếng.

const stamp = (sec) => {
    const ms = Math.max(0, Math.round(sec * 1000));
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
};

/**
 * timings: [{ start, voiceAt, words: [{ t, d, w }], text? }] (t tính từ đầu đoạn giọng của cảnh).
 * text: lời thoại gốc của cảnh; TTS trả từ không kèm dấu câu, nên khi số từ khớp thì lấy chữ từ lời gốc (giữ dấu câu, ngắt đúng câu).
 * Mỗi dòng tối đa maxWords từ / maxChars ký tự, không vắt qua hai cảnh.
 */
export function toSrt(timings, { maxWords = 7, maxChars = 42 } = {}) {
    const cues = [];
    for (const t of timings) {
        const tokens = String(t.text ?? '').trim().split(/\s+/u).filter(Boolean);
        const words = tokens.length === (t.words ?? []).length ? t.words.map((w, i) => ({ ...w, w: tokens[i] })) : (t.words ?? []);
        let chunk = [];
        const flush = () => {
            if (!chunk.length) return;
            const first = chunk[0];
            const last = chunk.at(-1);
            cues.push({ from: t.start + t.voiceAt + first.t, to: t.start + t.voiceAt + last.t + last.d, text: chunk.map((w) => w.w).join(' ') });
            chunk = [];
        };
        for (const word of words) {
            const text = [...chunk, word].map((w) => w.w).join(' ');
            if (chunk.length && (chunk.length >= maxWords || text.length > maxChars)) flush();
            chunk.push(word);
            if (/[.!?…]$/.test(word.w)) flush();
        }
        flush();
    }
    return cues.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(Math.max(c.to, c.from + 0.3))}\n${c.text}\n`).join('\n');
}
