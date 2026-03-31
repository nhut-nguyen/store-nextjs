import { OrderManager } from "@/components/admin/order-manager";

export default function AdminOrdersPage() {
  return (
    <div className="admin-stack">
      <div className="page-head admin-page-head">
        <p className="eyebrow">Quản lý đơn hàng</p>
        <h1>Xem đơn, xác nhận và cập nhật giao hàng</h1>
      </div>
      <OrderManager />
    </div>
  );
}
