🛡️ SafetyOps Workspace

Um ERP modular e completo para gestão de equipas técnicas, controlo de segurança do trabalho (SST), banco de horas e logística de frota. Desenvolvido com foco na experiência do utilizador (UX) e eficiência operacional.

📌 Sobre o Projeto

O SafetyOps nasceu da necessidade de centralizar várias ferramentas de gestão do dia-a-dia de operações de campo (Field Ops) numa única plataforma. Ele elimina as planilhas de Excel descentralizadas, o papel e processos manuais.

🧩 Módulos Principais

👥 Gestão de Equipa (RH): Cadastro, edição, e ativação/inativação de colaboradores com matrículas exclusivas.

⚖️ Controlo de Folgas e Banco de Horas: Lançamento de créditos (domingos/feriados trabalhados) e débitos (folgas gozadas), com relatórios cruzados e extração de recibos em PDF.

🦺 Safety / SST: Controlo rigoroso de documentos de Segurança do Trabalho (ASOs, NRs). Conta com semáforos de vencimento, importação em lote via CSV e Inteligência Artificial (OCR via Gemini) para extração automática de dados dos PDFs enviados.

🚗 Gestão de Saídas: Criação de requisições e autorizações de saídas de veículos da empresa ou uso de aplicações de transporte (ex: Uber), com relatórios para a contabilidade.

🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando uma arquitetura Monorepo simples, separando responsabilidades:

Frontend:

React (via Vite)

TypeScript

Tailwind CSS (Estilização UI/UX Premium)

Lucide React (Ícones)

Integrações: jsPDF (Exportação de documentos), ExcelJS e XLSX (Geração e Leitura de planilhas).

Backend:

Node.js & NestJS (Framework escalável)

Prisma ORM (Modelagem de Banco de Dados)

Banco de Dados: SQLite (Pronto para migrar para PostgreSQL)

Swagger (Documentação Automática da API REST)

⚙️ Como Executar Localmente

Pré-requisitos

Node.js (v18+)

NPM ou Yarn

Passo a Passo

Clone o repositório:

git clone [https://github.com/seu-usuario/safetyops-workspace.git](https://github.com/seu-usuario/safetyops-workspace.git)
cd safetyops-workspace


Instale todas as dependências (Front e Back) com um único comando:

npm run install:all


Configure as Variáveis de Ambiente:

Na pasta backend/, crie um ficheiro .env:

DATABASE_URL="file:./dev.db"


Na pasta frontend/, crie um ficheiro .env:

VITE_GEMINI_API_KEY="sua_chave_api_do_google_gemini_aqui"


Prepare a Base de Dados (Backend):

cd backend
npx prisma migrate dev --name init
cd ..


Inicie o Servidor de Desenvolvimento:
Execute o comando abaixo na raiz do projeto. Ele utilizará o concurrently para iniciar tanto o NestJS quanto o React no mesmo terminal!

npm run dev


Aceda à Aplicação:

Frontend: http://localhost:5173

Swagger (Documentação da API): http://localhost:3000/api/docs

🔒 Aviso de Privacidade (LGPD / GDPR)

Este é um projeto de código aberto disponibilizado para fins de portefólio e demonstração técnica. Todos os dados (nomes de colaboradores, empresas, matrículas e registos) contidos nos seeds ou mocks de desenvolvimento são inteiramente fictícios.

📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

Desenvolvido por Mauro,☕ e muito código.