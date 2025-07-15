-- CreateEnum
CREATE TYPE "PaymentTypes" AS ENUM ('DEBIT', 'CREDIT', 'PIX', 'BANK_SLIP');

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "payment" "PaymentTypes" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
