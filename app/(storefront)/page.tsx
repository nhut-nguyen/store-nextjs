import Link from "next/link";
import { CategoryGrid } from "@/components/category-grid";
import { FlashSaleSection } from "@/components/flash-sale-section";
import { HomeHero } from "@/components/home-hero";
import { NewsCard } from "@/components/news-card";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { getBlogPosts, getCategories, getFeaturedProducts, getProducts, getSaleProducts } from "@/lib/repository";

export default async function HomePage() {
  const [featured, sale, categoryItems, posts, allProducts] = await Promise.all([
    getFeaturedProducts(),
    getSaleProducts(),
    getCategories(),
    getBlogPosts(),
    getProducts(),
  ]);

  return (
    <>
      <HomeHero />

      <FlashSaleSection products={sale.length ? sale : allProducts.slice(0, 5)} />

      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow="Danh mục nổi bật"
            title="Mua sắm theo nhóm sản phẩm"
            description="Đủ các nhóm trang được yêu cầu trong file mô tả đồ án."
          />
          <CategoryGrid items={categoryItems} />
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <SectionTitle
            eyebrow="Sản phẩm nổi bật"
            title="Những cấu hình và thiết bị đang được quan tâm"
            action={
              <Link href="/products" className="secondary-button">
                Xem tất cả
              </Link>
            }
          />
          <div className="product-grid product-grid-fixed">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow="Khuyến mãi"
            title="Deal hấp dẫn cho gaming gear và flagship"
            description="Block sản phẩm giảm giá để đáp ứng yêu cầu khuyến mãi ở trang chủ."
          />
          <div className="product-grid product-grid-fixed">
            {sale.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <SectionTitle
            eyebrow="Mặt hàng mới"
            title="Nhiều lựa chọn hơn cho laptop, điện thoại và góc làm việc"
            description="Bổ sung thêm mặt hàng để trang chủ dày nội dung và sát mô hình siêu thị công nghệ hơn."
          />
          <div className="product-grid product-grid-fixed">
            {allProducts.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <SectionTitle
            eyebrow="Tin tức"
            title="Bài viết tư vấn và review công nghệ"
            action={
              <Link href="/blog" className="secondary-button">
                Đọc blog
              </Link>
            }
          />
          <div className="news-grid">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
