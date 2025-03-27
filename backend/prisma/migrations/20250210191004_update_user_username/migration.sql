-- First, rename the column
ALTER TABLE "User" RENAME COLUMN "name" TO "username";

-- Update any NULL usernames with a default value
UPDATE "User" SET username = 'user_' || id WHERE username IS NULL;

-- Now make the column required and unique
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username"); 