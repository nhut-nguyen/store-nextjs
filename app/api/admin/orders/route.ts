import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/repository";
import { adminOrderSchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json(await getOrders());
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adminOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể tạo đơn hàng." },
      { status: 400 },
    );
  }
}
