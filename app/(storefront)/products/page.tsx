import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { getCategories, getProducts } from "@/lib/repository";

const PAGE_SIZE = 6;

type PromoConfig = {
  title: string;
  description: string;
  filters: {
    category?: string;
    brand?: string;
    priceRange?: "under-10" | "10-30" | "30-plus";
    search?: string;
  };
};

const promoMap: Record<string, PromoConfig> = {
  "flash-hour": {
    title: "Giờ vàng giá sốc",
    description: "Những sản phẩm ưu đãi theo khung giờ giới hạn trên trang chủ.",
    filters: { priceRange: "under-10" as const, search: "gaming" },
  },
  "month-sale": {
    title: "Khuyến mãi tháng này",
    description: "Tổng hợp các sản phẩm nổi bật đang có mức giảm mạnh.",
    filters: { priceRange: "30-plus" as const },
  },
  "gift-100k": {
    title: "Deal bộ quà 100K",
    description: "Phụ kiện và gear đi kèm đang có ưu đãi quà tặng nhỏ, dễ mua nhanh.",
    filters: { category: "cat-accessory", priceRange: "under-10" as const },
  },
  "build-pc": {
    title: "Build PC tiết kiệm",
    description: "Những cấu hình PC và desktop build sẵn đang được ưu đãi tốt.",
    filters: { category: "cat-pc" },
  },
  "laptop-bundle": {
    title: "Ưu đãi bộ quà laptop",
    description: "Laptop đi kèm balo, chuột hoặc phụ kiện học tập, làm việc.",
    filters: { category: "cat-laptop" },
  },
  "monitor-deal": {
    title: "Màn hình mua là có quà",
    description: "Nhóm màn hình gaming và văn phòng đang có quà tặng hoặc giá tốt.",
    filters: { category: "cat-monitor" },
  },
  "apple-bundle": {
    title: "Combo iPhone và Apple",
    description: "Các thiết bị Apple nổi bật cùng những chương trình quà tặng kèm.",
    filters: { brand: "Apple" },
  },
} as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const promo = typeof params.promo === "string" ? params.promo : undefined;
  const promoConfig = promo ? promoMap[promo as keyof typeof promoMap] : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const brand = typeof params.brand === "string" ? params.brand : undefined;
  const priceRange = typeof params.price === "string" ? params.price : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1");

  const effectiveCategory = category ?? promoConfig?.filters.category;
  const effectiveBrand = brand ?? promoConfig?.filters.brand;
  const effectivePriceRange = priceRange ?? promoConfig?.filters.priceRange;
  const effectiveSearch = q ?? promoConfig?.filters.search;

  const [products, categories] = await Promise.all([
    getProducts({
      category: effectiveCategory,
      brand: effectiveBrand,
      search: effectiveSearch,
      priceRange: effectivePriceRange,
    }),
    getCategories(),
  ]);

  const brands = [...new Set(products.map((product) => product.brand))];
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const paginated = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="section">
      <div className="container">
        <SectionTitle
          eyebrow="Danh mục sản phẩm"
          title={promoConfig?.title ?? "Laptop, PC, điện thoại, màn hình và phụ kiện"}
          description={promoConfig?.description ?? "Có tìm kiếm, lọc theo hãng và giá, cùng phân trang."}
        />

        <div className="catalog-layout">
          <aside className="card filter-panel">
            <h3>Bộ lọc</h3>
            <form className="filter-form">
              {promo ? <input type="hidden" name="promo" value={promo} /> : null}
              <label>
                Từ khóa
                <input name="q" defaultValue={effectiveSearch} placeholder="Ví dụ: gaming, ASUS" />
              </label>
              <label>
                Danh mục
                <select name="category" defaultValue={effectiveCategory ?? ""}>
                  <option value="">Tất cả</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Hãng
                <select name="brand" defaultValue={effectiveBrand ?? ""}>
                  <option value="">Tất cả</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Giá
                <select name="price" defaultValue={effectivePriceRange ?? ""}>
                  <option value="">Tất cả</option>
                  <option value="under-10">Dưới 10 triệu</option>
                  <option value="10-30">10 - 30 triệu</option>
                  <option value="30-plus">Trên 30 triệu</option>
                </select>
              </label>
              <button type="submit" className="primary-button">
                Áp dụng
              </button>
            </form>
          </aside>

          <div>
            <div className="catalog-head">
              <strong>{products.length} sản phẩm</strong>
              <span>Kết quả tìm kiếm và lọc</span>
            </div>

            <div className="product-grid">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} searchParams={params} />
          </div>
        </div>
      </div>
    </section>
  );
}
