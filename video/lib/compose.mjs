// Dựng composition HTML (HyperFrames) từ kịch bản + mốc thời gian giọng đọc. Tách khỏi scripts/render.mjs để test
// được bố cục theo brand mà không cần edge-tts / ffmpeg / Chrome.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initial, speakerOf, theme as makeTheme } from './brand.mjs';
import { captions, chrome, documentHtml, transitions } from '../templates/base.mjs';
import { MASCOT_CSS, mascot } from '../templates/mascot.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Nạp module mẫu video (templates/<template>.mjs). */
export function loadTemplate(name) {
    return import(join(ROOT, 'templates', `${name}.mjs`));
}

/**
 * Giọng đọc từng cảnh cho scripts/tts.py: cảnh "msg" theo speaker (host / khach, "tia" = host) lấy brand.voices;
 * cảnh khác null (= giọng chính). Giọng chính = brand.voices.host nếu brand chọn rõ, không thì script.voice.
 */
export function sceneVoices(script, brand) {
    return {
        voice: brand.narrator ?? script.voice,
        voices: script.scenes.map((s) => (s.speaker ? brand.voices[speakerOf(s.speaker)] ?? null : null)),
    };
}

/**
 * @param {object} p
 * @param {object} p.script kịch bản
 * @param {object|null} p.brief brief
 * @param {object} p.brand lib/brand.mjs → resolveBrand(brief)
 * @param {Array} p.timings [{ index, start, dur, voice, voiceAt, words }]
 * @param {Array<{file: string}>} p.voiceFiles file giọng từng cảnh (trong thư mục work)
 * @param {Map} [p.images] src → { file, width, height }
 * @param {object|null} [p.tour] mẫu site-tour: { file, height, points }
 * @param {string|null} [p.logoFile] logo đã tải vào work (null = hiện tên brand dạng chữ)
 * @param {boolean} [p.withMascot] vẽ linh vật (brand.mascot = "tia")
 * @returns {Promise<{html: string, sfx: Array<{name: string, at: number, volume: number}>, duration: number}>}
 */
export async function compose({ script, brief, brand, timings, voiceFiles, images = new Map(), tour = null, logoFile = null, withMascot = brand.mascot === 'tia' }) {
    const template = await loadTemplate(script.template);
    const theme = makeTheme(brand);
    const last = timings.at(-1);
    const duration = Math.round((last.start + last.dur) * 100) / 100;
    const logo = { file: logoFile, name: brand.name };

    const ctx = {
        brief,
        script,
        tour,
        brand,
        theme,
        logo,
        initial: initial(brand.name),
        image: (src) => {
            const img = images.get(src);
            if (!img) throw new Error(`Thiếu ảnh ${src}`);
            return img;
        },
    };
    const trans = transitions(timings, (t) => template.continuous?.(script.scenes[t.index - 1], script.scenes[t.index]) ?? false);
    const parts = [chrome(duration, last.start, timings, logo)];
    const sfx = [...trans.sfx];
    script.scenes.forEach((scene, i) => {
        const part = template.renderScene(scene, timings[i], ctx);
        parts.push(part);
        sfx.push(...(part.sfx ?? [])); // hiệu ứng riêng của mẫu (vd con dấu "HIỂU LẦM")
    });
    if (withMascot) {
        const m = mascot(timings, script.scenes, { hasImage: (s) => (Boolean(s.image) && !['hook', 'quote', 'myth', 'fact'].includes(s.type)) || ['build', 'choice', 'answer', 'tour'].includes(s.type) });
        parts.push(m);
        sfx.push(...m.sfx);
    }
    parts.push(trans, captions(timings, theme));

    let body = parts.map((p) => p.html).join('');
    body += timings
        .map((t) => `\n  <audio id="voice${t.index}" src="${voiceFiles[t.index].file}" data-start="${(t.start + t.voiceAt).toFixed(2)}" data-duration="${(t.voice + 0.05).toFixed(2)}" data-volume="1"></audio>`)
        .join('');
    // Hiệu ứng âm thanh (whoosh chuyển cảnh, zap / pop / ding của linh vật…)
    const used = sfx.filter((x) => x.at >= 0 && x.at < duration - 0.1);
    body += used
        .map((x, i) => `\n  <audio id="sfx${i}" src="sfx/${x.name}.mp3" data-start="${x.at.toFixed(2)}" data-duration="${Math.min(1.2, duration - x.at).toFixed(2)}" data-volume="${x.volume}"></audio>`)
        .join('');

    const html = documentHtml({
        duration,
        css: (template.css ?? '') + (withMascot ? MASCOT_CSS : ''),
        rootClass: script.template,
        body,
        tweens: parts.flatMap((p) => p.tweens),
        theme,
        font: brand.font,
    });
    return { html, sfx: used, duration };
}
