import { CartClient } from "@/components/cart-client";

export default function CartPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Giỏ hàng</p>
          <h1>Quản lý sản phẩm đã thêm</h1>
        </div>
        <CartClient />
      </div>
    </section>
  );
}

