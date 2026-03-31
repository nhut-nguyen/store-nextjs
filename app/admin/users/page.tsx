import { UserManager } from "@/components/admin/user-manager";

export default function AdminUsersPage() {
  return (
    <div className="admin-stack">
      <div className="page-head admin-page-head">
        <p className="eyebrow">Quản lý người dùng</p>
        <h1>Xem user và khóa tài khoản</h1>
      </div>
      <UserManager />
    </div>
  );
}
