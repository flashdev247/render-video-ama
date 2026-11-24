import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrolls } from '../templates/site-tour.mjs';

const scenes = [{ type: 'hook' }, { type: 'tour' }, { type: 'tour' }, { type: 'tour' }, { type: 'cta' }];

test('site-tour: cuộn để chữ nằm ở 1/3 màn hình, kẹp trong trang', () => {
    const tour = { height: 3000, points: [{ rect: { y: 100 } }, { rect: { y: 1500 } }, { rect: { y: 2990 } }] };
    // 844 * 0.32 = 270: chữ ở đầu trang không cuộn, chữ cuối trang dừng ở đáy (3000 - 844)
    assert.deepEqual(scrolls(scenes, tour), [0, 1230, 2156]);
});

test('site-tour: không thấy chữ thì cuộn đều theo thứ tự cảnh', () => {
    const tour = { height: 2844, points: [{ rect: null }, { rect: { y: 1270 } }, { rect: null }] };
    assert.deepEqual(scrolls(scenes, tour), [500, 1000, 1500]);
});
