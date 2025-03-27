/*
  Warnings:

  - You are about to drop the column `name` on the `Replay` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `_DeckToCard` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serialNumber]` on the table `Card` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[replayId,gameNumber]` on the table `Deck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[replayUrl]` on the table `Replay` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dbName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `player1Id` to the `Replay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2Id` to the `Replay` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Deck" DROP CONSTRAINT "Deck_userId_fkey";

-- DropForeignKey
ALTER TABLE "Replay" DROP CONSTRAINT "Replay_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "_DeckToCard" DROP CONSTRAINT "_DeckToCard_A_fkey";

-- DropForeignKey
ALTER TABLE "_DeckToCard" DROP CONSTRAINT "_DeckToCard_B_fkey";

-- DropIndex
DROP INDEX "Deck_deletedAt_idx";

-- Drop constraint "Deck_userId_replayId_gameNumber_key"; on Deck table
ALTER TABLE "Deck" DROP CONSTRAINT "Deck_userId_replayId_gameNumber_key";

-- DropIndex
DROP INDEX "Replay_deletedAt_idx";

-- DropIndex
ALTER TABLE "User" DROP CONSTRAINT "User_username_key";

-- AlterTable
ALTER TABLE "Deck" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Replay" DROP COLUMN "name",
ADD COLUMN     "player1Id" TEXT NOT NULL,
ADD COLUMN     "player2Id" TEXT NOT NULL,
ADD COLUMN     "winnerPlayerId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username",
ADD COLUMN     "dbName" TEXT;

-- DropTable
DROP TABLE "_DeckToCard";

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "dbName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckToCard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "copiesOfCard" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DeckToCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RpsChoice" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "replayId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RpsChoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_playerId_key" ON "Player"("playerId");

-- CreateIndex
CREATE INDEX "Player_dbName_idx" ON "Player"("dbName");

-- CreateIndex
CREATE INDEX "Player_playerId_idx" ON "Player"("playerId");

-- CreateIndex
CREATE INDEX "DeckToCard_deckId_idx" ON "DeckToCard"("deckId");

-- CreateIndex
CREATE INDEX "DeckToCard_cardId_idx" ON "DeckToCard"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckToCard_deckId_cardId_key" ON "DeckToCard"("deckId", "cardId");

-- CreateIndex
CREATE INDEX "RpsChoice_playerId_idx" ON "RpsChoice"("playerId");

-- CreateIndex
CREATE INDEX "RpsChoice_replayId_idx" ON "RpsChoice"("replayId");

-- CreateIndex
CREATE UNIQUE INDEX "Card_serialNumber_key" ON "Card"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_replayId_gameNumber_key" ON "Deck"("replayId", "gameNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Replay_replayUrl_key" ON "Replay"("replayUrl");

-- CreateIndex
CREATE INDEX "Replay_player1Id_idx" ON "Replay"("player1Id");

-- CreateIndex
CREATE INDEX "Replay_player2Id_idx" ON "Replay"("player2Id");

-- CreateIndex
CREATE INDEX "Replay_winnerPlayerId_idx" ON "Replay"("winnerPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_dbName_key" ON "User"("dbName");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replay" ADD CONSTRAINT "Replay_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replay" ADD CONSTRAINT "Replay_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replay" ADD CONSTRAINT "Replay_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replay" ADD CONSTRAINT "Replay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckToCard" ADD CONSTRAINT "DeckToCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckToCard" ADD CONSTRAINT "DeckToCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpsChoice" ADD CONSTRAINT "RpsChoice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpsChoice" ADD CONSTRAINT "RpsChoice_replayId_fkey" FOREIGN KEY ("replayId") REFERENCES "Replay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
