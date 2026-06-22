import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 });
    }

    await prisma.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.create({ data: { email, code, expiresAt } });

    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (smtpConfigured) {
      sendVerificationCode(email, code).catch((err) =>
        console.error("Error enviando correo:", err)
      );
      return NextResponse.json({ ok: true });
    } else {
      // No SMTP — return code in response so UI can display it
      return NextResponse.json({ ok: true, devCode: code });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error en send-code:", msg);
    return NextResponse.json({ error: "Error interno del servidor", detail: msg }, { status: 500 });
  }
}
