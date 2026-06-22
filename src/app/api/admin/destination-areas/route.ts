import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  return role === "ADMIN" ? session : null;
}

export async function GET() {
  const areas = await prisma.appDestinationArea.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(areas);
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { label, contact } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: "Label requerido" }, { status: 400 });
  const value = label.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
  const count = await prisma.appDestinationArea.count();
  const area = await prisma.appDestinationArea.create({ data: { value, label: label.trim(), contact: contact?.trim() ?? "", order: count } });
  return NextResponse.json(area);
}

export async function PUT(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  await prisma.$transaction(ids.map((id: string, index: number) => prisma.appDestinationArea.update({ where: { id }, data: { order: index } })));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.appDestinationArea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, label, contact } = await req.json();
  const area = await prisma.appDestinationArea.update({ where: { id }, data: { label: label?.trim(), contact: contact?.trim() } });
  return NextResponse.json(area);
}
