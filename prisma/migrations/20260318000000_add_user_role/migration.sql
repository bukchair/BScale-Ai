-- Add role column to User table for server-side admin checks.
-- Defaults to 'user' for all existing rows.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';
