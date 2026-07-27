import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const data = {
    users: await prisma.user.findMany(),
    entries: await prisma.entry.findMany(),
    entryUserStatuses: await prisma.entryUserStatus.findMany(),
    entryAssignments: await prisma.entryAssignment.findMany(),
    acknowledgments: await prisma.acknowledgment.findMany(),
    verificationCodes: await prisma.verificationCode.findMany(),
    eventCategories: await prisma.eventCategory.findMany(),
    appDepartments: await prisma.appDepartment.findMany(),
    appDestinationAreas: await prisma.appDestinationArea.findMany(),
    importantFolders: await prisma.importantFolder.findMany(),
  };

  const outPath = path.join(process.cwd(), "prisma", "data-export.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Exported to ${outPath}`);
  for (const [key, rows] of Object.entries(data)) {
    console.log(`  ${key}: ${rows.length}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
