-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarPath" TEXT;

-- CreateTable
CREATE TABLE "EventCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "AppDepartment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_value_key" ON "EventCategory"("value");

-- CreateIndex
CREATE UNIQUE INDEX "AppDepartment_value_key" ON "AppDepartment"("value");
