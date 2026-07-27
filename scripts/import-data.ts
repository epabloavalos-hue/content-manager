import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const inPath = path.join(process.cwd(), "prisma", "data-export.json");
  const data = JSON.parse(readFileSync(inPath, "utf-8"));

  // Order respects foreign key dependencies.
  await prisma.user.createMany({ data: data.users, skipDuplicates: true });
  await prisma.entry.createMany({ data: data.entries, skipDuplicates: true });
  await prisma.entryUserStatus.createMany({ data: data.entryUserStatuses, skipDuplicates: true });
  await prisma.entryAssignment.createMany({ data: data.entryAssignments, skipDuplicates: true });
  await prisma.acknowledgment.createMany({ data: data.acknowledgments, skipDuplicates: true });
  await prisma.verificationCode.createMany({ data: data.verificationCodes, skipDuplicates: true });
  await prisma.eventCategory.createMany({ data: data.eventCategories, skipDuplicates: true });
  await prisma.appDepartment.createMany({ data: data.appDepartments, skipDuplicates: true });
  await prisma.appDestinationArea.createMany({ data: data.appDestinationAreas, skipDuplicates: true });
  await prisma.importantFolder.createMany({ data: data.importantFolders, skipDuplicates: true });

  console.log("Import complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
