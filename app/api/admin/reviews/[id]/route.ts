import { NextResponse } from "next/server";
import { approveReview, deleteReview } from "@/lib/repository";

export async function PUT(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    return NextResponse.json(await approveReview(id));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể duyệt đánh giá." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể xóa đánh giá." },
      { status: 400 },
    );
  }
}
