import { NextResponse } from "next/server";
import { getSessionUser, setSessionCookie } from "@/lib/auth";
import { updateCustomerProfile } from "@/lib/repository";
import { profileSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ message: "Vui lòng đăng nhập để cập nhật thông tin." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const user = await updateCustomerProfile(sessionUser.id, parsed.data);
    await setSessionCookie(user);

    return NextResponse.json({
      message: "Cập nhật thông tin thành công.",
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể cập nhật thông tin." },
      { status: 400 },
    );
  }
}
