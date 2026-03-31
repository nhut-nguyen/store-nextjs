import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { authenticateUser } from "@/lib/repository";
import { authSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = authSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json(
        { message: "Email, mật khẩu hoặc trạng thái tài khoản không hợp lệ." },
        { status: 401 },
      );
    }

    await setSessionCookie(user);

    return NextResponse.json({
      message: "Đăng nhập thành công.",
      user,
    });
  } catch {
    return NextResponse.json(
      { message: "Đăng nhập tạm thời chưa khả dụng. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
