// Mẹo / lỗi thường gặp: mỗi ý một cảnh có số thứ tự lớn màu nhấn của brand.
import { ctaScene, hookScene, pointScene } from './base.mjs';

export const css = `
.tips .point .title { font-size: 76px; }
`;

export function renderScene(scene, t, ctx) {
    if (scene.type === 'hook') return hookScene(scene, t, ctx);
    if (scene.type === 'cta') return ctaScene(scene, t, ctx);
    return pointScene(scene, t, ctx, { badge: scene.index ?? null });
}
