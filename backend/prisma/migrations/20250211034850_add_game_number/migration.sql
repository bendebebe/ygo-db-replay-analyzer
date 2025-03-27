-- First remove the existing foreign key constraint
ALTER TABLE "Replay" DROP CONSTRAINT "Replay_deckId_fkey";

-- Drop the deckId column from Replay
ALTER TABLE "Replay" DROP COLUMN "deckId";

-- Add the new columns to Deck
ALTER TABLE "Deck" 
ADD COLUMN "replayId" TEXT NOT NULL,
ADD COLUMN "gameNumber" INTEGER NOT NULL DEFAULT 1;

-- Add constraints
ALTER TABLE "Deck" ADD CONSTRAINT "unique_deck_per_game" UNIQUE ("userId", "replayId", "gameNumber");
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_replayId_fkey" FOREIGN KEY ("replayId") REFERENCES "Replay"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 