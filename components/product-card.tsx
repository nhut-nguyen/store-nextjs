"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useStore } from "@/components/providers";
import { Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const liked = wishlist.includes(product.id);

  return (
    <article className="card product-card">
      <div className="product-media">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" />
        <button
          type="button"
          aria-label="wishlist"
          className={cn("wishlist-btn", liked && "wishlist-btn-active")}
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart size={16} />
        </button>
        {product.onSale ? <span className="badge sale">Sale</span> : null}
        {product.isNew ? <span className="badge new">New</span> : null}
      </div>
      <div className="product-body">
        <p className="brand-line">{product.brand}</p>
        <Link href={`/products/${product.slug}`} className="product-title">
          {product.name}
        </Link>
        <div className="rating-line">
          <Star size={16} fill="currentColor" />
          <span>{product.rating}</span>
          <small>({product.reviewCount} đánh giá)</small>
        </div>
        <div className="price-line">
          <strong>{formatCurrency(product.price)}</strong>
          {product.originalPrice ? <span>{formatCurrency(product.originalPrice)}</span> : null}
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            addToCart({
              id: product.id,
              image: product.image,
              name: product.name,
              slug: product.slug,
              price: product.price,
            })
          }
        >
          <ShoppingCart size={16} />
          Thêm vào giỏ
        </button>
      </div>
    </article>
  );
}

