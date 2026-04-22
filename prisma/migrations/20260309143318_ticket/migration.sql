-- CreateTable
CREATE TABLE "ticket" (
    "id" SERIAL NOT NULL,
    "ticket_code" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "exit_date" TIMESTAMP(3),

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_ticket_code_key" ON "ticket"("ticket_code");
