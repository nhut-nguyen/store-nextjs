import { NextResponse } from "next/server";
import { createProduct, getProducts } from "@/lib/repository";
import { adminProductSchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json(await getProducts());
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adminProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể tạo sản phẩm." },
      { status: 400 },
    );
  }
}
