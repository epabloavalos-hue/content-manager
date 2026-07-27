import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

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

  const filename = `user-bg/${userId}.${ext}`;
  const blob = await put(filename, file, { access: "public", addRandomSuffix: false });
  const themeBgImage = `${blob.url}?t=${Date.now()}`;

  await prisma.user.update({ where: { id: userId }, data: { themeBgImage, themeBg: "image" } });

  return NextResponse.json({ themeBgImage });
}
