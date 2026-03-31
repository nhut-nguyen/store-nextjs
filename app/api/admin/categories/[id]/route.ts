import { NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/repository";
import { adminCategorySchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = adminCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    return NextResponse.json(await updateCategory(id, parsed.data));
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: number }).status) : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể cập nhật danh mục." },
      { status: Number.isFinite(status) ? status : 400 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: number }).status) : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể xóa danh mục." },
      { status: Number.isFinite(status) ? status : 400 },
    );
  }
}
