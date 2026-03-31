"use client";

import { Heart, ShoppingCart } from "lucide-react";
import { useStore } from "@/components/providers";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductActions({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const liked = wishlist.includes(product.id);

  return (
    <div className="action-row">
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
        Thêm vào giỏ hàng
      </button>
      <button
        type="button"
        className={cn("secondary-button", liked && "secondary-button-active")}
        onClick={() => toggleWishlist(product.id)}
      >
        <Heart size={16} />
        Yêu thích
      </button>
    </div>
  );
}

