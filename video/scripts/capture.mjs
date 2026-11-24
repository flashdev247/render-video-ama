// Chụp trang web thật cho mẫu site-tour: mở trang ở khung điện thoại 390×844 bằng Chrome có sẵn của HyperFrames,
// cuộn hết trang cho ảnh lazy-load hiện, chụp toàn trang (JPEG, mật độ 2x) và tìm vị trí từng chữ cần chỉ vào.
// Không bấm thật (không rời trang): cảnh "tap" chỉ dựng con trỏ + vòng sóng trên ảnh chụp.
// Chữ có giá tiền trên trang được làm mờ (video không ghi giá, giá trên web có thể đổi sau khi video đã đăng).
// Laravel chạy trước khi AI viết kịch bản (bước đọc mốc chữ của trang, Chrome = CHROME_PATH):
// node video/scripts/capture.mjs --brief brief.json (ghi facts.tour.landmarks = chữ đang hiện trên trang, để AI chỉ chọn chữ
// có thật). Lúc render trên GitHub Actions thì capture() chụp lại trang. Thử tay: node scripts/capture.mjs --url https://… --target "…" --out work/
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const VIEWPORT = { width: 390, height: 844 };
const MAX_HEIGHT = 8000; // px CSS: trang dài hơn thì chỉ chụp phần đầu

// Giống MONEY trong lib/rules.mjs
const MONEY_SOURCE = String.raw`\d[\d.,]*\s*(k|đ|₫|vnđ|vnd|đồng|nghìn|ngàn|triệu|tr|củ|usd)(?![\p{L}\p{N}])|\$\s*\d`;


function chromePath() {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
    const out = execFileSync(process.execPath, [join(ROOT, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs'), 'browser', 'path'], {
        encoding: 'utf8',
        env: { ...process.env, HYPERFRAMES_TELEMETRY: '0', HYPERFRAMES_SKIP_SKILLS: '1' },
    });
    return out.trim().split('\n').at(-1).trim();
}

/**
 * @param {string} url trang cần chụp (https)
 * @param {string[]} targets chữ hiển thị trên trang (tiêu đề, nút…) cần chỉ vào
 * @returns {Promise<{file: string, width: number, height: number, points: Array<{target: string, found: boolean, rect: ?{x: number, y: number, w: number, h: number}}>}>}
 *          width/height theo px CSS; rect theo px CSS tính từ đầu trang
 */
export async function capture(url, targets, outDir) {
    return withPage(url, async (page, height) => {
        const points = await page.evaluate(findTargets, targets, MAX_HEIGHT);
        const file = join(outDir, 'page.jpg');
        await page.screenshot({ path: file, type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: VIEWPORT.width, height }, captureBeyondViewport: true });
        return { file, width: VIEWPORT.width, height, points };
    });
}

/** Chữ đang hiện trên trang (tiêu đề, nút, link), theo thứ tự từ trên xuống, tối đa 24 mục. */
export async function landmarks(url) {
    return withPage(url, (page) => page.evaluate((max, moneySource) => {
        const money = new RegExp(moneySource, 'iu');
        const clean = (t) => String(t ?? '').replace(/\s+/gu, ' ').trim();
        const seen = new Set();
        const out = [];
        for (const el of document.querySelectorAll('h1,h2,h3,a,button,[role=button]')) {
            const text = clean(el.innerText);
            const r = el.getBoundingClientRect();
            const y = r.top + window.scrollY;
            if (text.length < 3 || text.length > 60 || r.width < 8 || r.height < 8 || y > max - 40 || money.test(text)) continue;
            if (getComputedStyle(el).visibility === 'hidden' || seen.has(text.toLocaleLowerCase('vi'))) continue;
            seen.add(text.toLocaleLowerCase('vi'));
            out.push({ text, y });
        }
        return out.sort((a, b) => a.y - b.y).slice(0, 24).map((x) => x.text);
    }, MAX_HEIGHT, MONEY_SOURCE));
}

/** Tìm phần tử hiển thị khớp từng chữ (chạy trong trang): ưu tiên khớp nguyên văn, rồi chữ ngắn nhất chứa nó. */
function findTargets(list, max) {
    const clean = (t) => String(t ?? '').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('vi');
    const nodes = [...document.querySelectorAll('h1,h2,h3,h4,a,button,[role=button],label,summary,li,p,span,strong,div')];
    return list.map((target) => {
        const want = clean(target);
        let best = null;
        for (const el of nodes) {
            const text = clean(el.innerText);
            if (!text || !text.includes(want)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 4 || r.height < 4 || r.top + window.scrollY > max - 20) continue;
            const score = (text.length - want.length) * 1e6 + r.width * r.height;
            if (!best || score < best.score) best = { score, rect: { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height } };
        }
        return { target, found: Boolean(best), rect: best?.rect ?? null };
    });
}

async function withPage(url, fn) {
    if (!/^https:\/\//i.test(url)) throw new Error(`Chỉ chụp trang https: ${url}`);
    const browser = await puppeteer.launch({
        executablePath: chromePath(),
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--lang=vi-VN'],
    });
    try {
        const page = await browser.newPage();
        await page.setViewport({ ...VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 AutoMarketingAIRenderer/1.0');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'vi-VN,vi;q=0.9' });
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45_000 });

        // Cuộn dần xuống cho ảnh lazy-load và hiệu ứng "hiện khi cuộn tới" chạy, rồi về đầu trang
        await page.evaluate(async (max) => {
            const wait = (ms) => new Promise((r) => setTimeout(r, ms));
            for (let y = 0; y < Math.min(document.documentElement.scrollHeight, max); y += 500) {
                window.scrollTo(0, y);
                await wait(120);
            }
            window.scrollTo(0, 0);
            await wait(600);
        }, MAX_HEIGHT);
        await page.evaluate(() => document.fonts?.ready);
        // Làm mờ chữ có giá tiền
        await page.evaluate((moneySource) => {
            const money = new RegExp(moneySource, 'iu');
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                if (money.test(node.textContent) && node.parentElement) node.parentElement.style.filter = 'blur(7px)';
            }
        }, MONEY_SOURCE);

        const height = await page.evaluate((max) => Math.min(document.documentElement.scrollHeight, max), MAX_HEIGHT);
        return await fn(page, height);
    } finally {
        await browser.close();
    }
}

/** Vị trí cuộn (px CSS) để chữ cần chỉ nằm ở khoảng 1/3 màn hình. */
export function scrollFor(rect, pageHeight) {
    if (!rect) return null;
    return Math.round(Math.max(0, Math.min(rect.y - VIEWPORT.height * 0.32, pageHeight - VIEWPORT.height)));
}


if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    const { values } = parseArgs({
        options: { brief: { type: 'string' }, url: { type: 'string' }, target: { type: 'string', multiple: true, default: [] }, out: { type: 'string', default: '.' } },
    });
    if (values.brief) {
        const brief = JSON.parse(readFileSync(values.brief, 'utf8'));
        if (brief.template !== 'site-tour') process.exit(0);
        brief.facts.tour.landmarks = await landmarks(brief.facts.tour.url);
        if (brief.facts.tour.landmarks.length < 3) throw new Error(`Trang ${brief.facts.tour.url} có quá ít chữ để quay (${brief.facts.tour.landmarks.length}).`);
        writeFileSync(values.brief, JSON.stringify(brief, null, 2));
        console.log(`[capture] ${brief.facts.tour.landmarks.length} mốc chữ: ${brief.facts.tour.landmarks.join(' | ')}`);
    } else {
        const result = await capture(values.url, values.target, resolve(values.out));
        console.log(JSON.stringify(result, null, 2));
    }
}
