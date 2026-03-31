import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { changeUserPassword } from "@/lib/repository";
import { changePasswordSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ message: "Vui lòng đăng nhập để đổi mật khẩu." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    await changeUserPassword(sessionUser.id, {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    return NextResponse.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể đổi mật khẩu." },
      { status: 400 },
    );
  }
}
