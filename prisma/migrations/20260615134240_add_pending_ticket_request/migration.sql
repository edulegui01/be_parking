-- CreateTable
CREATE TABLE "pending_ticket_request" (
    "id" SERIAL NOT NULL,
    "ticket_code" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_ticket_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_ticket_request_status_idx" ON "pending_ticket_request"("status");
