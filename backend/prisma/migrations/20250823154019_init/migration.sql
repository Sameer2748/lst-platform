-- CreateTable
CREATE TABLE "public"."Vault" (
    "id" TEXT NOT NULL,
    "totalSOL" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSSOL" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "tokenReceived" TEXT NOT NULL,
    "amountReceived" DOUBLE PRECISION NOT NULL,
    "stakedTokenMinted" TEXT NOT NULL,
    "amountStaked" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "txSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
