# Bộ render video ngắn (repo mẫu)

Repo này là **mẫu**: bạn tạo một bản riêng trong tài khoản GitHub của mình, app Auto Marketing AI gửi kịch bản sang và
GitHub Actions dựng video 9:16 (Reels / Shorts / TikTok) miễn phí bằng phút Actions của bạn. Repo không chứa khóa API
nào: kịch bản do app viết sẵn, mỗi lần render app gửi một đường link có chữ ký (hết hạn sau vài giờ) để tải kịch bản và
gửi video về.

## Cài đặt (khoảng 5 phút, làm một lần cho cả tài khoản)

### 1. Tạo repo của bạn từ mẫu này

1. Bấm nút xanh **Use this template** › **Create a new repository** (góc trên bên phải trang này).
2. Owner: tài khoản (hoặc tổ chức) của bạn. Tên repo: tùy ý, ví dụ `video-renderer`.
3. Chọn **Private**. Tài khoản GitHub miễn phí có **2.000 phút Actions mỗi tháng** cho repo Private; mỗi video mất khoảng
   **5–10 phút**, tức khoảng 200–400 video mỗi tháng.
4. Bấm **Create repository**.

### 2. Tạo token chỉ dùng cho repo đó

1. Trên GitHub: ảnh đại diện › **Settings** › **Developer settings** › **Personal access tokens** › **Fine-grained tokens**
   › **Generate new token** (hoặc mở thẳng https://github.com/settings/personal-access-tokens/new).
2. Token name: ví dụ `auto-marketing-render`. Expiration: chọn dài (ví dụ 1 năm).
3. **Repository access**: chọn **Only select repositories** rồi chọn đúng repo vừa tạo.
4. **Permissions › Repository permissions**:
   - **Actions**: Read and write (để app bấm chạy workflow render);
   - **Contents**: Read-only (để kiểm tra nhánh).
5. Bấm **Generate token** và chép token (bắt đầu bằng `github_pat_`). GitHub chỉ hiện token một lần.

### 3. Dán vào app

1. Trong app: **Cài đặt** › mục **Render video (GitHub)**.
2. Repo: `ten-cua-ban/ten-repo` (dán cả link repo cũng được). Nhánh: `main`. Token: token vừa tạo.
3. Bấm **Lưu và kiểm tra**. Thấy "Kết nối GitHub được" là xong: mọi brand trong tài khoản dùng chung repo này.

## Lỗi hay gặp khi bấm Kiểm tra

| App báo | Cách sửa |
| --- | --- |
| Token sai hoặc đã hết hạn | Tạo token mới (bước 2) rồi dán lại. |
| Token thiếu quyền | Sửa token: chọn đúng repo, Actions: Read and write, Contents: Read-only. |
| Không thấy repo hoặc workflow | Kiểm tra tên repo `owner/ten-repo`; repo phải tạo từ mẫu này nên có file `.github/workflows/render-video.yml`. |
| Workflow đang tắt | Mở tab **Actions** của repo, chọn **Render video**, bấm **Enable workflow**. |
| Không có nhánh | Sửa ô Nhánh trong app cho đúng nhánh của repo (thường là `main`). |

## Theo dõi và xử lý sự cố

- Mỗi video là một lần chạy trong tab **Actions** › **Render video** của repo bạn. Video lỗi thì app hiện link log ở mục
  Video; file trung gian được lưu 3 ngày (Artifacts) để xem lại.
- Hết phút Actions trong tháng thì video chờ tới tháng sau, hoặc bật thanh toán Actions trong GitHub.
- App tự giới hạn số video render cùng lúc cho mỗi tài khoản và xoay vòng giữa các brand, bạn không cần chỉnh gì ở repo.

## Cập nhật bộ render

Repo tạo từ mẫu không tự nhận bản mới. Khi app báo cần cập nhật bộ render (hoặc video lỗi vì mẫu cũ):

1. Mở repo mẫu, tải bản mới của thư mục `video/` và file `.github/workflows/render-video.yml`.
2. Thay vào repo của bạn (kéo thả trên GitHub: **Add file** › **Upload files**), commit lên nhánh `main`.

Hoặc tạo lại repo từ mẫu (bước 1), tạo token mới cho repo đó (bước 2) rồi dán lại trong app (bước 3).

## Nội dung repo

- `video/`: bộ dựng video (Node 22 + HyperFrames, edge-tts đọc giọng, ffmpeg).
- `.github/workflows/render-video.yml`: workflow được app gọi qua GitHub API (`workflow_dispatch`) cho từng video.

Repo này được đồng bộ tự động từ mã nguồn của app; đừng gửi thay đổi trực tiếp vào repo mẫu.
