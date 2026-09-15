# Roadmap Atual: R2 — Monitoramento, Ajustes e Visão Financeira (Mês 4)

## 1. Objetivo
Transformar os registros operacionais (hodômetros, checklists e ordens de serviço) em indicadores consolidados e confiáveis de custo, frotas, disponibilidade e dotações orçamentárias. Apoiar a gestão municipal de Jaborandi/SP na transição para a manutenção preventiva com acompanhamento de metas financeiras, identificação clara de cobertura dos dados sem mascaramento de ausência como zero, controle de inconsistências e exportação executiva em PDF e CSV.

## 2. Status
- **Status Geral:** CONCLUÍDO
- **Data de Início:** 2026-09-15
- **Data de Conclusão:** 2026-09-15

## 3. Itens Entregues no R2
- [x] Modelagem relacional e migration versionada `20260915000000_roadmap_r2_finance_monitoring` (`AnnualMaintenanceBudget`, `KpiSnapshot`, `MonthlyProjectUpdate`);
- [x] Regras de domínio e validação segura de Custo por Km sem denominador inválido (`lib/domain/financial-indicators.ts`);
- [x] Algoritmo de fusão de intervalos de indisponibilidade (*Interval Merging*) sem dupla contagem de paradas sobrepostas;
- [x] Motor de avaliação de qualidade e integridade dos registros operacionais (`evaluateDataQuality`);
- [x] Endpoint de análise financeira consolidada com filtros multidimensionais e comparativo percentual com período anterior (`/api/financial`);
- [x] API e tela de gestão de Orçamento Anual de Manutenção (Planejado vs. Realizado, linha de base e meta de 20%) em `/financeiro/orcamento`;
- [x] API e funcionalidade de congelamento de Snapshots Mensais imutáveis (`/api/kpi-snapshots`);
- [x] API e formulário para registros mensais de governança e próximos passos do projeto (`/api/monthly-updates`);
- [x] Painel de Auditoria e Diagnóstico de Inconsistências operacionais (`/inconsistencias`);
- [x] Painel de Monitoramento & Visão Financeira com Recharts responsivos (Evolução de Custos, Distribuição por Categoria, Proporção Preventiva/Corretiva) em `/financeiro`;
- [x] Gerador de Relatório Executivo em PDF diagramado com jsPDF e AutoTable (`lib/reports/financial-pdf.ts`);
- [x] Exportação tabular em formato CSV dos dados de veículos e custos;
- [x] Atualização de navegação lateral com controle de acesso RBAC (`financeiro:ver`);
- [x] Seed idempotente para o ano de 2026 com orçamento, snapshot e relatório do Mês 4;
- [x] Testes unitários com Vitest — 46 testes passando (100% de aprovação);
- [x] Validações estritas de tipagem (`pnpm typecheck`) e testes automatizados (`pnpm test`).

## 4. Próximo Roadmap
- **R3 — Mês 5: 1º Relatório Executivo de Desempenho da Frota** (Aguardando autorização).
