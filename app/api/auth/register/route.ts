import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { createUser } from "@/lib/repository";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const user = await createUser(parsed.data);
    await setSessionCookie(user);

    return NextResponse.json({
      message: "Tạo tài khoản thành công.",
      user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Không thể tạo tài khoản.",
      },
      { status: 400 },
    );
  }
}
