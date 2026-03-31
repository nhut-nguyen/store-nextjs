import { NextResponse } from "next/server";
import { createAdminUser, getUsers } from "@/lib/repository";
import { adminUserSchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json(await getUsers());
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adminUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const user = await createAdminUser(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể tạo người dùng." },
      { status: 400 },
    );
  }
}
