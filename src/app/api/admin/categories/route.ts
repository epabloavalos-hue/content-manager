import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cats = await prisma.eventCategory.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  const { label } = await req.json().catch(() => ({}));
  if (!label?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  const value = label.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
  const existing = await prisma.eventCategory.findUnique({ where: { value } });
  if (existing) return NextResponse.json({ error: "Ya existe esa categoría" }, { status: 409 });
  const last = await prisma.eventCategory.findFirst({ orderBy: { order: "desc" } });
  const cat = await prisma.eventCategory.create({ data: { value, label: label.trim(), order: (last?.order ?? -1) + 1 } });
  return NextResponse.json(cat);
}

export async function PATCH(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  const { id, label } = await req.json().catch(() => ({}));
  if (!id || !label?.trim()) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const cat = await prisma.eventCategory.update({ where: { id }, data: { label: label.trim() } });
  return NextResponse.json(cat);
}

export async function DELETE(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  await prisma.eventCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PUT — reorder: body = { ids: string[] } in desired order
export async function PUT(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  const { ids } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  await prisma.$transaction(
    ids.map((id: string, index: number) =>
      prisma.eventCategory.update({ where: { id }, data: { order: index } })
    )
  );
  return NextResponse.json({ ok: true });
}
