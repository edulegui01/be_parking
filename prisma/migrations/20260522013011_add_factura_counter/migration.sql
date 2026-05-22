-- CreateTable
CREATE TABLE "factura_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "current" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "factura_counter_pkey" PRIMARY KEY ("id")
);
