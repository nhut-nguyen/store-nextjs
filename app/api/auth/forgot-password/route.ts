import { NextResponse } from "next/server";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.email("Email không hợp lệ."),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Đã gửi hướng dẫn đặt lại mật khẩu tới email." });
}

