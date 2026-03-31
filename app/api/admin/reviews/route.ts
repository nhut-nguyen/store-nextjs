import { NextResponse } from "next/server";
import { getProducts, getReviews } from "@/lib/repository";

export async function GET() {
  const [reviews, products] = await Promise.all([getReviews(), getProducts()]);
  const productMap = new Map(products.map((item) => [item.id, item]));

  return NextResponse.json(
    reviews.map((review) => {
      const product = productMap.get(review.productId);
      return {
        ...review,
        productName: product?.name ?? "Sản phẩm không xác định",
        productSlug: product?.slug ?? null,
      };
    }),
  );
}
