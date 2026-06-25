-- CreateTable
CREATE TABLE "ImportantFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "driveLink" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
