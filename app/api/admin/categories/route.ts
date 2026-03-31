import { NextResponse } from "next/server";
import { createCategory, getCategories } from "@/lib/repository";
import { adminCategorySchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json(await getCategories({ includeInactive: true }));
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adminCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const category = await createCategory(parsed.data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: number }).status) : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể tạo danh mục." },
      { status: Number.isFinite(status) ? status : 400 },
    );
  }
}
