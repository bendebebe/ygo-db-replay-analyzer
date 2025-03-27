/*
  Warnings:

  - Added the required column `playerId` to the `Deck` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "playerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Deck_playerId_idx" ON "Deck"("playerId");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
