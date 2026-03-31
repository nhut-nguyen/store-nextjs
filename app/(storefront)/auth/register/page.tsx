import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/orders");
  }

  return (
    <section className="section auth-section">
      <AuthForm title="Tạo tài khoản mới" endpoint="/api/auth/register" includeName />
      <p className="auth-links">
        <Link href="/auth/login">Đã có tài khoản</Link>
      </p>
    </section>
  );
}
