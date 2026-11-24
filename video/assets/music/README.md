# Nhạc nền

3 bài nhạc không lời **tự tạo bằng code** (`scripts/make-audio.py`), thuộc về dự án, không lo bản quyền:

| File | Dùng cho mẫu | Nhịp |
|---|---|---|
| `upbeat.mp3` | `tips` (mẹo) | 112 BPM, vui tươi |
| `corporate.mp3` | `project-showcase` (dự án) | 100 BPM, chuyên nghiệp |
| `warm.mp3` | `review-quote` (đánh giá khách) | 88 BPM, ấm áp |

Mỗi bài là một vòng lặp liền (16 ô nhịp), `scripts/render.mjs` tự lặp đủ thời lượng, để ~22% và **tự nhỏ đi khi có giọng
đọc** (sidechain), vào nhẹ 0,3 giây, tắt dần 2 giây cuối. Mẫu chưa có trong bảng thì chọn bài cố định theo nội dung.

Tạo lại (cần `numpy` + ffmpeg, chỉ chạy trên máy, kết quả commit vào repo):

```bash
cd video && pip install numpy && python3 scripts/make-audio.py
```

Muốn dùng nhạc ngoài: thả file `<tên mẫu theo bảng>.mp3` thay file cũ. Chỉ dùng nhạc **được phép dùng thương mại, không cần ghi nguồn**.
