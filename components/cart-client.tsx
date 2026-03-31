"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useStore } from "@/components/providers";
import { formatCurrency } from "@/lib/utils";

export function CartClient() {
  const { cart, isHydrated, removeFromCart, updateQuantity, user } = useStore();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isHydrated) {
    return (
      <div className="empty-state card">
        <h2>Đang tải giỏ hàng</h2>
        <p>Đông Quân GearHub đang đồng bộ sản phẩm bạn đã thêm.</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="empty-state card">
        <h2>Giỏ hàng đang trống</h2>
        <p>Hãy quay lại danh mục để thêm sản phẩm vào giỏ hàng.</p>
        <Link href="/products" className="primary-button">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-items">
        {cart.map((item) => (
          <article key={item.id} className="card cart-item">
            <div className="cart-thumb">
              <Image src={item.image} alt={item.name} fill sizes="120px" />
            </div>
            <div>
              <Link href={`/products/${item.slug}`} className="product-title">
                {item.name}
              </Link>
              <p>{formatCurrency(item.price)}</p>
            </div>
            <div className="quantity-box">
              <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                -
              </button>
              <span>{item.quantity}</span>
              <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                +
              </button>
            </div>
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
            <button type="button" className="ghost-icon" onClick={() => removeFromCart(item.id)}>
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </div>
      <div className="card cart-summary">
        <h3>Tổng đơn hàng</h3>
        <div className="summary-row">
          <span>Tạm tính</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div className="summary-row">
          <span>Phí vận chuyển</span>
          <strong>Miễn phí</strong>
        </div>
        <div className="summary-row total">
          <span>Tổng thanh toán</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        {user ? (
          <Link href="/checkout" className="primary-button">
            Thanh toán
          </Link>
        ) : (
          <div className="stack-sm">
            <p className="helper-text">Đăng nhập để lưu đơn hàng và xem lịch sử mua hàng.</p>
            <Link href="/auth/login" className="primary-button">
              Đăng nhập để thanh toán
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
