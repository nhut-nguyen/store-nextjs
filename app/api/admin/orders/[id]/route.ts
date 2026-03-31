import { NextResponse } from "next/server";
import { deleteOrder, updateOrder } from "@/lib/repository";
import { adminOrderSchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = adminOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    return NextResponse.json(await updateOrder(id, parsed.data));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể cập nhật đơn hàng." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể xóa đơn hàng." },
      { status: 400 },
    );
  }
}
