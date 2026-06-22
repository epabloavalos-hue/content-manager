import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, position, department, phone } = await req.json().catch(() => ({}));

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nombre, correo y contraseña son obligatorios" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en register:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
