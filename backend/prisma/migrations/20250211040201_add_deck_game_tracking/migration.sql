-- CreateIndex
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");

-- CreateIndex
CREATE INDEX "Deck_replayId_idx" ON "Deck"("replayId");

-- CreateIndex
CREATE INDEX "Deck_deletedAt_idx" ON "Deck"("deletedAt");

-- RenameIndex
ALTER INDEX "unique_deck_per_game" RENAME TO "Deck_userId_replayId_gameNumber_key";
