import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function ForgotPasswordPage() {
  return (
    <section className="section auth-section">
      <AuthForm title="Khôi phục mật khẩu" endpoint="/api/auth/forgot-password" />
      <p className="auth-links">
        <Link href="/auth/login">Quay lại đăng nhập</Link>
      </p>
    </section>
  );
}

