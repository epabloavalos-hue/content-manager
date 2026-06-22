import nodemailer from "nodemailer";

function buildCodeEmail(code: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080d08;font-family:Inter,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0f1a0f;border:1px solid #1f3320;border-radius:16px;overflow:hidden;">
    <div style="background:#080d08;padding:28px 32px;border-bottom:1px solid #1f3320;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:#4ade80;margin-bottom:12px;">
        <span style="color:#000;font-weight:900;font-size:18px;">JS</span>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Gestor de Contenido · Jorge Serratos</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:800;">Tu código de verificación</h2>
      <p style="margin:0 0 28px;color:#6b7280;font-size:14px;">Ingresa este código en la pantalla de registro. Expira en 10 minutos.</p>
      <div style="background:#162216;border:1px solid #1f3320;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#4ade80;">${code}</span>
      </div>
      <p style="margin:0;color:#4b5563;font-size:12px;text-align:center;">Si no solicitaste este código, ignora este mensaje.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  // Always log for dev/testing
  console.log(`\n🔑 Código de verificación para ${email}: ${code}\n`);

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("⚠️  SMTP no configurado — el código está en la consola del servidor.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587"),
    secure: SMTP_PORT === "465",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"Gestor de Contenido JS" <${SMTP_FROM || SMTP_USER}>`,
    to: email,
    subject: `${code} — Tu código de verificación`,
    html: buildCodeEmail(code),
  });
}
