# Roadmap Atual: R1 — Operação Controlada (Mês 3)

## 1. Objetivo
Permitir que motoristas e operadores realizem registros de quilometragem com prevenção de regressão, executem checklists diários touch-friendly com ação imediata para abertura de OS corretiva em falhas críticas, operem ordens de serviço preventivas e corretivas com cálculo detalhado de custos (peças e mão de obra), monitorem paradas/indisponibilidade de viaturas e acompanhem a operação de grupos pilotos e a timeline integrada dos veículos.

## 2. Status
- **Status Geral:** CONCLUÍDO
- **Data de Início:** 2026-08-19
- **Data de Conclusão:** 2026-08-19

## 3. Itens Entregues no R1
- [x] Modelagem relacional e migration versionada `20260819000001_roadmap_r1_operation`;
- [x] Regras de domínio e validação de hodômetro não decrescente (`lib/domain/odometer.ts`);
- [x] Motor de cálculo de vencimento preventivo pelo primeiro limite atingido (`lib/domain/maintenance-due.ts`);
- [x] Templates padrão de checklist no seed para Ônibus, Ambulâncias, Carros e Caminhões;
- [x] API e tela de registro e histórico de hodômetro (`/quilometragem`);
- [x] API e tela de execução de checklists touch-friendly (`/checklists` e `/checklists/executar`);
- [x] Ponte imediata de checklist crítico para abertura de OS Corretiva;
- [x] API e telas de abertura, avanço de status, lançamento de peças/mão de obra e conclusão de Ordens de Serviço (`/ordens-servico`, `/novo`, `/[id]`);
- [x] Registro e controle de indisponibilidade de viaturas (`VehicleDowntime`);
- [x] API e tela de monitoramento de Grupo Piloto (`/piloto`);
- [x] API e tela de Linha do Tempo visual integrada do veículo (`/veiculos/[id]/timeline`);
- [x] Testes unitários com Vitest — 32 testes passando (100%);
- [x] Validações estritas: `pnpm typecheck` (OK), `pnpm lint` (OK), `pnpm test` (OK), `pnpm build` (OK).

## 4. Próximo Roadmap
- **R2 — Mês 4: Monitoramento e Visão Financeira** (Aguardando autorização).
