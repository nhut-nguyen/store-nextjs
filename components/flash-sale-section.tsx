import Image from "next/image";
import Link from "next/link";
import { FlashSaleCountdown } from "@/components/flash-sale-countdown";
import { ProductCard } from "@/components/product-card";
import { Product } from "@/lib/types";

export function FlashSaleSection({ products }: { products: Product[] }) {
  return (
    <section className="flash-sale-section">
      <div className="container">
        <div className="flash-sale-shell">
          <div className="flash-sale-feature">
            <span className="flash-badge">GIỜ VÀNG</span>
            <h2>Giá tốt hơn khi mua online</h2>
            <p>Mỗi khách hàng được mua tối đa 1 sản phẩm trong chương trình. Khung giờ áp dụng từ 10h đến 14h hằng ngày.</p>
            <FlashSaleCountdown />
            <Link href="/products?promo=flash-hour" className="flash-cta">
              Khám phá ngay
            </Link>
            <div className="flash-feature-art">
              <Image
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
                alt="Flash sale"
                fill
                sizes="(max-width: 768px) 100vw, 22vw"
              />
            </div>
          </div>

          <div className="flash-sale-products">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flash-product-card">
                <span className="flash-discount">
                  Giảm{" "}
                  {product.originalPrice
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 8}
                  %
                </span>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
