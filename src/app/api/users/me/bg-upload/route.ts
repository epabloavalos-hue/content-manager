import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "public");

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Máximo 10 MB" }, { status: 400 });

  const mimeExt: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const ext = mimeExt[file.type] ?? "jpg";

  const dir = path.join(DATA_DIR, "user-bg");
  await mkdir(dir, { recursive: true });

  const filename = `${userId}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const useApiRoute = !!process.env.DATA_DIR;
  const themeBgImage = useApiRoute
    ? `/api/file/user-bg/${filename}?t=${Date.now()}`
    : `/user-bg/${filename}?t=${Date.now()}`;

  await prisma.user.update({ where: { id: userId }, data: { themeBgImage, themeBg: "image" } });

  return NextResponse.json({ themeBgImage });
}
