"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers";
import { formatCurrency } from "@/lib/utils";

export function CheckoutForm() {
  const router = useRouter();
  const { cart, clearCart, user } = useStore();
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          phone: formData.get("phone"),
          address: formData.get("address"),
          paymentMethod: formData.get("paymentMethod"),
          note: formData.get("note"),
          items: cart,
        }),
      });

      const result = await response.json();
      setStatus(
        result.orderId ? `${result.message} Mã đơn của bạn là ${result.orderId}.` : result.message,
      );

      if (response.ok) {
        clearCart();
        form.reset();
        router.push(result.orderId ? `/orders/${result.orderId}` : "/orders");
        router.refresh();
        return;
      }
    } catch {
      setStatus("Không thể đặt hàng lúc này. Vui lòng thử lại.");
    }

    setIsSubmitting(false);
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="checkout-grid">
      <form className="card form-card" onSubmit={handleSubmit}>
        <h2>Thông tin thanh toán</h2>
        <p className="helper-text">Đặt hàng với tài khoản: {user?.email}</p>
        <input name="fullName" placeholder="Họ và tên" required />
        <input name="phone" placeholder="Số điện thoại" required />
        <input name="address" placeholder="Địa chỉ giao hàng" required />
        <select name="paymentMethod" defaultValue="cod">
          <option value="cod">Thanh toán khi nhận hàng</option>
          <option value="bank">Chuyển khoản ngân hàng</option>
          <option value="online">Thanh toán online</option>
        </select>
        <textarea name="note" placeholder="Ghi chú cho đơn hàng" rows={4} />
        <button type="submit" className="primary-button" disabled={isSubmitting || cart.length === 0}>
          {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
        </button>
        {status ? <p className="helper-text">{status}</p> : null}
      </form>

      <div className="card order-summary">
        <h3>Tóm tắt đơn hàng</h3>
        {cart.length === 0 ? <p>Chưa có sản phẩm trong giỏ.</p> : null}
        {cart.map((item) => (
          <div key={item.id} className="summary-row">
            <span>
              {item.name} x {item.quantity}
            </span>
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
          </div>
        ))}
        <div className="summary-row total">
          <span>Tổng cộng</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </div>
    </div>
  );
}
