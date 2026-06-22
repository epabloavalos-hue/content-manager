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
  const depts = await prisma.appDepartment.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(depts);
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  const { label } = await req.json().catch(() => ({}));
  if (!label?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  const value = label.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
  const existing = await prisma.appDepartment.findUnique({ where: { value } });
  if (existing) return NextResponse.json({ error: "Ya existe ese departamento" }, { status: 409 });
  const last = await prisma.appDepartment.findFirst({ orderBy: { order: "desc" } });
  const dept = await prisma.appDepartment.create({ data: { value, label: label.trim(), order: (last?.order ?? -1) + 1 } });
  return NextResponse.json(dept);
}

export async function PATCH(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  const { id, label } = await req.json().catch(() => ({}));
  if (!id || !label?.trim()) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const dept = await prisma.appDepartment.update({ where: { id }, data: { label: label.trim() } });
  return NextResponse.json(dept);
}

export async function DELETE(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  await prisma.appDepartment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
