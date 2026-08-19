# Arquitetura do Sistema — SIMAP

## 1. Visão Geral
O SIMAP é estruturado como uma aplicação web moderna, modular e multi-tenant construída sobre Next.js 14 (App Router) com TypeScript estrito, Prisma ORM e PostgreSQL.

```
.
├── .ai/                       # Documentação e regras operacionais de IA
├── app/
│   ├── [tenantSlug]/          # Isolamento multi-tenant por rota
│   │   ├── (app)/             # Rotas autenticadas do sistema
│   │   │   ├── dashboard/     # Visão geral e indicadores principais
│   │   │   ├── veiculos/      # Gestão da frota e importação CSV
│   │   │   ├── planos-preventivos/ # Planos por categoria e itens
│   │   │   └── administracao/ # Usuários, permissões, marcos e auditoria
│   │   ├── login/             # Autenticação
│   │   └── transparencia/     # Página pública agregada (Roadmap R6)
│   ├── api/                   # Handlers de API REST seguros
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── domain/                # Componentes específicos do SIMAP (Veículos, Planos, etc.)
│   ├── layout/                # Sidebar, Header, Breadcrumbs, Tema, Navegação
│   ├── providers/             # TanStack Query, NextAuth, ThemeProvider
│   └── ui/                    # Primitivas Radix + Tailwind (padrão shadcn/ui)
├── hooks/                     # Custom React Hooks
├── lib/
│   ├── api-helpers.ts         # Respostas tipadas ApiSuccess/ApiFailure
│   ├── audit.ts               # Gravação de trilha de auditoria
│   ├── auth.ts                # Configuração NextAuth e helpers bcrypt
│   ├── formatters.ts          # Formatadores de moeda BRL, hodômetro e formatUTCDate
│   ├── permissions.ts         # Matriz RBAC e avaliador de permissões
│   ├── prisma.ts              # Singleton PrismaClient
│   ├── query-keys.ts          # Chaves de cache TanStack Query
│   ├── tenant.ts              # Helpers de validação e escopo multi-tenant
│   ├── utils.ts               # Utilitários gerais e cn()
│   └── validations.ts         # Schemas de validação Zod
└── prisma/
    ├── schema.prisma          # Modelagem relacional Prisma
    ├── migrations/            # Migrations versionadas
    └── seed.ts                # Seed inicial idempotente
```

## 2. Multi-tenancy
- **Identificação do Tenant:** O tenant é identificado pela rota `/[tenantSlug]/...` e validado contra a sessão do usuário.
- **Validação de Escopo:** Em nenhuma hipótese o `tenantId` vindo do corpo da requisição é aceito sem confrontação com o token da sessão (`requireTenantAccess`).
- **Isolamento de Dados:** Consultas Prisma usam filtros automáticos de tenant (`where: { tenantId }`), e restrições únicas são compostas com `tenantId` (ex: `@@unique([tenantId, plate])`).

## 3. Autenticação e RBAC
- **Provedor:** NextAuth.js com Credentials Provider e JWT assinado armazenado em cookie HttpOnly.
- **Papéis Base (Role):** `ADMIN`, `GESTOR`, `OPERADOR`, `MOTORISTA`, `AUDITOR`.
- **Permissões Granulares (`UserPermission`):** Mapeamento por `module:action` permitindo overrides por usuário.

## 4. Pipeline Padronizado de API
Toda rota privada executa obrigatoriamente a sequência:
1. Obtenção e verificação de Sessão (`auth`);
2. Validação de Permissão Granular (`permissions`);
3. Validação de Tenant e Escopo (`tenant`);
4. Validação e parsing de entrada com Zod (`validations`);
5. Execução de Regra de Negócio e Transação Prisma;
6. Gravação de Registro de Auditoria (`audit`);
7. Retorno formatado em `ApiSuccess<T>` ou `ApiFailure`.

## 5. Auditoria (`AuditLog`)
Toda mutação crítica registra `userId`, `tenantId`, `action`, `entity`, `entityId`, `oldValues`, `newValues`, `ipAddress` e `userAgent`.
