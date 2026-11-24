import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toSrt } from '../lib/srt.mjs';

test('phụ đề SRT theo mốc từng từ, cắt dòng theo câu và độ dài, cộng giờ bắt đầu cảnh', () => {
    const srt = toSrt([
        { start: 0, voiceAt: 0.3, words: [{ t: 0, d: 0.3, w: 'Web' }, { t: 0.3, d: 0.3, w: 'chậm' }, { t: 0.6, d: 0.4, w: 'mất khách.' }, { t: 1.1, d: 0.3, w: 'Sửa' }, { t: 1.4, d: 0.3, w: 'ngay!' }] },
        { start: 2.5, voiceAt: 0.3, words: [{ t: 0.1, d: 0.5, w: 'example' }] },
    ]);
    assert.equal(srt, [
        '1\n00:00:00,300 --> 00:00:01,300\nWeb chậm mất khách.\n',
        '2\n00:00:01,400 --> 00:00:02,000\nSửa ngay!\n',
        '3\n00:00:02,900 --> 00:00:03,400\nexample\n',
    ].join('\n'));
});

test('lấy dấu câu từ lời thoại gốc khi số từ khớp', () => {
    const srt = toSrt([{ start: 0, voiceAt: 0, text: 'Web chậm? Sửa ngay.', words: [{ t: 0, d: 0.2, w: 'Web' }, { t: 0.2, d: 0.2, w: 'chậm' }, { t: 0.5, d: 0.2, w: 'Sửa' }, { t: 0.7, d: 0.2, w: 'ngay' }] }]);
    assert.match(srt, /Web chậm\?\n/);
    assert.match(srt, /Sửa ngay\.\n/);
});
