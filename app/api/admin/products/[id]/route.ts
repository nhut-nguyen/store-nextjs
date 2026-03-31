import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/repository";
import { adminProductSchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = adminProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    return NextResponse.json(await updateProduct(id, parsed.data));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể cập nhật sản phẩm." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể xóa sản phẩm." },
      { status: 400 },
    );
  }
}
