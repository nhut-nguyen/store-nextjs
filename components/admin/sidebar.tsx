import Link from "next/link";
import { Boxes, LayoutDashboard, MessageSquareQuote, ShoppingBag, Tags, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: ShoppingBag },
  { href: "/admin/categories", label: "Danh mục", icon: Tags },
  { href: "/admin/orders", label: "Đơn hàng", icon: Boxes },
  { href: "/admin/reviews", label: "Đánh giá", icon: MessageSquareQuote },
  { href: "/admin/users", label: "Người dùng", icon: Users },
];

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div>
        <p className="eyebrow">Đông Quân GearHub</p>
        <h2>Máy tính - Laptop - Điện thoại</h2>
      </div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="admin-link">
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
