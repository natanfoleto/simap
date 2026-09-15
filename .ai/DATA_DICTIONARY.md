# Dicionário de Dados — SIMAP (Roadmap R0)

## 1. Entidades Principais

### `Tenant` (Organização / Município)
| Campo | Tipo | Nulo | Descrição | Origem / Sensibilidade |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único do tenant | Sistema |
| `name` | `String` | Não | Nome da entidade (ex: Município de Jaborandi/SP) | Cadastro institucional |
| `slug` | `String` | Não | Slug para URL única (ex: jaborandi-sp) | Sistema / Roteamento |
| `cnpj` | `String` | Sim | CNPJ da prefeitura/entidade | Institucional |
| `active` | `Boolean` | Não | Status de atividade do tenant | Padrão: true |
| `createdAt` | `DateTime` | Não | Data de criação (UTC) | Sistema |
| `updatedAt` | `DateTime` | Não | Data de atualização (UTC) | Sistema |

### `User` (Usuários do Sistema)
| Campo | Tipo | Nulo | Descrição | Origem / Sensibilidade |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único do usuário | Sistema |
| `tenantId` | `String` | Sim | Tenant vinculado (nulo para SuperAdmin) | Sistema |
| `name` | `String` | Não | Nome completo | Cadastro |
| `email` | `String` | Não | E-mail corporativo / login único | Cadastro / Sensível |
| `passwordHash` | `String` | Não | Hash bcrypt da senha | Segurança / Confidencial |
| `role` | `Enum (Role)` | Não | ADMIN, GESTOR, OPERADOR, MOTORISTA, AUDITOR | RBAC |
| `active` | `Boolean` | Não | Status ativo/inativo | Padrão: true |

### `UserPermission` (Permissões Granulares)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `userId` | `String` | Não | Usuário vinculado |
| `module` | `String` | Não | Módulo (veiculos, planos, quilometragem, etc.) |
| `action` | `String` | Não | Ação (ver, criar, editar, inativar, etc.) |
| `granted` | `Boolean` | Não | Concessão explícita ou revogação (override) |

### `Vehicle` (Frota Municipal)
| Campo | Tipo | Nulo | Descrição | Origem / Sensibilidade |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único | Sistema |
| `tenantId` | `String` | Não | Tenant vinculado | Sistema |
| `fleetCode` | `String` | Não | Código interno da frota (ex: ONB-01, AMB-04) | Operação |
| `plate` | `String` | Não | Placa do veículo | Operação / Não expor na transparência |
| `category` | `Enum (VehicleCategory)`| Não | ONIBUS, CARRO, AMBULANCIA, VAN, CAMINHAO, MOTOCICLETA, MAQUINA, OUTRO | Domínio |
| `brand` | `String` | Não | Fabricante / Marca | Operação |
| `model` | `String` | Não | Modelo do veículo | Operação |
| `year` | `Int` | Não | Ano de fabricação / modelo | Operação |
| `fuelType` | `String` | Não | DIESEL, GASOLINA, FLEX, ELETRICO, OUTRO | Operação |
| `purpose` | `String` | Não | Finalidade / uso | Operação |
| `department` | `String` | Sim | Secretaria ou departamento responsável | Institucional |
| `criticality` | `Enum (Criticality)` | Não | BAIXA, MEDIA, ALTA, CRITICA | Gestão |
| `status` | `Enum (VehicleStatus)` | Não | ATIVO, MANUTENCAO, INATIVO | Operação |
| `currentOdometer` | `Int` | Não | Quilometragem atual derivada | Padrão: 0 |
| `isPilot` | `Boolean` | Não | Pertence ao grupo piloto inicial | Padrão: false |
| `active` | `Boolean` | Não | Registro ativo | Padrão: true |
| `notes` | `String` | Sim | Observações adicionais | Operação |

### `PreventivePlan` (Planos de Manutenção Preventiva)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `tenantId` | `String` | Não | Tenant vinculado |
| `name` | `String` | Não | Nome do plano (ex: Plano Preventivo Ônibus Escolar) |
| `category` | `Enum (VehicleCategory)`| Não | Categoria aplicável |
| `description` | `String` | Sim | Detalhamento do plano |
| `version` | `Int` | Não | Versão do plano (Padrão: 1) |
| `isPublished` | `Boolean` | Não | Se o plano está publicado e ativo |
| `active` | `Boolean` | Não | Status de atividade do plano |

### `PreventivePlanItem` (Itens do Plano)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `planId` | `String` | Não | Plano pai vinculado |
| `tenantId` | `String` | Não | Tenant vinculado |
| `name` | `String` | Não | Nome do serviço/inspeção (ex: Troca de Óleo e Filtro) |
| `description` | `String` | Sim | Descrição do procedimento |
| `intervalKm` | `Int` | Sim | Intervalo de quilometragem (ex: 10000 km) |
| `intervalDays` | `Int` | Sim | Intervalo em dias (ex: 180 dias) |
| `toleranceKm` | `Int` | Sim | Antecedência para alerta em km (ex: 500 km) |
| `toleranceDays`| `Int` | Sim | Antecedência para alerta em dias (ex: 15 dias) |
| `priority` | `Enum (Criticality)` | Não | BAIXA, MEDIA, ALTA, CRITICA |
| `isMandatory` | `Boolean` | Não | Item de cumprimento obrigatório |
| `orderIndex` | `Int` | Não | Ordem de exibição |

### `ProjectMilestone` (Marcos do Pro Inova)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `tenantId` | `String` | Não | Tenant vinculado |
| `monthNumber` | `Int` | Não | 1 a 8 |
| `title` | `String` | Não | Título institucional do marco |
| `deliverable` | `String` | Não | Entregável correspondente |
| `evidence` | `String` | Não | Evidência requerida |
| `status` | `Enum (MilestoneStatus)` | Não | VALIDADO, EM_ANDAMENTO, PENDENTE |
| `completionPercentage` | `Decimal` | Não | Percentual de conclusão (0 a 100) |
| `validatedAt` | `DateTime` | Sim | Data de validação |

### `AuditLog` (Trilha de Auditoria)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `tenantId` | `String` | Não | Tenant vinculado |
| `userId` | `String` | Sim | Usuário executor |
| `action` | `String` | Não | Ação realizada (CRIAR, EDITAR, INATIVAR, IMPORTAR, etc.) |
| `entity` | `String` | Não | Nome da entidade (Vehicle, PreventivePlan, etc.) |
| `entityId` | `String` | Não | ID do registro afetado |
| `oldValues` | `Json` | Sim | Estado anterior em JSON |
| `newValues` | `Json` | Sim | Novo estado em JSON |
| `ipAddress` | `String` | Sim | IP de origem |
| `userAgent` | `String` | Sim | Agente do cliente |
| `createdAt` | `DateTime` | Não | Carimbo de data/hora (UTC) |

### `AnnualMaintenanceBudget` (Orçamento Anual — R2)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `tenantId` | `String` | Não | Tenant vinculado |
| `year` | `Int` | Não | Ano do exercício orçamentário |
| `baselineAmount` | `Decimal(12,2)` | Não | Valor da linha de base de referência histórica (R$) |
| `targetReductionPercentage` | `Decimal(5,2)` | Não | Meta percentual de redução (padrão: 20%) |
| `plannedPreventive` | `Decimal(12,2)` | Não | Dotação planejada para manutenções preventivas (R$) |
| `plannedCorrective` | `Decimal(12,2)` | Não | Dotação planejada para manutenções corretivas (R$) |
| `plannedContingency` | `Decimal(12,2)` | Não | Dotação reservada para contingência (R$) |
| `notes` | `String` | Sim | Observações adicionais da dotação |

### `KpiSnapshot` (Snapshot Mensal Congelado de KPIs — R2)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `tenantId` | `String` | Não | Tenant vinculado |
| `referenceYear` | `Int` | Não | Ano de referência |
| `referenceMonth` | `Int` | Não | Mês de referência (1 a 12) |
| `totalCost` | `Decimal(12,2)` | Não | Custo total consolidado no mês (R$) |
| `preventiveCost` | `Decimal(12,2)` | Não | Custo com manutenções preventivas no mês (R$) |
| `correctiveCost` | `Decimal(12,2)` | Não | Custo com manutenções corretivas no mês (R$) |
| `totalOrders` | `Int` | Não | Quantidade total de ordens abertas/executadas |
| `totalKmDriven` | `Int` | Sim | Quilometragem líquida rodada pela frota no mês |
| `costPerKm` | `Decimal(12,4)` | Sim | Custo médio apurado por km rodado (R$/km) |
| `availabilityPercentage` | `Decimal(5,2)` | Não | Taxa de disponibilidade líquida da frota (%) |
| `totalDowntimeHours` | `Decimal(10,2)` | Não | Horas líquidas de parada sem contagem dupla |
| `preventiveCompliancePercentage` | `Decimal(5,2)` | Não | Taxa de cumprimento das preventivas programadas (%) |
| `dataQualityScore` | `Decimal(5,2)` | Não | Pontuação de integridade dos registros operacionais |
| `metricsData` | `Json` | Não | DTO tipado imutável com todos os indicadores congelados |
| `isFrozen` | `Boolean` | Não | Indica que o snapshot está fechado e inviolável |

### `MonthlyProjectUpdate` (Registro de Governança Mensal — R2)
| Campo | Tipo | Nulo | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `String (cuid)` | Não | Identificador único |
| `tenantId` | `String` | Não | Tenant vinculado |
| `referenceYear` | `Int` | Não | Ano de referência |
| `referenceMonth` | `Int` | Não | Mês de referência |
| `advancesSummary` | `String` | Não | Resumo dos avanços e entregas do mês |
| `nextSteps` | `String` | Não | Próximos passos e metas para o mês subsequente |
| `observations` | `String` | Sim | Observações técnicas e recomendações para a prefeitura |

