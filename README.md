# 🛡️ SafetyOps Workspace

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-blue)
![Backend](https://img.shields.io/badge/backend-NestJS-red)
![Database](https://img.shields.io/badge/database-SQLite-lightgrey)

Um **ERP modular e escalável** para gestão de equipas técnicas, Segurança do Trabalho (SST), banco de horas e logística de frota.

> 🚀 Focado em produtividade, automação e centralização de operações de campo (Field Ops)

---

## 📸 Demonstração

> 💡 **Dica:** Substitua as imagens abaixo por prints reais do seu sistema

### Controle de Folgas

![Folgas](./docs/controle-folgas-resumo.jpeg)

### Gestão de Equipe

![Equipe](./docs/gestao-equipe.jpeg)

### Módulo de Segurança (SST)

![SST](./docs/dashboard-controle-sst.jpeg)

### Gestão de Saídas

![Gestão de Saídas](./docs/gestao-saidas.jpeg)

---

## 📌 Sobre o Projeto

O **SafetyOps** nasceu da necessidade de eliminar:

- Planilhas descentralizadas
- Processos manuais
- Falta de rastreabilidade

Centralizando tudo em uma única plataforma.

---

## 🧩 Módulos Principais

### 👥 Gestão de Equipa

- Cadastro e gestão de colaboradores
- Controle de status (ativo/inativo)

### ⚖️ Banco de Horas

- Créditos e débitos
- Relatórios e exportações

### 🦺 Safety / SST

- Controle de ASOs e NRs
- Alertas de vencimento
- Importação CSV
- OCR com IA (Gemini)

### 🚗 Gestão de Saidas da equipe

- Controle de saídas
- Relatórios de deslocamento

---

## 🚀 Tecnologias

### Frontend

- React + Vite
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- NestJS
- Prisma ORM

### Banco de Dados

- SQLite (dev)
- PostgreSQL (planejado)

---

## ⚙️ Setup Local

### 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- Node.js (v18 ou superior)
- NPM (ou Yarn)

---

### 📦 Instalação do Projeto

Clone o repositório:

```bash
git clone https://github.com/mdaisuket/safetyops-workspace.git
cd safetyops-workspace
```

Instale todas as dependências do projeto (frontend + backend):

```bash
npm run install:all
```

> 💡 Este comando utiliza `npm install --prefix` para instalar automaticamente os pacotes em `/backend` e `/frontend`.

---

### 🔐 Configuração de Ambiente

Crie os arquivos `.env` conforme abaixo:

#### 📁 Backend (`/backend/.env`)

```env
DATABASE_URL="file:./dev.db"
```

#### 📁 Frontend (`/frontend/.env`)

```env
VITE_GEMINI_API_KEY="sua_chave_aqui"
```

---

### 🗄️ Configuração do Banco de Dados

Execute as migrations do Prisma:

```bash
cd backend
npx prisma migrate dev --name init
cd ..
```

---

### ▶️ Executando o Projeto

Inicie frontend e backend simultaneamente:

```bash
npm run dev
```

> 🚀 Este comando utiliza o **concurrently** para executar:
>
> - NestJS (backend)
> - React (frontend)

---

### 🧪 Execução Individual (Opcional)

Caso queira rodar separadamente:

**Backend**

```bash
npm run dev:backend
```

**Frontend**

```bash
npm run dev:frontend
```

---

### 🌐 Acessos

- Frontend → http://localhost:5173
- Backend → http://localhost:3000
- Swagger → http://localhost:3000/api/docs

---

### ⚠️ Possíveis Problemas

**Porta já em uso**

```bash
Error: listen EADDRINUSE
```

Solução: finalize o processo ou altere a porta no backend.

---

**Dependências não instaladas corretamente**

```bash
rm -rf node_modules
npm run install:all
```

## 🧠 Diferenciais

- Centralização de operações
- Uso de IA (OCR)
- Arquitetura escalável
- Exportação de dados

---

## 🔒 Privacidade e Uso de Dados (LGPD / GDPR)

Este projeto foi desenvolvido exclusivamente para fins de **portfólio e demonstração técnica**.

⚠️ **Todos os dados apresentados são totalmente fictícios**, incluindo, mas não se limitando a:

- Nomes de colaboradores
- Empresas
- Matrículas
- Registros operacionais
- Documentos e informações de segurança

Nenhuma informação real de pessoas ou organizações é utilizada neste sistema.

O objetivo é apenas simular cenários reais de uso, respeitando integralmente os princípios da **Lei Geral de Proteção de Dados (LGPD)** e do **Regulamento Geral de Proteção de Dados (GDPR)**.

Caso este projeto venha a ser utilizado em ambiente produtivo, será necessária a devida adequação às políticas de privacidade e segurança aplicáveis.

---

## 📝 Licença

MIT

---

## 👨‍💻 Autor

Desenvolvido por **Mauro Daisuke**
☕ + código + problemas reais = soluções eficientes
