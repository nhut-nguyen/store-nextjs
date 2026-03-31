import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Mega sale tháng 3</p>
          <h1>Website bán hàng công nghệ hiện đại cho laptop, PC và điện thoại.</h1>
          <p>
            Giao diện ưu tiên cảm giác premium, có storefront đầy đủ, admin dashboard và lớp API sẵn sàng nối SQL
            Server.
          </p>
          <div className="hero-actions">
            <Link href="/products" className="primary-button">
              Mua sắm ngay
              <ArrowRight size={16} />
            </Link>
            <Link href="/admin" className="secondary-button">
              Xem trang admin
            </Link>
          </div>
          <div className="hero-points">
            <span>
              <Truck size={16} />
              Giao nhanh toàn quốc
            </span>
            <span>
              <ShieldCheck size={16} />
              Bảo hành chính hãng
            </span>
          </div>
        </div>
        <div className="hero-panel">
          <div className="promo-card">
            <small>Flash deal</small>
            <strong>Giảm đến 15%</strong>
            <p>Laptop gaming, flagship phone và gear cao cấp.</p>
          </div>
          <div className="stat-card">
            <span>250+</span>
            <p>Sản phẩm có thể mở rộng từ SQL Server</p>
          </div>
        </div>
      </div>
    </section>
  );
}

