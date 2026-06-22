import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionUser = session.user as { id: string; role: string };
  if (sessionUser.id !== id && sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, status: true, position: true, department: true, phone: true, avatarPath: true, notifyArea: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionUser = session.user as { id: string; role: string };
  const isSelf = sessionUser.id === id;
  const isAdmin = sessionUser.role === "ADMIN";

  if (!isSelf && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  // Anyone can update their own basic profile
  if (body.name !== undefined) data.name = body.name;
  if (body.position !== undefined) data.position = body.position;
  if (body.department !== undefined) data.department = body.department;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.notifyArea !== undefined) data.notifyArea = body.notifyArea || null;
  if (body.themeAccent !== undefined) data.themeAccent = body.themeAccent || null;
  if (body.themeBg !== undefined) data.themeBg = body.themeBg || null;
  if (body.themeBgImage !== undefined) data.themeBgImage = body.themeBgImage || null;
  if (body.themeAnimation !== undefined) data.themeAnimation = body.themeAnimation || null;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);

  // Only admin can change role/status
  if (isAdmin) {
    if (body.role) data.role = body.role;
    if (body.status) data.status = body.status;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, status: true, position: true, department: true, phone: true, avatarPath: true, notifyArea: true, themeAccent: true, themeBg: true, themeBgImage: true, themeAnimation: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const sessionUserId = (session.user as { id?: string })?.id;
  if (id === sessionUserId) return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
