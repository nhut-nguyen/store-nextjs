import { NextResponse } from "next/server";
import { getProducts } from "@/lib/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const data = await getProducts({
    category: searchParams.get("category") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    search: searchParams.get("q") ?? undefined,
    priceRange: searchParams.get("price") ?? undefined,
  });

  return NextResponse.json(data);
}

