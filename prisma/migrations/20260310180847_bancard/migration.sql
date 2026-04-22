-- CreateTable
CREATE TABLE "bancard_log" (
    "id" SERIAL NOT NULL,
    "tipo_operacion" TEXT NOT NULL,
    "request_json" TEXT,
    "response_json" TEXT,
    "status" TEXT NOT NULL,
    "http_status_code" INTEGER,
    "monto" DECIMAL(12,3),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bancard_log_pkey" PRIMARY KEY ("id")
);
