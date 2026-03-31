"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers";
import { SessionUser } from "@/lib/types";

export function AuthForm({
  title,
  endpoint,
  includeName = false,
}: {
  title: string;
  endpoint: "/api/auth/login" | "/api/auth/register" | "/api/auth/forgot-password";
  includeName?: boolean;
}) {
  const router = useRouter();
  const { setUserSession } = useStore();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message);
      setIsSubmitting(false);
      return;
    }

    if (result.user) {
      setUserSession(result.user as SessionUser);
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(result.message);
    setIsSubmitting(false);
  }

  return (
    <form className="card form-card auth-card" onSubmit={handleSubmit}>
      <h1>{title}</h1>
      {includeName ? <input name="name" placeholder="Họ và tên" required /> : null}
      <input type="email" name="email" placeholder="Email" required />
      {endpoint !== "/api/auth/forgot-password" ? (
        <input type="password" name="password" placeholder="Mật khẩu" required />
      ) : null}
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? "Đang xử lý..." : "Tiếp tục"}
      </button>
      {endpoint === "/api/auth/login" ? (
        <p className="helper-text">
          Tài khoản mẫu: <code>hai@gmail.com</code> / <code>123456</code>,{" "}
          <code>trandongquan9@gmail.com</code> / <code>admin123</code>.
        </p>
      ) : null}
      {message ? <p className="helper-text">{message}</p> : null}
      {endpoint === "/api/auth/register" ? (
        <p className="helper-text">
          Tạo tài khoản xong sẽ tự động đăng nhập và giữ phiên ngay trên storefront.
        </p>
      ) : null}
      {endpoint === "/api/auth/forgot-password" ? (
        <p className="helper-text">
          Chức năng này đang ở mức demo. Bạn có thể quay lại <Link href="/auth/login">đăng nhập</Link>.
        </p>
      ) : null}
    </form>
  );
}
