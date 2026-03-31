import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createReview, getProductById } from "@/lib/repository";
import { reviewSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "Vui lòng đăng nhập để đánh giá sản phẩm." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dữ liệu đánh giá không hợp lệ." },
      { status: 400 },
    );
  }

  const product = await getProductById(parsed.data.productId);
  if (!product) {
    return NextResponse.json({ message: "Không tìm thấy sản phẩm để đánh giá." }, { status: 404 });
  }

  try {
    const review = await createReview({
      ...parsed.data,
      user,
    });

    return NextResponse.json({
      message: "Đánh giá của bạn đã được ghi nhận và đang chờ quản trị viên duyệt.",
      review,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Không thể gửi đánh giá lúc này.",
      },
      { status: 400 },
    );
  }
}
