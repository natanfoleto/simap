# Registro de Decisões de Arquitetura (ADRs) — SIMAP

## ADR 001: Adoção de Next.js 14 App Router e Multi-Tenancy por URL e Sessão
- **Contexto:** O SIMAP inicia em Jaborandi/SP, mas precisa permitir expansão para outros municípios sem reescrita estrutural.
- **Decisão:** Estruturar todas as rotas operacionais sob `app/[tenantSlug]/(app)/...`, validando o slug da URL diretamente contra o token de sessão e aplicando escopo estrito de `tenantId` em todas as queries do Prisma.
- **Consequências:** Garante isolamento estrito de dados, URLs limpas e fáceis de auditar, impedindo injeção indevida de dados entre diferentes prefeituras.

## ADR 002: Linha de Base Financeira Configurável e Meta Dinâmica
- **Contexto:** O projeto apresenta uma divergência entre a linha de base recorrente de R$ 285.000,00 e o exemplo de cálculo de R$ 300.000,00 com meta de 20%.
- **Decisão:** Armazenar a linha de base (ano de referência e valor monetário) e a meta percentual (20%) como configurações dinâmicas de projeto (`ProjectSetting`), calculando a economia esperada de forma dinâmica (R$ 57.000,00 para a base de R$ 285.000,00).
- **Consequências:** Flexibilidade para ajustes futuros pela gestão municipal sem necessidade de alteração de código ou migração destrutiva.

## ADR 003: Validação de Importação CSV em Dois Passos (Preview + Commit Transacional)
- **Contexto:** A frota de 97 veículos precisa ser importada sem risco de cadastros parciais corrompidos ou duplicações silenciosas de placas.
- **Decisão:** Criar fluxo em duas etapas no endpoint de importação: a primeira realiza parsing e validação linha a linha retornando relatório detalhado de erros; a segunda persiste todas as linhas válidas em uma única transação Prisma após confirmação do usuário.
- **Consequências:** Operação segura, zero inconsistências no banco e feedback visual imediato para o gestor.
