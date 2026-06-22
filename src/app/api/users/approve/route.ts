import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { userId, action } = await req.json(); // action: "approve" | "reject"

  if (!userId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "PENDING") {
    return NextResponse.json({ error: "Usuario no encontrado o ya procesado" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED" } });
    return NextResponse.json({ ok: true, status: "APPROVED" });
  } else {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }
}
