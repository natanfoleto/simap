# 🚗 SIMAP — Sistema Integrado de Manutenção Automotiva Preventiva

O **SIMAP** é uma plataforma corporativa e municipal para gestão inteligente de frotas públicas e transição do modelo de manutenção reativa (corretiva) para o modelo proativo (preventiva).

Desenvolvido para atender às demandas de gestão de frotas e controle operacional do setor público (iniciado no **Município de Jaborandi/SP**), o sistema oferece controle multi-tenant, auditoria ponta a ponta, vistorias via checklist digital, ordens de serviço e acompanhamento financeiro com linha de base e metas de economia.

---

## 🌟 Principais Recursos e Módulos

* **📊 Dashboard Estratégico e Operacional**
  * Visão consolidada da frota ativa, veículos em manutenção e parados (*downtime*).
  * Acompanhamento de metas financeiras e redução de custos vs. linha de base histórica.
  * Alertas de planos preventivos vencidos ou próximos do vencimento (km e dias).

* **🚐 Gestão de Frota e Veículos**
  * Cadastro detalhado por categorias (Ônibus, Vans, Ambulâncias, Carros, Máquinas, Caminhões).
  * Classificação de criticidade, departamento responsável e destinação.
  * Exportação de dados e relatórios da frota via CSV.

* **📅 Planos de Manutenção Preventiva**
  * Configuração de planos e itens preventivos com intervalos por quilometragem e periodicidade temporal.
  * Regras de tolerância e criticidade por item (ex.: troca de óleo, freios, correias, suspensão).
  * Associação flexível de planos a veículos e categorias.

* **📋 Checklists e Inspeções Digitais**
  * Templates customizáveis por categoria de veículo.
  * Realização de vistorias com registro de status (OK, Alerta, Crítico), apontamentos e fotos.
  * Criação automática ou facilitada de Ordens de Serviço a partir de itens em alerta ou críticos.

* **⏱️ Controle de Quilometragem (Odômetro)**
  * Registro de leituras manuais, por checklist, ou por ordem de serviço.
  * Travamento e auditoria contra regressão indevida de km, com fluxo de correção justificada.

* **🛠️ Ordens de Serviço (OS)**
  * Fluxo completo: Rascunho ➔ Aberta / Agendada ➔ Em Execução ➔ Concluída / Cancelada.
  * Tipos: Preventiva, Corretiva e Inspeção.
  * Discriminação de custos (peças, mão de obra, serviços de terceiros) e registro de *downtime*.

* **🚀 Grupo Piloto (Operação Controlada)**
  * Seleção e acompanhamento focado de grupos de veículos durante fases de validação de campo.

* **🔒 Controle de Acesso Baseado em Perfis (RBAC) & Auditoria**
  * Níveis de permissão: `ADMIN`, `GESTOR`, `OPERADOR`, `MOTORISTA`, `AUDITOR`.
  * Logs completos de auditoria (alterações com *diff* JSON) e histórico de logins.

---

## 🛠️ Stack Tecnológica

* **Framework Fullstack:** [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **ORM & Banco de Dados:** [Prisma ORM 5](https://www.prisma.io/) com [PostgreSQL 16](https://www.postgresql.org/)
* **Autenticação:** [NextAuth.js](https://next-auth.js.org/) (Credentials Provider + Sessões JWT)
* **Estilização & UI:** [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
* **Gráficos & Métricas:** [Recharts](https://recharts.org/)
* **Formulários & Validação:** [React Hook Form](https://react-hook-form.com/) e [Zod](https://zod.dev/)
* **Gerenciamento de Estado de Dados:** [TanStack React Query](https://tanstack.com/query/latest)
* **Testes Automatizados:** [Vitest](https://vitest.dev/) e Testing Library
* **Gerenciador de Pacotes:** [pnpm](https://pnpm.io/)
* **Infraestrutura Local:** Docker & Docker Compose

---

## 📋 Pré-requisitos

Certifique-se de ter instalado em seu ambiente:

* **Node.js**: `v20.x` ou superior
* **pnpm**: `v9.x` ou superior (`npm install -g pnpm`)
* **Docker** e **Docker Compose** (ou uma instância do PostgreSQL 16 rodando)

---

## 🚀 Guia de Instalação e Inicialização

### 1. Clonar o Repositório e Instalar Dependências

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd simap

# Instale as dependências via pnpm
pnpm install
```

### 2. Configurar as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
```

Exemplo de conteúdo para ambiente de desenvolvimento:

```env
# Banco de Dados PostgreSQL
POSTGRES_DB=simap
POSTGRES_USER=simap
POSTGRES_PASSWORD=simap
POSTGRES_PORT=5432
DATABASE_URL="postgresql://simap:simap@localhost:5432/simap?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="simap_dev_nextauth_secret_key_super_secure_32_chars"

# Aplicação
APP_TIMEZONE="America/Sao_Paulo"
NEXT_PUBLIC_APP_NAME="SIMAP"

# Credenciais Iniciais de Seed
SEED_ADMIN_NAME="Administrador SIMAP"
SEED_ADMIN_EMAIL="admin@simap.local"
SEED_ADMIN_PASSWORD="admin_jaborandi_2025"
SEED_DEMO="false"
```

> 💡 **Nota sobre portas do PostgreSQL:** Se você já possui um serviço PostgreSQL rodando localmente na porta `5432`, altere `POSTGRES_PORT=5433` no `.env` e ajuste o `DATABASE_URL` para `localhost:5433`.

### 3. Subir o Banco de Dados com Docker

```bash
docker compose up -d
```

### 4. Executar Migrações e Gerar o Prisma Client

```bash
# Executa as migrações do banco de dados
pnpm prisma:migrate

# Gera o client tipado do Prisma
pnpm prisma:generate
```

### 5. Popular o Banco com Dados Iniciais (Seed)

O comando de seed provisiona o tenant padrão (`jaborandi-sp`), marcos do projeto, planos preventivos base, veículos e usuários iniciais:

```bash
pnpm db:seed
```

### 6. Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse no navegador:
👉 **[http://localhost:3000/jaborandi-sp/login](http://localhost:3000/jaborandi-sp/login)**

---

## 🔑 Credenciais Padrão de Acesso

Após executar o `pnpm db:seed`, os seguintes usuários de teste estarão disponíveis:

| Perfil | E-mail | Senha Padrão | Escopo de Acesso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@simap.local` | `admin_jaborandi_2025` | Acesso total a configurações, tenant, auditoria e módulos |
| **Operador** | `operador@simap.local` | `operador_123` | Gestão de ordens de serviço, planos preventivos e veículos |
| **Motorista** | `motorista@simap.local` | `motorista_123` | Realização de checklists, leitura de odômetro e visualização |

---

## 📜 Scripts Disponíveis

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| `dev` | `pnpm dev` | Inicia o servidor Next.js em modo desenvolvimento |
| `build` | `pnpm build` | Compila o projeto para produção |
| `start` | `pnpm start` | Executa o build de produção |
| `lint` | `pnpm lint` | Executa a verificação estática do ESLint |
| `typecheck` | `pnpm typecheck` | Executa a checagem de tipos com TypeScript (`tsc --noEmit`) |
| `test` | `pnpm test` | Executa os testes unitários e de integração com Vitest |
| `test:watch` | `pnpm test:watch` | Executa os testes em modo contínuo (*watch mode*) |
| `prisma:generate`| `pnpm prisma:generate` | Gera o client do Prisma a partir do schema |
| `prisma:migrate` | `pnpm prisma:migrate` | Aplica migrações em ambiente de desenvolvimento |
| `prisma:deploy`  | `pnpm prisma:deploy`  | Aplica migrações pendentes em produção |
| `db:seed` | `pnpm db:seed` | Executa o script de povoamento inicial do banco (`prisma/seed.ts`) |

---

## 📁 Estrutura do Projeto

```text
simap/
├── app/                      # Rotas e páginas do Next.js 14 (App Router)
│   ├── [tenantSlug]/         # Rotas dinâmicas multi-tenant
│   │   ├── (app)/            # Páginas autenticadas do sistema
│   │   │   ├── administracao/# Gestão de usuários, auditoria e configurações
│   │   │   ├── checklists/   # Execução e templates de checklists
│   │   │   ├── dashboard/    # Visão geral e indicadores executivos
│   │   │   ├── ordens-servico/# Gestão de Ordens de Serviço (OS)
│   │   │   ├── piloto/       # Operação controlada e grupo piloto
│   │   │   ├── planos-preventivos/ # Planos e periodicidade de manutenção
│   │   │   ├── quilometragem/# Histórico e apontamentos de odômetro
│   │   │   └── veiculos/     # Inventário e cadastro de veículos
│   │   └── login/            # Tela de autenticação por tenant
│   └── api/                  # Endpoints REST internos do Next.js
├── components/               # Componentes reutilizáveis de interface (UI)
│   └── ui/                   # Componentes base (botões, modais, tabelas, inputs)
├── hooks/                    # React Custom Hooks
├── lib/                      # Utilitários, conexões com banco (Prisma) e autenticação
├── prisma/                   # Schema do banco de dados, migrações e seed
│   ├── schema.prisma         # Modelagem relacional do banco de dados
│   └── seed.ts               # Dados iniciais e cenários de demonstração
├── public/                   # Arquivos estáticos e imagens
├── tests/                    # Suíte de testes automatizados com Vitest
├── types/                    # Definições de tipos TypeScript compartilhados
├── docker-compose.yml        # Configuração do container PostgreSQL
├── package.json              # Dependências e scripts do projeto
└── tsconfig.json             # Configurações do compilador TypeScript
```

---

## 🧪 Testes Automatizados

O projeto utiliza **Vitest** para garantir confiabilidade nas regras críticas de negócio (como controle de odômetro, vencimento de manutenções e permissões):

```bash
# Executar todos os testes uma vez
pnpm test

# Executar testes em modo interativo (watch)
pnpm test:watch
```

---

## 🏛️ Contexto e Governança

O **SIMAP** foi estruturado com foco em conformidade pública, transparência de gastos, redução de custos operacionais e rastreabilidade para auditorias externas (Tribunais de Contas) e secretarias municipais.
