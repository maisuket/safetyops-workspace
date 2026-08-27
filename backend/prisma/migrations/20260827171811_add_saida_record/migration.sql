-- CreateTable
CREATE TABLE "SaidaRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "tipoData" TEXT,
    "destino" TEXT,
    "motivo" TEXT NOT NULL,
    "dataOcorrencia" DATETIME,
    "batchId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaidaRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
