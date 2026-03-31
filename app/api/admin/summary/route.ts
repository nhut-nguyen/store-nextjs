import { NextResponse } from "next/server";
import { getAdminSummary } from "@/lib/repository";

export async function GET() {
  return NextResponse.json(await getAdminSummary());
}
