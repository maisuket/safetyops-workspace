-- CreateIndex
CREATE INDEX "Document_employeeId_idx" ON "Document"("employeeId");

-- CreateIndex
CREATE INDEX "Document_expiryDate_idx" ON "Document"("expiryDate");

-- CreateIndex
CREATE INDEX "Record_employeeId_idx" ON "Record"("employeeId");

-- CreateIndex
CREATE INDEX "Record_date_idx" ON "Record"("date");

-- CreateIndex
CREATE INDEX "Record_type_idx" ON "Record"("type");

-- CreateIndex
CREATE INDEX "SaidaRecord_employeeId_idx" ON "SaidaRecord"("employeeId");

-- CreateIndex
CREATE INDEX "SaidaRecord_dataOcorrencia_idx" ON "SaidaRecord"("dataOcorrencia");

-- CreateIndex
CREATE INDEX "SaidaRecord_createdAt_idx" ON "SaidaRecord"("createdAt");
