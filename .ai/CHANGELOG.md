# Changelog — SIMAP

## [R1 - 1.1.0] - 2026-08-19

### Adicionado (Roadmap R1 - Mês 3: Operação Controlada)
- **Modelos e Migration:** `20260819000001_roadmap_r1_operation` com `VehicleAssignment`, `PilotGroup`, `PilotGroupVehicle`, `OdometerReading`, `ChecklistTemplate`, `ChecklistTemplateItem`, `Inspection`, `InspectionAnswer`, `MaintenanceOrder`, `MaintenanceOrderItem`, `VehicleDowntime`.
- **Regras de Domínio:** `lib/domain/odometer.ts` (validador de hodômetro progressivo e fluxo de correção regressiva com justificativa) e `lib/domain/maintenance-due.ts` (cálculo de vencimento preventivo pelo primeiro limite atingido).
- **Módulo de Quilometragem:** Tela e API de lançamento ágil e histórico de leituras com identificação de origem.
- **Módulo de Checklists Diários:** Tela mobile-first com botões ergonômicos (OK / ALERTA / CRÍTICO / N/A), vinculação automática por categoria e modal de abertura rápida de OS Corretiva para falhas críticas.
- **Módulo de Ordens de Serviço:** Abertura de OS preventivas e corretivas, transição de status (Aberta → Em Execução → Concluída / Cancelada), discriminação de peças e serviços com cálculo automático do custo total e controle de indisponibilidade de viaturas.
- **Grupo Piloto e Linha do Tempo:** Painel de grupos pilotos do Mês 3 e timeline unificada de eventos por veículo.
- **Testes Unitários:** Adicionados 12 novos testes no Vitest (32 testes no total, 100% de aprovação).

## [R0] — 2026-08-19 (Fundação Técnica e Meses 1 e 2 Validados)
### Adicionado
- Estrutura base Next.js 14.2.7 com TypeScript Strict, Tailwind CSS 3.4 e Radix UI / shadcn;
- Multi-tenancy com isolamento por rota `/[tenantSlug]/...` e tenant inicial `jaborandi-sp`;
- Autenticação NextAuth com credenciais e JWT HttpOnly;
- RBAC com 5 papéis (`ADMIN`, `GESTOR`, `OPERADOR`, `MOTORISTA`, `AUDITOR`) e permissões granulares (`UserPermission`);
- Modelagem Prisma para R0 com migrations e seed idempotente;
- Gestão de Frota / Veículos: listagem com busca e filtros, cadastro manual, exportação CSV e importação CSV assistida (com template e preview linha a linha);
- Planos Preventivos por categoria com itens por tempo (dias) e/ou quilometragem (km);
- Painel de Administração de Projeto com os 8 marcos institucionais (M1 e M2 validados 100%, M3-M8 pendentes) e linha de base financeira configurável;
- Módulo de logs de auditoria (`AuditLog`);
- Documentação completa em `.ai/` e testes unitários de domínio.
