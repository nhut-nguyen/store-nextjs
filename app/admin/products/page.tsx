import { ProductManager } from "@/components/admin/product-manager";

export default function AdminProductsPage() {
  return (
    <div className="admin-stack">
      <div className="page-head admin-page-head">
        <p className="eyebrow">Quản lý sản phẩm</p>
        <h1>Thêm, sửa, xóa và upload hình</h1>
      </div>
      <ProductManager />
    </div>
  );
}
