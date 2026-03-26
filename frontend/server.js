import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Configuração para emular __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com SQLite (Cria o arquivo safetydoc.db se não existir)
const sqlite3Verbose = sqlite3.verbose();
const dbPath = path.resolve(__dirname, "safetydoc.db");
const db = new sqlite3Verbose.Database(dbPath, (err) => {
  if (err) console.error("Erro ao abrir banco:", err.message);
  else console.log("Conectado ao banco de dados SQLite local (ES Modules).");
});

// Inicialização das Tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    createdAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId INTEGER,
    docType TEXT,
    issueDate TEXT,
    expiryDate TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees (id)
  )`);
});

// --- ROTAS DA API ---

// Funcionários
app.get("/api/employees", (req, res) => {
  db.all("SELECT * FROM employees", [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.post("/api/employees", (req, res) => {
  const { name, role, createdAt } = req.body;
  db.run(
    `INSERT INTO employees (name, role, createdAt) VALUES (?, ?, ?)`,
    [name, role, createdAt],
    function (err) {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ id: this.lastID });
    },
  );
});

app.delete("/api/employees/:id", (req, res) => {
  db.run(`DELETE FROM employees WHERE id = ?`, req.params.id, (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ deleted: true });
  });
});

// Documentos
app.get("/api/documents", (req, res) => {
  db.all("SELECT * FROM documents", [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.post("/api/documents", (req, res) => {
  const { employeeId, docType, issueDate, expiryDate } = req.body;
  db.run(
    `INSERT INTO documents (employeeId, docType, issueDate, expiryDate) VALUES (?, ?, ?, ?)`,
    [employeeId, docType, issueDate, expiryDate],
    function (err) {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ id: this.lastID });
    },
  );
});

app.delete("/api/documents/:id", (req, res) => {
  db.run(`DELETE FROM documents WHERE id = ?`, req.params.id, (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ deleted: true });
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
