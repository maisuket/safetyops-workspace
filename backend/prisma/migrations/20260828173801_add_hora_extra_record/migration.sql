-- CreateTable
CREATE TABLE "HoraExtraRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "dataServico" DATETIME NOT NULL,
    "local" TEXT NOT NULL,
    "descricaoServico" TEXT,
    "enderecoServico" TEXT,
    "numeroOS" TEXT,
    "observacao" TEXT,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HoraExtraRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HoraExtraRecord_employeeId_idx" ON "HoraExtraRecord"("employeeId");

-- CreateIndex
CREATE INDEX "HoraExtraRecord_dataServico_idx" ON "HoraExtraRecord"("dataServico");

-- CreateIndex
CREATE INDEX "HoraExtraRecord_batchId_idx" ON "HoraExtraRecord"("batchId");
