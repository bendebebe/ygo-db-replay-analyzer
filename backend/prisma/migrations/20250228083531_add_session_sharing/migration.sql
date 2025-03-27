/*
  Warnings:

  - A unique constraint covering the columns `[shareableId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareableId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_shareableId_key" ON "Session"("shareableId");
