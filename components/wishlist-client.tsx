"use client";

import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/providers";
import { Product } from "@/lib/types";

export function WishlistClient({ products }: { products: Product[] }) {
  const { wishlist } = useStore();
  const likedProducts = products.filter((product) => wishlist.includes(product.id));

  if (!likedProducts.length) {
    return (
      <div className="empty-state card">
        <h2>Danh sách yêu thích đang trống</h2>
        <p>Nhấn biểu tượng tim ở sản phẩm để lưu lại món bạn muốn mua.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {likedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

