-- CreateTable
CREATE TABLE "pago" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "ticket_id" INTEGER NOT NULL,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
