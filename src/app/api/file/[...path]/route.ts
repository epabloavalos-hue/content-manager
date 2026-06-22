import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "public");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(DATA_DIR, ...segments);

  // Prevent path traversal
  if (!filePath.startsWith(DATA_DIR)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const file = await readFile(filePath);
    const ext = segments[segments.length - 1].split(".").pop()?.toLowerCase() ?? "";
    const mime: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
    return new NextResponse(file, {
      headers: {
        "Content-Type": mime[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
