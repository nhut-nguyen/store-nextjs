import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ReviewForm } from "@/components/review-form";
import { getSessionUser } from "@/lib/auth";
import { getProductBySlug, getProducts, getReviewByProductAndUser, getReviewsByProduct } from "@/lib/repository";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProductActions } from "@/components/product-actions";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, productReviews, user] = await Promise.all([
    getProducts({ category: product.categoryId }),
    getReviewsByProduct(product.id),
    getSessionUser(),
  ]);
  const existingReview = user ? await getReviewByProductAndUser(product.id, user.id) : null;
  const hasReviewed = Boolean(existingReview);

  return (
    <section className="section">
      <div className="container">
        <div className="product-detail">
          <ProductGallery name={product.name} image={product.image} gallery={product.gallery} />

          <div className="card detail-info">
            <p className="pill">{product.brand}</p>
            <h1>{product.name}</h1>
            <div className="price-line detail-price">
              <strong>{formatCurrency(product.price)}</strong>
              {product.originalPrice ? <span>{formatCurrency(product.originalPrice)}</span> : null}
            </div>
            <p>{product.description}</p>
            <div className="spec-grid">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="spec-item">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <ProductActions product={product} />
          </div>
        </div>

        <div className="detail-sections">
          <div className="card">
            <h2>Mô tả sản phẩm</h2>
            <p>{product.shortDescription}</p>
            <p>{product.description}</p>
          </div>

          <div className="card">
            <h2>Đánh giá sản phẩm</h2>
            <div className="review-summary">
              <strong>{product.rating.toFixed(1)}/5</strong>
              <span>{product.reviewCount} lượt đánh giá</span>
            </div>
            <ReviewForm productId={product.id} hasReviewed={hasReviewed} reviewStatus={existingReview?.status} />
            {productReviews.map((review) => (
              <div key={review.id} className="review-row">
                <div className="review-head">
                  <strong>{review.author}</strong>
                  <span>{review.rating}/5</span>
                </div>
                <p>{review.comment}</p>
                <small>{formatDate(review.createdAt)}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="section-spacer">
          <h2>Sản phẩm liên quan</h2>
          <div className="product-grid">
            {relatedProducts
              .filter((item) => item.id !== product.id)
              .slice(0, 3)
              .map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
