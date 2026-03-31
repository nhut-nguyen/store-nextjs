import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/orders");
  }

  return (
    <section className="section auth-section">
      <AuthForm title="Đăng nhập tài khoản" endpoint="/api/auth/login" />
      <p className="auth-links">
        <Link href="/auth/register">Tạo tài khoản</Link>
        <Link href="/auth/forgot-password">Quên mật khẩu</Link>
      </p>
    </section>
  );
}
