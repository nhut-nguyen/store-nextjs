import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createOrder } from "@/lib/repository";
import { checkoutSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "Vui lòng đăng nhập để đặt hàng." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const isItemsIssue = firstIssue?.path?.[0] === "items";
    return NextResponse.json(
      { message: isItemsIssue ? "Giỏ hàng đang trống." : firstIssue?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  const order = await createOrder({
    userId: user.id,
    customerEmail: user.email,
    customerName: parsed.data.fullName,
    ...parsed.data,
    items: parsed.data.items,
    total: parsed.data.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  });

  const response = NextResponse.json({
    message: "Đặt hàng thành công.",
    orderId: order.id,
  });

  response.cookies.set("gearhub-last-order-id", order.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/orders",
    maxAge: 60 * 10,
  });

  return response;
}
