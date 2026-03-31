import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { getSessionUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Tài khoản</p>
          <h1>Thông tin cá nhân</h1>
          <p>Cập nhật hồ sơ, đổi mật khẩu và giữ thông tin giao dịch của bạn luôn chính xác.</p>
        </div>

        <div className="card account-overview">
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
            <p>{user.phone || "Chưa cập nhật số điện thoại"}</p>
            <p>{user.address || "Chưa cập nhật địa chỉ nhận hàng"}</p>
          </div>
        </div>

        <AccountSettings />
      </div>
    </section>
  );
}
