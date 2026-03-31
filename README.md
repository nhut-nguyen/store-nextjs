# GearHub Store

Website bán hàng máy tính, laptop, điện thoại và phụ kiện được dựng bằng Next.js App Router, có API routes và lớp repository sẵn sàng kết nối SQL Server.

## Tính năng

- Trang chủ với banner, danh mục, sản phẩm nổi bật, khuyến mãi, tin tức và footer
- Danh mục sản phẩm có tìm kiếm, lọc, phân trang
- Chi tiết sản phẩm có gallery, thông số, đánh giá, thêm giỏ hàng, wishlist
- Giỏ hàng, checkout, đăng nhập, đăng ký, quên mật khẩu
- Blog công nghệ
- Admin dashboard: sản phẩm, danh mục, đơn hàng, người dùng, thống kê
- API routes cho products, categories, blog, auth, checkout
- SQL Server-ready repository cùng `database/schema.sql` và `database/seed.sql`

## Chạy dự án

```bash
npm install
cp .env.example .env.local
npm run dev
```

Nếu chưa cấu hình SQL Server, ứng dụng sẽ dùng dữ liệu mẫu trong `lib/data.ts`.

