import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const uploadDir = path.join(process.cwd(), "public", "uploads", "admin-products");

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ message: "Chưa có file ảnh nào được chọn." }, { status: 400 });
  }

  await mkdir(uploadDir, { recursive: true });

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const extension = path.extname(file.name) || ".png";
      const baseName = sanitizeFileName(path.basename(file.name, extension)) || "product-image";
      const fileName = `${baseName}-${randomUUID()}${extension}`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(filePath, buffer);

      return {
        name: file.name,
        url: `/uploads/admin-products/${fileName}`,
      };
    }),
  );

  return NextResponse.json({ files: uploaded }, { status: 201 });
}
