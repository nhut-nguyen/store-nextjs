import { ReviewManager } from "@/components/admin/review-manager";

export default function AdminReviewsPage() {
  return (
    <div className="admin-stack">
      <div className="page-head admin-page-head">
        <p className="eyebrow">Quản lý đánh giá</p>
        <h1>Theo dõi phản hồi và xử lý đánh giá khách hàng</h1>
      </div>
      <ReviewManager />
    </div>
  );
}
