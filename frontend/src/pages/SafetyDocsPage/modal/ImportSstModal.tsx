import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { DocumentsService } from "../../../services/documents.service";

interface ImportSSTModalProps {
  closeModal: () => void;
  employees: any[];
  onImportSuccess: () => void;
}

interface ParsedRecord {
  employeeId: string;
  employeeName: string;
  docType: string;
  expiryDate: string;
}

export const ImportSSTModal: React.FC<ImportSSTModalProps> = ({
  closeModal,
  employees,
  onImportSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordsToImport, setRecordsToImport] = useState<ParsedRecord[]>([]);
  const [unmatchedEmployees, setUnmatchedEmployees] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = async (file: File, employees: any[]) => {
    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      return parseCSV(text, employees);
    }

    return parseExcel(file, employees);
  };

  const parseExcel = async (file: File, employees: any[]) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    return processRows(rows, employees);
  };

  const detectColumn = (headers: string[], keywords: string[]) => {
    return headers.find((h) =>
      keywords.some((k) => h.toLowerCase().includes(k.toLowerCase())),
    );
  };

  const normalizeDate = (value: any): string | null => {
    if (!value) return null;

    // ISO
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // Excel number
    if (typeof value === "number") {
      const base = new Date(1899, 11, 30);
      const date = new Date(base.getTime() + value * 86400000);
      return date.toISOString().split("T")[0];
    }

    // DD/MM/YYYY
    if (typeof value === "string") {
      const parts = value.split(/[\/\-]/);

      if (parts.length === 3) {
        const [d, m, y] = parts;
        if (y.length === 4) {
          return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }
    }

    return null;
  };

  const processRows = (rows: any[], employees: any[]) => {
    if (!rows.length) return { parsed: [], unmatched: [] };

    const headers = Object.keys(rows[0]);

    const employeeCol = detectColumn(headers, [
      "funcionario",
      "funcionário",
      "employee",
      "nome",
    ]);

    const docCol = detectColumn(headers, ["documento", "doc", "tipo"]);

    const dateCol = detectColumn(headers, ["vencimento", "data", "expiry"]);

    if (!employeeCol || !docCol || !dateCol) {
      throw new Error("Formato inválido: colunas obrigatórias não encontradas");
    }

    const parsed: any[] = [];
    const unmatched = new Set<string>();
    const seen = new Set<string>(); // evita duplicados

    for (const row of rows) {
      const name = row[employeeCol]?.trim();
      const doc = row[docCol]?.trim();
      const rawDate = row[dateCol];

      if (!name || !doc || !rawDate) continue;

      const normalizedDate = normalizeDate(rawDate);
      if (!normalizedDate) continue;

      const employee = employees.find(
        (e) => e.name.trim().toUpperCase() === name.toUpperCase(),
      );

      if (!employee) {
        unmatched.add(name);
        continue;
      }

      const uniqueKey = `${employee.id}-${doc}-${normalizedDate}`;
      if (seen.has(uniqueKey)) continue;

      seen.add(uniqueKey);

      parsed.push({
        employeeId: employee.id,
        employeeName: employee.name,
        docType: doc,
        expiryDate: normalizedDate,
      });
    }

    return {
      parsed,
      unmatched: Array.from(unmatched),
    };
  };

  // 1. Lê o arquivo CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const { parsed, unmatched } = await parseFile(file, employees);

      setRecordsToImport(parsed);
      setUnmatchedEmployees(unmatched);
    } catch (err) {
      alert("Erro ao processar arquivo.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Transforma o CSV em Objetos JSON e cruza com a Base de Dados
  const parseCSV = (text: string, employees: any[]) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const headers = lines[0].split(",").map((h) => h.trim());

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",");
      const obj: any = {};

      headers.forEach((h, i) => {
        obj[h] = cols[i]?.trim().replace(/^"|"$/g, "");
      });

      return obj;
    });

    return processRows(rows, employees);
  };

  // 3. Envia os dados para o Backend
  const handleImport = async () => {
    if (recordsToImport.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    try {
      // Enviamos em lote, atualizando a barra de progresso
      for (let i = 0; i < recordsToImport.length; i++) {
        const record = recordsToImport[i];

        await DocumentsService.create({
          employeeId: record.employeeId,
          docType: record.docType,
          expiryDate: record.expiryDate,
        });

        successCount++;
        setImportProgress(Math.round(((i + 1) / recordsToImport.length) * 100));
      }

      alert(
        `Sucesso! ${successCount} prontuários importados para a base de dados.`,
      );
      onImportSuccess();
      closeModal();
    } catch (error) {
      alert(
        "Houve um erro de rede ao tentar salvar alguns registos. Verifique a consola.",
      );
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" /> Importação em
            Lote (SST)
          </h3>
          <button
            onClick={closeModal}
            className="hover:bg-white/10 p-1 rounded-full transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grow space-y-6">
          {/* Passo 1: Upload */}
          {!recordsToImport.length && !isProcessing && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-700">
                <p className="font-bold mb-1">Como usar:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    No Excel, grave a sua folha como{" "}
                    <strong>CSV (separado por vírgulas)</strong>.
                  </li>
                  <li>
                    Assegure-se que tem as colunas <code>Funcionário</code>,{" "}
                    <code>Documento</code> e <code>Data Vencimento</code>.
                  </li>
                  <li>
                    As datas devem estar no formato <code>YYYY-MM-DD</code> (ex:
                    2025-11-11).
                  </li>
                </ol>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-200 rounded-3xl p-10 text-center relative hover:bg-emerald-50 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  accept=".csv, .xlsx"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center">
                  <FileSpreadsheet
                    className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform"
                    size={40}
                  />
                  <p className="font-bold text-slate-700 text-lg">
                    Clique para selecionar o CSV
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Apenas ficheiros .csv
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado: Processando CSV */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
              <p className="font-bold text-slate-600">
                A processar linhas do Excel...
              </p>
            </div>
          )}

          {/* Passo 2: Validação e Confirmação */}
          {recordsToImport.length > 0 && !isUploading && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                  <p className="text-2xl font-black text-emerald-700">
                    {recordsToImport.length}
                  </p>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                    Prontos a Salvar
                  </p>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${unmatchedEmployees.length > 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}
                >
                  <AlertTriangle
                    size={32}
                    className={
                      unmatchedEmployees.length > 0
                        ? "text-amber-500 mb-2"
                        : "text-slate-300 mb-2"
                    }
                  />
                  <p
                    className={`text-2xl font-black ${unmatchedEmployees.length > 0 ? "text-amber-700" : "text-slate-400"}`}
                  >
                    {unmatchedEmployees.length}
                  </p>
                  <p
                    className={`text-xs font-bold uppercase tracking-widest ${unmatchedEmployees.length > 0 ? "text-amber-600" : "text-slate-400"}`}
                  >
                    Nomes Não Encontrados
                  </p>
                </div>
              </div>

              {unmatchedEmployees.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-800 uppercase mb-2">
                    ⚠ Os seguintes nomes do Excel não existem na Base de Dados
                    (serão ignorados):
                  </p>
                  <ul className="text-xs text-amber-700 max-h-24 overflow-y-auto list-disc pl-4 custom-scrollbar">
                    {unmatchedEmployees.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-48 overflow-y-auto custom-scrollbar">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                  Pré-visualização (Primeiros Registos):
                </p>
                <div className="space-y-2">
                  {recordsToImport.slice(0, 20).map((r, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-100"
                    >
                      <span className="font-bold text-slate-700 truncate flex-1">
                        {r.employeeName}
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold mx-2">
                        {r.docType}
                      </span>
                      <span className="text-slate-500 font-mono text-xs">
                        {r.expiryDate}
                      </span>
                    </div>
                  ))}
                  {recordsToImport.length > 20 && (
                    <p className="text-center text-xs text-slate-400 italic pt-2">
                      E mais {recordsToImport.length - 20} registos...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estado: A Fazer Upload para o NestJS */}
          {isUploading && (
            <div className="flex flex-col items-center justify-center p-12 space-y-6">
              <Upload className="animate-bounce text-emerald-500" size={48} />
              <div className="text-center w-full">
                <p className="font-bold text-slate-700 mb-2">
                  A gravar na base de dados... ({importProgress}%)
                </p>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Ações */}
        <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50 rounded-b-3xl flex gap-3">
          <button
            onClick={closeModal}
            disabled={isUploading}
            className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={isUploading || recordsToImport.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Confirmar Importação
          </button>
        </div>
      </div>
    </div>
  );
};
