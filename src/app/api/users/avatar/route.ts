import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "public");

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; role: string };
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const targetId = (formData.get("userId") as string | null) || sessionUser.id;

  if (!file) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  if (targetId !== sessionUser.id && sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowedMime.includes(file.type) && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten archivos de imagen" }, { status: 400 });
  }

  const mimeExt: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "jpg", "image/heif": "jpg" };
  const ext = mimeExt[file.type] ?? file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo no puede pesar más de 5 MB" }, { status: 400 });
  }

  const dir = path.join(DATA_DIR, "avatars");
  await mkdir(dir, { recursive: true });

  const filename = `${targetId}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const useApiRoute = !!process.env.DATA_DIR;
  const avatarPath = useApiRoute ? `/api/file/avatars/${filename}` : `/avatars/${filename}`;
  await prisma.user.update({ where: { id: targetId }, data: { avatarPath } });

  return NextResponse.json({ avatarPath });
}
