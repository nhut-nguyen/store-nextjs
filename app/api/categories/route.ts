import { NextResponse } from "next/server";
import { getCategories } from "@/lib/repository";

export async function GET() {
  return NextResponse.json(await getCategories());
}

