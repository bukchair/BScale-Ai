-- CreateTable
CREATE TABLE "EmailSignupInvite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "EmailSignupInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailSignupInvite_tokenHash_key" ON "EmailSignupInvite"("tokenHash");
CREATE INDEX "EmailSignupInvite_email_idx" ON "EmailSignupInvite"("email");
