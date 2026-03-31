import { WishlistClient } from "@/components/wishlist-client";
import { getProducts } from "@/lib/repository";

export default async function WishlistPage() {
  const products = await getProducts();

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Wishlist</p>
          <h1>Sản phẩm yêu thích</h1>
        </div>
        <WishlistClient products={products} />
      </div>
    </section>
  );
}

