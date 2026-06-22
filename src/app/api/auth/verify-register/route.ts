import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, code, name, position, department, phone, password } = await req.json();

  if (!email || !code || !name || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const record = await prisma.verificationCode.findFirst({
    where: { email, code, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
  }

  if (new Date() > record.expiresAt) {
    return NextResponse.json({ error: "El código ha expirado, solicita uno nuevo" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      position: position || null,
      department: department || null,
      phone: phone || null,
      role: "VIEWER",
      status: "PENDING",
    },
  });

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return NextResponse.json({ ok: true });
}
