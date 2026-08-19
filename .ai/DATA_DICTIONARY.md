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
