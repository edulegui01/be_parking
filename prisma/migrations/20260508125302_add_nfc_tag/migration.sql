-- CreateTable
CREATE TABLE "nfc_tag" (
    "id" SERIAL NOT NULL,
    "nfc_code" TEXT NOT NULL,
    "enable" BOOLEAN NOT NULL DEFAULT true,
    "owner" TEXT NOT NULL,

    CONSTRAINT "nfc_tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nfc_tag_nfc_code_key" ON "nfc_tag"("nfc_code");
