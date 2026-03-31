# AGENTS.md

## Mục tiêu dự án

Xây dựng website bán máy tính, laptop, điện thoại và phụ kiện bằng Next.js, có storefront cho khách hàng, khu vực admin quản trị và lớp dữ liệu có thể chạy bằng seed nội bộ hoặc kết nối SQL Server thật.

## Nguyên tắc làm việc cho agent

- Giữ nguyên kiến trúc App Router của Next.js.
- Ưu tiên thay đổi trong `app/`, `components/`, `lib/` và `database/`.
- Nếu chưa có SQL Server khả dụng, tiếp tục phát triển bằng dữ liệu mẫu trong `lib/data.ts`.
- Mặc định dự án này dùng SQL Server `192.168.1.168`, user `sa`, database `PRO_STORE_NEXTJS` qua biến môi trường trong `.env.local`.
- Khi bổ sung API hoặc logic dữ liệu, cập nhật cả `lib/repository.ts` để duy trì một điểm truy cập dữ liệu thống nhất.
- Không xóa các trang đã map theo yêu cầu trong `request.docx`.
- Mọi giao diện mới nên bám theo visual hiện tại: nền sáng, glassmorphism nhẹ, điểm nhấn cam và xanh ngọc.

## Cấu trúc chính

- `app/`: route pages và API routes
- `components/`: UI component tái sử dụng
- `lib/data.ts`: dữ liệu seed dùng khi chưa cấu hình SQL Server
- `lib/repository.ts`: data access layer
- `database/`: script tạo schema và seed SQL Server
- `scripts/init-db.mjs`: lệnh khởi tạo lại database `PRO_STORE_NEXTJS`

## Việc nên làm tiếp

- Thay auth demo bằng NextAuth hoặc JWT thật
- Thêm CRUD thật cho admin thông qua SQL Server
- Tách order item, wishlist thành bảng riêng trong SQL Server
- Thêm upload ảnh sản phẩm bằng object storage
