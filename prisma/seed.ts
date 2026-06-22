import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "pablo@jorgeserratos.com" },
    update: {},
    create: {
      name: "Pablo Avalos",
      email: "pablo@jorgeserratos.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin creado:", admin.email);

  const editorPassword = await bcrypt.hash("editor123", 10);
  const editor = await prisma.user.upsert({
    where: { email: "editor@jorgeserratos.com" },
    update: {},
    create: {
      name: "Editor Demo",
      email: "editor@jorgeserratos.com",
      password: editorPassword,
      role: "EDITOR",
    },
  });
  console.log("✅ Editor creado:", editor.email);

  const viewerPassword = await bcrypt.hash("viewer123", 10);
  const viewer = await prisma.user.upsert({
    where: { email: "viewer@jorgeserratos.com" },
    update: {},
    create: {
      name: "Visualizador Demo",
      email: "viewer@jorgeserratos.com",
      password: viewerPassword,
      role: "VIEWER",
    },
  });
  console.log("✅ Viewer creado:", viewer.email);

  const existingEntries = await prisma.entry.count();
  if (existingEntries === 0) {
    const samples = [
      {
        driveLink: "https://drive.google.com/drive/folders/ejemplo1",
        linkType: "FOLDER",
        eventName: "Gira Monterrey Enero 2025",
        eventType: "GIRAS",
        recordingDate: new Date("2025-01-15"),
        contentResponsible: "Carlos Méndez",
        destinationArea: "YOUTUBE",
        deliveryStatus: "RECIBIDO",
        createdById: admin.id,
      },
      {
        driveLink: "https://drive.google.com/drive/folders/ejemplo2",
        linkType: "FOLDER",
        eventName: "Conferencia Tech Summit CDMX",
        eventType: "CONFERENCIAS_PAGADAS",
        recordingDate: new Date("2025-02-08"),
        contentResponsible: "Laura Gómez",
        destinationArea: "EQUIPO_MARKETING",
        deliveryStatus: "NO_ENTREGADO",
        createdById: admin.id,
      },
      {
        driveLink: "https://drive.google.com/file/d/ejemplo3",
        linkType: "FILE",
        eventName: "Sesión Fotográfica Producto Q1",
        eventType: "GRABACIONES",
        recordingDate: new Date("2025-03-01"),
        contentResponsible: "Miguel Torres",
        destinationArea: "EQUIPO_JS",
        deliveryStatus: "RECIBIDO",
        createdById: editor.id,
      },
    ];
    for (const data of samples) {
      await prisma.entry.create({ data });
    }
  }

  console.log("✅ Registros de ejemplo creados.");
  console.log("\n📋 Credenciales de acceso:");
  console.log("  Admin:  pablo@jorgeserratos.com / admin123");
  console.log("  Editor: editor@jorgeserratos.com / editor123");
  console.log("  Viewer: viewer@jorgeserratos.com / viewer123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
