import { CategoryManager } from "@/components/admin/category-manager";

export default function AdminCategoriesPage() {
  return (
    <div className="admin-stack">
      <div className="page-head admin-page-head">
        <p className="eyebrow">Quản lý danh mục</p>
        <h1>Thêm loại sản phẩm</h1>
      </div>
      <CategoryManager />
    </div>
  );
}
