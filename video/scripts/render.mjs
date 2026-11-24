#!/usr/bin/env node
// Dựng video 9:16 từ script.json.
// node scripts/render.mjs --script script.json --brief brief.json --out out/video.mp4 --thumb out/thumb.jpg
//   [--work work/] [--quality draft|standard|high] [--music auto|none|path.mp3] [--rate +12%] [--mascot auto|tia|none]
//   [--workers auto|1-8] [--fps 24|30|60]
// Màu, font, logo, linh vật, giọng đọc lấy từ khối "brand" của brief (lib/brand.mjs, docs/video-renderer.md).
// --mascot auto (mặc định) theo brief.brand.mascot; "tia" / "none" ép bật / tắt khi thử trên máy.
// GitHub Actions dùng --workers 2: HyperFrames tự chọn max(1, số CPU − 2) nên runner 2 vCPU chỉ chạy 1 worker.
// Ảnh trong kịch bản là URL (tải về) hoặc đường dẫn tương đối so với file brief (dùng cho samples/).
import { execFile } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { resolveBrand } from '../lib/brand.mjs';
import { compose, sceneVoices } from '../lib/compose.mjs';
import { validateScript } from '../lib/rules.mjs';
import { toSrt } from '../lib/srt.mjs';
import { capture } from './capture.mjs';
import { plain } from '../templates/base.mjs';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
    options: {
        script: { type: 'string', default: 'script.json' },
        brief: { type: 'string' },
        out: { type: 'string', default: 'out/video.mp4' },
        thumb: { type: 'string', default: 'out/thumb.jpg' },
        work: { type: 'string', default: join(ROOT, 'work') },
        quality: { type: 'string', default: 'standard' },
        music: { type: 'string', default: 'auto' },
        rate: { type: 'string', default: '+12%' },
        mascot: { type: 'string', default: 'auto' },
        // Số trình duyệt dựng khung hình song song (auto = HyperFrames tự chọn)
        workers: { type: 'string', default: 'auto' },
        fps: { type: 'string', default: '30' },
        // Chỉ chụp khung hình ở các giây này (vd "1.5,8,20") để xem nhanh bố cục, không render video
        snapshot: { type: 'string' },
    },
});

const log = (msg) => console.log(`[render] ${msg}`);
const USER_AGENT = 'AutoMarketingAIRenderer/1.0';

async function probe(file) {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', file]);
    const data = JSON.parse(stdout);
    const stream = (data.streams ?? []).find((s) => s.width) ?? {};
    return { duration: Number(data.format?.duration ?? 0), width: stream.width ?? 0, height: stream.height ?? 0 };
}

async function fetchImage(src, baseDir, dest) {
    if (/^https?:\/\//i.test(src)) {
        const res = await fetch(src, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) throw new Error(`Không tải được ảnh ${src}: HTTP ${res.status}`);
        writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    } else {
        copyFileSync(resolve(baseDir, src), dest);
    }
}

const LOGO_TYPES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/gif': '.gif' };

/**
 * Tải logo brand (brand.logo_url: URL http(s) hoặc đường dẫn tương đối so với brief, dùng cho samples/) vào work/.
 * Lỗi / không phải ảnh thì trả null: video hiện tên brand dạng chữ thay vì dừng render.
 */
async function fetchLogo(src, baseDir, work) {
    if (!src) return null;
    try {
        let ext = extname(new URL(src, 'file:///').pathname).toLowerCase();
        let data;
        if (/^https?:\/\//i.test(src)) {
            const res = await fetch(src, { headers: { 'User-Agent': USER_AGENT } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
            if (LOGO_TYPES[type]) ext = LOGO_TYPES[type];
            data = Buffer.from(await res.arrayBuffer());
        } else {
            data = readFileSync(resolve(baseDir, src));
        }
        if (!Object.values(LOGO_TYPES).includes(ext) && ext !== '.jpeg') throw new Error(`định dạng không hỗ trợ (${ext || 'không rõ'})`);
        if (!data.length || data.length > 5 * 1024 * 1024) throw new Error('file rỗng hoặc quá 5MB');
        const file = `logo${ext === '.jpeg' ? '.jpg' : ext}`;
        writeFileSync(join(work, file), data);
        return file;
    } catch (e) {
        log(`không dùng được logo (${e.message}), hiện tên brand dạng chữ`);
        return null;
    }
}

// Nhạc nền theo mẫu video (tự tạo bằng scripts/make-audio.py, không lo bản quyền)
const MOOD = { tips: 'upbeat', 'project-showcase': 'corporate', 'review-quote': 'warm', 'before-after': 'corporate', 'myth-fact': 'upbeat', 'web-build': 'upbeat', 'quiz-ab': 'upbeat', 'chat-skit': 'warm', 'site-tour': 'corporate' };

/** Chọn nhạc nền: theo tâm trạng của mẫu, không có thì chọn cố định theo nội dung; không có nhạc thì bỏ qua. */
function pickMusic(script) {
    if (args.music === 'none') return null;
    if (args.music !== 'auto') return resolve(args.music);
    const dir = join(ROOT, 'assets', 'music');
    const tracks = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(mp3|m4a|wav)$/i.test(f)).sort() : [];
    if (!tracks.length) return null;
    const mood = tracks.find((f) => f.startsWith(`${MOOD[script.template]}.`));
    if (mood) return join(dir, mood);
    const seed = [...script.scenes[0].title].reduce((s, c) => (s * 31 + c.codePointAt(0)) >>> 0, 7);
    return join(dir, tracks[seed % tracks.length]);
}

async function main() {
    const script = JSON.parse(readFileSync(args.script, 'utf8'));
    const brief = args.brief ? JSON.parse(readFileSync(args.brief, 'utf8')) : null;
    const baseDir = args.brief ? dirname(resolve(args.brief)) : dirname(resolve(args.script));

    const errors = validateScript(script, brief);
    if (errors.length) throw new Error(`Kịch bản không hợp lệ:\n- ${errors.join('\n- ')}`);
    const brand = resolveBrand(brief);
    const withMascot = args.mascot === 'auto' ? brand.mascot === 'tia' : ['tia', 'on'].includes(args.mascot);
    log(`brand: ${brand.name || '(chưa đặt tên)'}, font ${brand.font.family}, linh vật ${withMascot ? 'tia' : 'không'}`);

    const work = resolve(args.work);
    rmSync(work, { recursive: true, force: true });
    mkdirSync(join(work, 'fonts'), { recursive: true });
    for (const f of readdirSync(join(ROOT, 'assets', 'fonts'))) copyFileSync(join(ROOT, 'assets', 'fonts', f), join(work, 'fonts', f));
    copyFileSync(join(ROOT, 'node_modules', 'gsap', 'dist', 'gsap.min.js'), join(work, 'gsap.min.js'));
    const logoFile = await fetchLogo(brand.logoUrl, baseDir, work);

    // 1. Ảnh
    const images = new Map();
    const sources = [...new Set(script.scenes.map((s) => s.image).filter(Boolean))];
    for (const [i, src] of sources.entries()) {
        const ext = (extname(new URL(src, 'file:///').pathname) || '.jpg').toLowerCase();
        const file = `img-${i}${ext}`;
        await fetchImage(src, baseDir, join(work, file));
        const { width, height } = await probe(join(work, file));
        images.set(src, { file, width, height });
    }
    log(`${images.size} ảnh`);

    // Mẫu quay web thật: chụp toàn trang trong brief (chỉ URL do Laravel chọn) và tìm vị trí từng chữ cần chỉ
    let tour = null;
    if (script.template === 'site-tour') {
        const url = brief?.facts?.tour?.url;
        if (!url) throw new Error('Mẫu site-tour cần brief.facts.tour.url');
        const shot = await capture(url, script.scenes.filter((s) => s.type === 'tour').map((s) => s.target), work);
        const missing = shot.points.filter((p) => !p.found).map((p) => p.target);
        if (missing.length) log(`không thấy trên trang (cuộn đều thay thế): ${missing.join(' | ')}`);
        tour = { file: 'page.jpg', height: shot.height, points: shot.points };
        log(`chụp ${url}: cao ${shot.height}px`);
    }

    // 2. Giọng đọc + mốc thời gian từng từ
    // Giọng theo brand.voices; mẫu nhiều nhân vật (chat-skit) đọc giọng theo speaker của từng cảnh
    const { voice, voices } = sceneVoices(script, brand);
    writeFileSync(join(work, 'tts-input.json'), JSON.stringify({ voice, rate: args.rate, scenes: script.scenes.map((s) => plain(s.voiceover)), voices }));
    await run(process.env.PYTHON ?? 'python3', [join(ROOT, 'scripts', 'tts.py'), '--input', join(work, 'tts-input.json'), '--out-dir', work], { maxBuffer: 1 << 24 });
    const tts = JSON.parse(readFileSync(join(work, 'tts.json'), 'utf8'));

    // 3. Thời lượng cảnh = độ dài giọng + khoảng nghỉ
    const VOICE_AT = 0.3;
    const timings = [];
    let cursor = 0;
    for (const [index, scene] of script.scenes.entries()) {
        const { duration: voice } = await probe(join(work, tts.scenes[index].file));
        const min = scene.type === 'cta' ? 3.5 : 2.4;
        // "hold": giây chờ thêm sau lời thoại (đếm ngược của cảnh "choice" mẫu đố vui)
        const dur = Math.round(Math.max(min, VOICE_AT + voice + (scene.type === 'cta' ? 1.2 : 0.45) + (scene.hold ?? 0)) * 100) / 100;
        timings.push({ index, start: Math.round(cursor * 100) / 100, dur, voice, voiceAt: VOICE_AT, words: tts.scenes[index].words });
        cursor += dur;
    }
    const duration = Math.round(cursor * 100) / 100;
    log(`thời lượng ${duration}s, ${timings.length} cảnh`);

    // 4. Dựng composition (màu, font, logo, linh vật theo brand)
    const { html, sfx } = await compose({ script, brief, brand, timings, voiceFiles: tts.scenes, images, tour, logoFile, withMascot });
    mkdirSync(join(work, 'sfx'), { recursive: true });
    for (const name of new Set(sfx.map((x) => x.name))) copyFileSync(join(ROOT, 'assets', 'sfx', `${name}.mp3`), join(work, 'sfx', `${name}.mp3`));
    writeFileSync(join(work, 'index.html'), html);
    writeFileSync(join(work, 'hyperframes.json'), JSON.stringify({ paths: { assets: '.' }, media: { autoProxy: false } }, null, 2));

    // 5. Render bằng HyperFrames
    const raw = join(work, 'raw.mp4');
    const hf = join(ROOT, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs');
    const hfEnv = { ...process.env, HYPERFRAMES_TELEMETRY: '0', HYPERFRAMES_SKIP_SKILLS: '1' };
    if (args.snapshot) {
        const outDir = resolve(dirname(resolve(args.out)), 'snapshots');
        await run(process.execPath, [hf, 'snapshot', work, '--at', args.snapshot, '--no-end', '-o', outDir], { maxBuffer: 1 << 26, env: hfEnv });
        log(`ảnh chụp: ${outDir}`);
        return;
    }
    log('render HyperFrames…');
    const renderArgs = [hf, 'render', work, '-o', raw, '--quality', args.quality, '--fps', args.fps, '--quiet'];
    if (args.workers !== 'auto') renderArgs.push('--workers', args.workers);
    const started = Date.now();
    await run(process.execPath, renderArgs, { maxBuffer: 1 << 26, env: hfEnv });
    log(`HyperFrames xong sau ${Math.round((Date.now() - started) / 1000)} giây (workers ${args.workers}, ${args.fps} fps)`);

    // 6. Nhạc nền (nhỏ, tắt dần ở cuối) + chuẩn âm lượng -14 LUFS cho Reels/Shorts
    mkdirSync(dirname(resolve(args.out)), { recursive: true });
    const music = pickMusic(script);
    const fadeAt = Math.max(duration - 2, 0).toFixed(2);
    const ffArgs = ['-v', 'error', '-y', '-i', raw];
    let filter;
    if (music) {
        log(`nhạc nền: ${music}`);
        ffArgs.push('-stream_loop', '-1', '-i', music);
        // Nhạc ~22%, tự nhỏ đi khi có giọng đọc (sidechain), to lên lúc nghỉ; vào 0,3s, tắt dần 2s cuối
        filter = `[0:a]asplit=2[v1][v2];[1:a]volume=0.22,atrim=0:${duration},afade=t=in:d=0.3,afade=t=out:st=${fadeAt}:d=2[m];` +
            `[m][v1]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=400[md];[v2][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
    } else {
        filter = '[0:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]';
    }
    ffArgs.push('-filter_complex', filter, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', String(duration), resolve(args.out));
    await run('ffmpeg', ffArgs);

    // 7. Ảnh bìa: khung hình lúc tiêu đề hook (và linh vật nếu có) đã hiện
    mkdirSync(dirname(resolve(args.thumb)), { recursive: true });
    const thumbAt = Math.min(0.9, timings[0].dur - 0.1).toFixed(2);
    await run('ffmpeg', ['-v', 'error', '-y', '-ss', thumbAt, '-i', resolve(args.out), '-frames:v', '1', '-q:v', '3', resolve(args.thumb)]);

    // 8. Phụ đề SRT (YouTube dùng cho tìm kiếm và người xem tắt tiếng)
    writeFileSync(join(dirname(resolve(args.out)), 'captions.srt'), toSrt(timings.map((t, i) => ({ ...t, text: plain(script.scenes[i].voiceover) }))));

    const result = { duration, scenes: timings.map(({ start, dur }) => ({ start, dur })), music: music ? music.split('/').at(-1) : null };
    writeFileSync(join(dirname(resolve(args.out)), 'result.json'), JSON.stringify(result));
    log(`xong: ${args.out} (${duration}s)`);
}

main().catch((e) => {
    console.error(e.stderr?.toString?.() || '');
    console.error(`[render] LỖI: ${e.message}`);
    process.exit(1);
});
