// Giới thiệu dự án: ảnh chụp web thật cuộn trong khung trình duyệt, Vấn đề → Giải pháp → Kết quả.
import { ctaScene, hookScene, pointScene } from './base.mjs';

export const css = '';

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);
    return pointScene(scene, t, ctx);
}
