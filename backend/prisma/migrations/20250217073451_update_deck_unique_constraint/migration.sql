/*
  Warnings:

  - A unique constraint covering the columns `[replayId,gameNumber,playerId]` on the table `Deck` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Deck_replayId_gameNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Deck_replayId_gameNumber_playerId_key" ON "Deck"("replayId", "gameNumber", "playerId");
