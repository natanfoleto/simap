# Prompt Mestre para o Antigravity — SIMAP

> **Sistema:** SIMAP — Sistema Municipal de Manutenção Preventiva  
> **Município inicial:** Jaborandi/SP  
> **Programa:** Pro Inova  
> **Linha temática:** Transporte Público  
> **Duração oficial do projeto:** 8 meses  
> **Modo de desenvolvimento:** incremental, um roadmap por vez

---

## 0. Instrução principal ao agente

Você é o agente de engenharia responsável por projetar e desenvolver o **SIMAP — Sistema Municipal de Manutenção Preventiva**, uma aplicação web municipal para controle básico, confiável e auditável da manutenção da frota pública.

O sistema deve transformar uma operação atualmente predominantemente corretiva em uma operação controlada, com:

- cadastro e classificação da frota;
- registro de quilometragem;
- planos de manutenção preventiva por tempo e/ou quilometragem;
- checklists operacionais;
- ordens de serviço preventivas e corretivas;
- rastreabilidade de custos, intervenções e períodos de indisponibilidade;
- indicadores gerenciais;
- relatórios executivos;
- recomendações de otimização;
- publicação segura de informações agregadas para transparência pública.

Leia este documento integralmente antes de alterar qualquer arquivo. Implemente somente o roadmap autorizado pelas regras de execução incremental. Não tente concluir o sistema inteiro em uma única execução.

---

## 1. Configuração de execução incremental

Use a seguinte variável lógica para decidir o que implementar:

```text
ROADMAP_ALVO=AUTO
```

Regras:

1. Se `ROADMAP_ALVO` estiver definido explicitamente como `R0`, `R1`, `R2`, `R3`, `R4`, `R5` ou `R6`, implemente **somente** esse roadmap.
2. Se estiver como `AUTO`:
   - inspecione `.ai/ROADMAP.md` e `.ai/CURRENT_ROADMAP.md`;
   - implemente apenas o primeiro roadmap ainda não concluído;
   - em repositório novo, comece pelo `R0`.
3. Não implemente telas, tabelas, APIs ou regras dos roadmaps futuros, exceto contratos mínimos explicitamente necessários para não quebrar a arquitetura atual.
4. Não marque um roadmap como concluído sem cumprir todos os critérios de aceite e executar as verificações técnicas.
5. Ao finalizar um roadmap:
   - atualize `.ai/ROADMAP.md`;
   - atualize `.ai/CURRENT_ROADMAP.md`;
   - registre decisões em `.ai/DECISIONS.md`;
   - registre mudanças em `.ai/CHANGELOG.md`;
   - apresente o relatório de encerramento definido neste prompt;
   - pare. Não avance automaticamente para o roadmap seguinte.
6. Não execute operações de Git. Não inicialize repositório, não crie branch, não faça commit, push, pull ou merge.
7. Não invente dados reais da frota. A lista oficial dos 97 veículos será importada ou cadastrada quando fornecida.
8. Quando houver uma lacuna não bloqueante, adote a solução mais simples, segura e coerente, registre a decisão e continue.
9. Quando houver uma lacuna realmente bloqueante, crie um item claro em `.ai/PENDING_INPUTS.md`, mantenha o sistema funcional com dados configuráveis e não fabrique informação.

---

## 2. Contexto institucional e operacional

A Prefeitura de Jaborandi/SP opera uma frota de **97 veículos públicos**, incluindo ônibus, carros, ambulâncias e outras categorias. Atualmente não existe controle estruturado de manutenção preventiva no SCPI, e a atuação ocorre majoritariamente de forma corretiva.

O gasto informado com manutenção corretiva em 2025 é de aproximadamente **R$ 285.000,00**. O projeto busca reduzir a dependência de corretivas, aumentar a disponibilidade da frota, melhorar a previsibilidade orçamentária e criar rastreabilidade para decisões futuras sobre manutenção, contratos, uso e renovação de veículos.

Público envolvido:

- gestores municipais;
- equipe de manutenção;
- motoristas do sistema público;
- auditores e responsáveis pela transparência;
- passageiros e cidadãos, por meio da página pública agregada;
- mais de 100 pessoas impactadas direta ou indiretamente.

Metodologia institucional:

- ciclo PDCA;
- implantação incremental;
- piloto em veículos ou categorias críticas;
- validação em operação real;
- observação direta de uso;
- coleta de feedback rápido;
- ajustes semanais;
- expansão gradual após estabilização.

O foco inicial é consistência operacional, qualidade mínima de dados e simplicidade. Não introduza tecnologia complexa sem necessidade.

---

## 3. Premissas de interpretação obrigatórias

### 3.1 Duração de 6 meses versus 8 meses

O material de origem menciona um “ciclo de 6 meses” no resumo, porém o cronograma oficial contém **8 entregas mensais**. Considere:

- **8 meses** como duração oficial do programa;
- os **6 primeiros meses** como núcleo de implantação, monitoramento e validação operacional;
- os meses 7 e 8 como otimização, recomendações, consolidação executiva e transparência.

Não esconda essa distinção nos documentos do projeto.

### 3.2 Linha de base financeira divergente

O material informa repetidamente gasto anual de **R$ 285.000,00**, mas o indicador de sucesso apresenta o exemplo `R$ 300.000,00 x 20% = R$ 60.000,00`.

Portanto:

- a linha de base anual deve ser **configurável** no sistema;
- o seed inicial deve usar `R$ 285.000,00`, por ser o valor mais recorrente no projeto;
- a meta deve ser armazenada como **20%**, sem valor fixo de economia;
- o valor financeiro da meta deve ser calculado dinamicamente;
- com base de R$ 285.000,00, a meta calculada é R$ 57.000,00;
- com base oficial futura de R$ 300.000,00, a meta será R$ 60.000,00;
- relatórios devem identificar claramente qual linha de base foi usada.

### 3.3 Relação com o SCPI

Embora o projeto original declare que não pretende criar um sistema complexo nem substituir integralmente o SCPI, o SIMAP será desenvolvido como uma **ferramenta complementar, leve e especializada**.

Regras:

- não substituir o SCPI;
- não criar integração automática nesta fase;
- permitir importação e exportação manual por CSV quando necessário;
- permitir registrar referências externas, como número de empenho, contrato, nota fiscal ou registro do SCPI, sem modelar um sistema completo de compras;
- manter a implantação simples e progressiva.

### 3.4 Conformidade legal

O sistema deve apoiar rastreabilidade e transparência compatíveis com os objetivos informados da:

- Lei nº 14.133/2021, por meio de registros, histórico, controle, referências documentais e auditoria;
- Lei nº 12.527/2011, por meio de transparência ativa com dados agregados e publicação controlada.

O software não deve se apresentar como certificação jurídica. A aplicação apenas implementa controles e mecanismos técnicos alinhados às necessidades descritas.

---

## 4. Escopo funcional obrigatório

O SIMAP deve permitir, ao longo dos roadmaps:

1. Cadastro e classificação dos 97 veículos por tipo e uso.
2. Controle de quilometragem por veículo.
3. Plano de manutenção preventiva por categoria, usando tempo, quilometragem ou o primeiro limite atingido.
4. Checklists operacionais simples.
5. Registro estruturado de manutenções preventivas e corretivas.
6. Ordens de serviço e histórico por veículo.
7. Registro de custos de peças, mão de obra e outros custos.
8. Registro de indisponibilidade e retorno à operação.
9. Indicadores de custo por km, disponibilidade, preventivas, corretivas e qualidade dos dados.
10. Orçamento anual dividido entre preventiva, corretiva e reserva/contingência.
11. Relatórios executivos e comparativos.
12. Identificação de veículos críticos.
13. Recomendações formais de otimização.
14. Página pública com dados agregados e relatórios publicados.
15. Treinamento e documentação operacional por perfil.
16. Auditoria de ações críticas.
17. Controle de usuários, cargos, permissões e isolamento por organização.

---

## 5. Escopo negativo obrigatório

Não desenvolver nesta fase:

- telemetria;
- rastreamento em tempo real;
- GPS;
- manutenção preditiva com IA;
- otimização de rotas;
- redesenho logístico;
- substituição do SCPI;
- integração automática com financeiro, compras, contratos ou outros sistemas;
- módulo completo de licitações ou contratos;
- renovação ou compra de frota;
- decisão automatizada de substituição de veículos;
- automação avançada;
- aplicativo móvel nativo;
- perfeição ou reconstrução forçada de todo o histórico antigo;
- exposição pública de dados individuais dos veículos;
- exposição pública de custos por fornecedor;
- exposição pública de acessos, arquitetura interna ou informações operacionais sensíveis.

O sistema web deve ser responsivo e funcionar bem em celulares, mas não deve virar aplicativo nativo neste projeto.

---

## 6. Stack tecnológica obrigatória

Use exatamente a base tecnológica abaixo, salvo correção de segurança estritamente necessária e documentada:

### Core

- Next.js `14.2.7`.
- React `18`.
- App Router.
- TypeScript `5.x` com `strict: true`.
- `any` é proibido, inclusive em respostas genéricas. Use generics, `unknown` e validação explícita.
- Gerenciador de pacotes: `pnpm`.
- Scripts TypeScript executados com `pnpm tsx`.

### Banco e ORM

- PostgreSQL.
- Prisma ORM `5.22.0`.
- Migrations versionadas.
- Seed em `prisma/seed.ts`.

### Autenticação

- NextAuth.js `4.24.7`.
- Credentials Provider.
- JWT em cookie HTTP-only.
- Senhas com `bcryptjs`.

### Estado e requisições

- TanStack Query v5.
- Invalidação de chaves após mutações.
- Não usar estado global desnecessário.

### Formulários e validação

- `react-hook-form` v7.
- `zod` v3.
- `@hookform/resolvers/zod`.
- O mesmo schema ou contrato equivalente deve proteger frontend e backend.

### UI

- Tailwind CSS `3.4.1`.
- PostCSS e Autoprefixer.
- Radix UI.
- Componentes locais no padrão shadcn/ui.
- `clsx`, `tailwind-merge`, `class-variance-authority`, `tailwindcss-animate`.
- `lucide-react`.
- `next-themes`.

### Visualização e documentos

- `recharts` para gráficos.
- `jspdf`, `jspdf-autotable` e `html2canvas` para relatórios em PDF.
- `date-fns` para datas.

### Testes

Caso ainda não exista infraestrutura de testes, adicione de forma mínima e documentada:

- Vitest para regras de domínio e APIs/helpers;
- React Testing Library para componentes críticos;
- Playwright para fluxos essenciais, somente quando o roadmap exigir E2E.

Não adicione bibliotecas redundantes para funções já cobertas pela stack.

---

## 7. Arquitetura do projeto

Use a seguinte organização como base:

```text
.
├── .ai/
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── RULES.md
│   ├── ROADMAP.md
│   ├── CURRENT_ROADMAP.md
│   ├── DATA_DICTIONARY.md
│   ├── DECISIONS.md
│   ├── CHANGELOG.md
│   └── PENDING_INPUTS.md
├── app/
│   ├── [tenantSlug]/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── veiculos/
│   │   │   ├── planos-preventivos/
│   │   │   ├── quilometragem/
│   │   │   ├── checklists/
│   │   │   ├── ordens-servico/
│   │   │   ├── indicadores/
│   │   │   ├── orcamento/
│   │   │   ├── relatorios/
│   │   │   ├── recomendacoes/
│   │   │   ├── administracao/
│   │   │   └── layout.tsx
│   │   ├── login/
│   │   └── transparencia/
│   ├── api/
│   │   ├── auth/
│   │   ├── vehicles/
│   │   ├── odometer-readings/
│   │   ├── preventive-plans/
│   │   ├── inspections/
│   │   ├── maintenance-orders/
│   │   ├── indicators/
│   │   ├── budgets/
│   │   ├── reports/
│   │   ├── recommendations/
│   │   └── public/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   ├── providers/
│   ├── domain/
│   └── ui/
├── hooks/
├── lib/
│   ├── api-helpers.ts
│   ├── audit.ts
│   ├── auth.ts
│   ├── formatters.ts
│   ├── permissions.ts
│   ├── prisma.ts
│   ├── query-keys.ts
│   ├── utils.ts
│   ├── validations.ts
│   └── domain/
│       ├── maintenance-due.ts
│       ├── indicators.ts
│       ├── odometer.ts
│       └── reports.ts
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── scripts/
├── types/
├── middleware.ts
├── docker-compose.yml
├── .env.example
├── package.json
└── tailwind.config.ts
```

Não crie todas as pastas funcionais antecipadamente com telas vazias. Crie somente o necessário para o roadmap atual e mantenha o mapa arquitetural nos documentos `.ai`.

---

## 8. Arquitetura multi-tenant

Mesmo que o primeiro uso seja Jaborandi/SP, o sistema deve nascer preparado para outras organizações.

Regras obrigatórias:

1. Todas as rotas privadas ficam sob `app/[tenantSlug]/(app)/...`.
2. O tenant inicial terá:
   - nome: `Município de Jaborandi/SP`;
   - slug: `jaborandi-sp`.
3. Entidades operacionais devem possuir `tenantId`.
4. Toda consulta Prisma de entidade operacional deve aplicar o escopo do tenant da sessão.
5. Não confiar apenas no `tenantSlug` da URL.
6. Criar helpers neutros de domínio:
   - `requireTenantAccess()`;
   - `getTenantScopeFilter()`;
   - `assertEntityBelongsToTenant()`.
7. Não reutilizar nomes escolares do blueprint, como `schoolId` ou `requireSchoolAccess`.
8. Usuários operacionais ficam restritos ao tenant vinculado.
9. Um administrador global pode ter `tenantId` nulo e acesso explícito a múltiplos tenants, mas isso deve ser validado no backend.
10. Índices e restrições únicas devem considerar o tenant, por exemplo `@@unique([tenantId, plate])` quando aplicável.

---

## 9. Autenticação, RBAC e escopo operacional

### 9.1 Cargos base

Use no mínimo:

```text
ADMIN
GESTOR
OPERADOR
MOTORISTA
AUDITOR
```

Interpretação:

- `ADMIN`: gestão de tenant, usuários, permissões, configurações e todos os módulos.
- `GESTOR`: gestão completa da frota, planos, ordens, indicadores, relatórios, orçamento e recomendações.
- `OPERADOR`: rotina de quilometragem, checklists, ordens de serviço e registros de manutenção.
- `MOTORISTA`: registrar quilometragem e checklists dos veículos aos quais está vinculado; consultar apenas informações operacionais necessárias.
- `AUDITOR`: leitura de dados, relatórios e logs permitidos, sem mutações operacionais.

A página pública não usa usuário `PUBLICO`; ela acessa somente endpoints públicos com DTO estritamente limitado.

### 9.2 Permissões granulares

Implemente `UserPermission` com `module`, `action` e `granted`.

Módulos e ações mínimas, adicionados conforme o roadmap:

```text
dashboard:ver
veiculos:ver
veiculos:criar
veiculos:editar
veiculos:inativar
veiculos:importar
quilometragem:ver
quilometragem:registrar
quilometragem:corrigir
planos:ver
planos:criar
planos:editar
planos:publicar
checklists:ver
checklists:executar
checklists:gerenciar
ordens:ver
ordens:criar
ordens:editar
ordens:concluir
ordens:cancelar
ordens:corrigir
ordens:excluir_forcado
financeiro:ver
financeiro:editar
relatorios:ver
relatorios:gerar
relatorios:publicar
recomendacoes:ver
recomendacoes:criar
recomendacoes:aprovar
usuarios:gerenciar
auditoria:ver
```

### 9.3 Escopo do motorista

Quando o módulo operacional for implementado:

- crie vínculo entre usuário motorista e veículo;
- motorista só pode registrar dados nos veículos com vínculo ativo;
- gestor e operador podem registrar em qualquer veículo do tenant conforme permissão;
- qualquer tentativa fora do escopo deve retornar `403`;
- não confie no ID enviado pelo cliente sem validar vínculo e tenant.

---

## 10. Pipeline obrigatório das APIs

Toda rota privada deve executar nesta ordem:

```typescript
export async function POST(req: Request) {
  // 1. Sessão
  const session = await getSessionWithPermissions()
  if (!session) return unauthorizedResponse()

  // 2. Permissão granular
  const permissionError = requirePermission(session, 'modulo', 'acao')
  if (permissionError) return permissionError

  // 3. Tenant e escopo operacional
  const scopeError = requireTenantAccess(session, tenantId)
  if (scopeError) return scopeError

  // 4. Parse e validação Zod
  // 5. Regra de negócio
  // 6. Transação quando necessário
  // 7. Auditoria
  // 8. Resposta padronizada
}
```

Regras adicionais:

- Nunca aceitar `tenantId` do corpo como fonte de verdade sem validar a sessão.
- Sempre validar parâmetros de rota, query string e body com Zod.
- Usar DTOs de entrada e saída.
- Não retornar modelos Prisma crus em endpoints públicos.
- Paginar listas potencialmente grandes.
- Ordenação e filtros devem usar allowlist.
- Tratar erros de conflito com status `409`.
- Não expor stack trace ao cliente.

### Respostas padronizadas

Use helpers genéricos e tipados:

```typescript
type ApiSuccess<T> = {
  success: true
  message: string
  data: T
}

type ApiFailure<TDetails = unknown> = {
  success: false
  message: string
  errorCode: string
  details?: TDetails
}
```

Códigos de erro devem ser estáveis, por exemplo:

```text
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
TENANT_MISMATCH
NOT_FOUND
CONFLICT
ODOMETER_REGRESSION
DEPENDENCIES_EXIST
REPORT_ALREADY_PUBLISHED
INTERNAL_ERROR
```

---

## 11. Auditoria e exclusões seguras

Crie `AuditLog` contendo, no mínimo:

- `userId`;
- `action`;
- `entity`;
- `entityId`;
- `oldValues`;
- `newValues`;
- `ipAddress`;
- `userAgent`;
- `tenantId`;
- `createdAt`.

Auditar obrigatoriamente:

- login e falha de login quando aplicável;
- criação, edição, inativação e exclusão;
- correção de quilometragem;
- conclusão, reabertura ou correção de ordem de serviço;
- alteração de custos;
- publicação e despublicação de relatório;
- alteração de meta, linha de base ou orçamento;
- alteração de permissões.

Regras de exclusão:

- prefira inativação ou `deletedAt` para entidades operacionais;
- se houver dependências, retornar `409 CONFLICT` com resumo das dependências;
- exclusão forçada somente com `?force=true`, permissão específica e transação;
- ordens concluídas e relatórios publicados não devem ser apagados silenciosamente;
- correções devem preservar histórico e motivo.

---

## 12. Regras críticas de banco e tipos

1. Custos devem usar `Decimal`, nunca `Float`.
2. Quilometragem deve ser número inteiro não negativo, salvo justificativa técnica documentada.
3. Datas e horários devem ser armazenados em UTC.
4. Datas sem horário usando `@db.Date` devem ser exibidas com `formatUTCDate()` para evitar o erro de dia anterior em UTC-3.
5. Formatação de data para usuário: `dd/MM/yyyy` e, quando houver hora, `dd/MM/yyyy HH:mm`.
6. Moeda: `pt-BR`, `BRL`.
7. Timezone de negócio: `America/Sao_Paulo`.
8. Use índices em `tenantId`, `vehicleId`, datas, status e campos de filtro frequente.
9. Use `cuid()` ou padrão equivalente consistente para IDs.
10. Nunca use `prisma db push` ou `prisma db pull`.
11. Toda alteração do schema deve gerar migration versionada:

```bash
pnpm prisma migrate dev --name nome_da_mudanca
pnpm prisma migrate deploy
```

12. Seeds devem ser idempotentes quando possível.

---

## 13. Regras de negócio do domínio

### 13.1 Veículos

Campos mínimos:

- código interno da frota;
- placa;
- tipo/categoria;
- marca;
- modelo;
- ano;
- combustível;
- finalidade/uso;
- secretaria, setor ou unidade responsável, se disponível;
- status;
- criticidade;
- quilometragem atual derivada do último registro válido;
- situação de piloto, quando aplicável;
- ativo/inativo;
- observações.

Categorias iniciais configuráveis:

```text
ONIBUS
CARRO
AMBULANCIA
VAN
CAMINHAO
MOTOCICLETA
MAQUINA
OUTRO
```

Não force campos históricos inexistentes. Defina claramente quais campos são obrigatórios para começar.

### 13.2 Quilometragem

- Cada registro deve ter veículo, leitura, data/hora, origem, usuário e observação opcional.
- A leitura normal não pode ser menor que a última leitura válida.
- Correção regressiva só pode ocorrer com permissão `quilometragem:corrigir`, motivo obrigatório e auditoria.
- Não sobrescreva silenciosamente a leitura anterior.
- O veículo deve refletir a última quilometragem válida por cálculo ou atualização transacional segura.
- Importe dados antigos identificando a origem como `IMPORTACAO` ou `SCPI`.
- Exiba cobertura de dados e veículos sem leitura recente.

### 13.3 Planos preventivos

Cada plano pode ser definido por categoria e conter itens como troca de óleo, filtros, pneus, freios, revisão ou inspeção.

Cada item pode ter:

- intervalo em quilômetros;
- intervalo em dias;
- antecedência em quilômetros;
- antecedência em dias;
- descrição;
- prioridade;
- obrigatório ou opcional;
- ativo/inativo.

Regra central:

- quando houver intervalo por km e por tempo, a manutenção vence pelo **primeiro critério atingido**;
- calcule a próxima quilometragem e a próxima data com base na última manutenção concluída daquele item;
- estados mínimos: `EM_DIA`, `PROXIMA`, `VENCIDA`, `SEM_DADOS`;
- não sinalize como “em dia” quando não houver dados suficientes;
- versões publicadas de um plano devem manter histórico.

### 13.4 Checklists

- Templates por categoria ou finalidade.
- Itens simples e rápidos.
- Respostas mínimas: `OK`, `ALERTA`, `CRITICO`, `NAO_SE_APLICA`.
- Permitir observação por item e observação geral.
- Design mobile-first.
- Se houver item crítico, oferecer ação clara para abrir solicitação ou ordem corretiva; não criar uma OS invisível sem confirmação.
- Checklist concluído deve ficar vinculado ao veículo, motorista/operador, data e quilometragem.

### 13.5 Ordens de serviço

Tipos:

```text
PREVENTIVA
CORRETIVA
INSPECAO
```

Status mínimos:

```text
RASCUNHO
AGENDADA
ABERTA
EM_EXECUCAO
CONCLUIDA
CANCELADA
```

Campos mínimos:

- veículo;
- tipo;
- status;
- prioridade;
- origem;
- descrição do problema ou serviço;
- diagnóstico;
- data de abertura;
- data programada;
- início e fim;
- quilometragem;
- itens executados;
- peças;
- mão de obra;
- outros custos;
- custo total calculado;
- prestador/fornecedor, quando aplicável;
- referência de contrato, empenho, nota fiscal ou SCPI, quando aplicável;
- responsável;
- observações;
- motivo de cancelamento ou correção.

Regras:

- custo total é soma dos componentes, não campo manual independente;
- conclusão exige dados mínimos configurados;
- ordem preventiva pode satisfazer um item do plano;
- ordem concluída deve ser tratada como registro histórico; correções exigem permissão, motivo e auditoria;
- mudanças relevantes devem ocorrer em transação;
- cancelar não apaga o histórico.

### 13.6 Indisponibilidade

- Registrar início e fim do período fora de operação.
- Uma ordem pode ou não gerar indisponibilidade.
- Impedir períodos inválidos.
- Tratar intervalos sobrepostos para não contar indisponibilidade em dobro.
- Veículo sem data de retorno permanece indisponível até o fim do período consultado ou até a data atual.

### 13.7 Orçamento

- Ano de referência.
- Linha de base anual.
- Meta percentual de redução.
- Valor planejado para preventiva.
- Valor planejado para corretiva.
- Contingência/reserva.
- Total planejado.
- Realizado calculado a partir de ordens concluídas.
- Comparativos mensais e anuais.
- Alterações auditadas.

Não construir módulo completo de compras, licitação ou execução contábil.

### 13.8 Relatórios e snapshots

- Indicadores de um relatório devem ser congelados em snapshot no momento da geração ou publicação.
- Relatório publicado não pode mudar retroativamente porque novos registros foram lançados.
- Uma correção exige nova versão ou republicação controlada.
- Separar “valor realizado” de “projeção anual”.
- Informar cobertura/qualidade dos dados.

### 13.9 Recomendações

Tipos mínimos:

```text
AJUSTAR_PREVENTIVA
REVISAR_USO
REVISAR_FORNECIMENTO
CONSIDERAR_SUBSTITUICAO
MELHORAR_REGISTRO
OUTRA
```

Uma recomendação deve conter:

- escopo geral, categoria ou veículo;
- evidências e indicadores que a sustentam;
- justificativa;
- prioridade;
- responsável;
- status;
- decisão/aprovação;
- histórico.

O sistema não decide automaticamente a substituição de veículo. Apenas registra e fundamenta recomendações humanas.

---

## 14. Modelagem incremental por roadmap

Não crie todas as tabelas no primeiro momento. Use migrations por roadmap.

### R0 — Base técnica e incorporação das entregas validadas

Modelos esperados:

- `Tenant`;
- `User`;
- `UserPermission`;
- `AuditLog`;
- `LoginLog`;
- `Project`;
- `ProjectMilestone`;
- `ProjectSetting`;
- `Vehicle`;
- `PreventivePlan`;
- `PreventivePlanItem`;
- `VehiclePreventivePlan`.

### R1 — Operação controlada

Adicionar conforme necessidade:

- `VehicleAssignment`;
- `PilotGroup`;
- `PilotGroupVehicle`;
- `OdometerReading`;
- `ChecklistTemplate`;
- `ChecklistTemplateItem`;
- `Inspection`;
- `InspectionAnswer`;
- `MaintenanceOrder`;
- `MaintenanceOrderItem`;
- `VehicleDowntime`.

### R2 — Monitoramento e visão financeira

Adicionar conforme necessidade:

- `AnnualMaintenanceBudget`;
- `KpiSnapshot`;
- `MonthlyProjectUpdate` ou estrutura equivalente;
- ajustes de custo e classificação nas ordens.

### R3 — Relatório executivo

Adicionar conforme necessidade:

- `ExecutiveReport`;
- `ExecutiveReportVersion` ou versionamento equivalente;
- snapshot tipado de métricas e filtros.

### R4 — Eficiência operacional

Evite tabelas novas se consultas e snapshots forem suficientes. Adicione somente estruturas justificadas para ranking, criticidade ou análise reproduzível.

### R5 — Otimização e recomendações

Adicionar conforme necessidade:

- `Recommendation`;
- `RecommendationDecision` ou histórico equivalente;
- versionamento/supersessão de planos preventivos.

### R6 — Consolidação e transparência

Adicionar conforme necessidade:

- `PublicReportPublication`;
- `PublicProjectSnapshot` ou DTO persistido equivalente;
- histórico de publicação/despublicação.

Os nomes podem ser ajustados se houver justificativa arquitetural, mas os conceitos e regras não podem desaparecer.

---

## 15. Indicadores e fórmulas

Crie funções puras e testáveis em `lib/domain/indicators.ts` ou módulos equivalentes.

### 15.1 Quilometragem no período

Para cada veículo:

1. obtenha a última leitura válida em ou antes do início do período;
2. obtenha a última leitura válida em ou antes do fim do período;
3. calcule a diferença somente quando ambas existirem e o resultado for não negativo;
4. marque como `SEM_DADOS` quando não houver base suficiente;
5. não substitua ausência de dado por zero silenciosamente.

### 15.2 Custo por km

```text
custo_por_km = soma_dos_custos_de_ordens_concluidas_no_periodo / km_validos_no_periodo
```

Regras:

- se o denominador for zero ou insuficiente, retornar `null` e exibir “Sem dados suficientes”;
- permitir visão consolidada e por veículo;
- indicar quantos veículos foram incluídos no cálculo.

### 15.3 Preventivas versus corretivas

Exibir ao menos:

- quantidade de ordens concluídas por tipo;
- percentual por volume;
- custo por tipo;
- tendência mensal.

Não misture percentual por quantidade com percentual por custo sem rótulo explícito.

### 15.4 Disponibilidade da frota

Use uma fórmula documentada e testável:

```text
disponibilidade = 1 - (tempo_total_indisponivel / tempo_total_possivel_da_frota)
```

Regras:

- calcular por período;
- considerar apenas veículos ativos no período quando essa informação existir;
- consolidar intervalos sobrepostos por veículo;
- exibir cobertura dos registros de indisponibilidade;
- não declarar 100% com confiança quando não houver registro mínimo suficiente; sinalizar limitação de dados.

### 15.5 Volume de corretivas

- quantidade de ordens corretivas concluídas no período;
- comparação com período anterior equivalente;
- comparação com linha de base somente quando houver dados compatíveis.

### 15.6 Cumprimento da preventiva

```text
cumprimento = itens_preventivos_concluidos_no_prazo / itens_preventivos_previstos_no_periodo
```

Quando não houver previsão confiável, exibir “Sem dados suficientes”.

### 15.7 Qualidade dos dados

Exibir indicadores como:

- percentual de veículos ativos com leitura recente;
- percentual de ordens concluídas com custos completos;
- percentual de ordens com quilometragem;
- percentual de checklists esperados efetivamente registrados;
- quantidade de inconsistências pendentes.

### 15.8 Meta de redução

- armazenar percentual de meta;
- calcular valor da meta a partir da linha de base configurada;
- comparar períodos equivalentes;
- separar economia realizada, tendência e projeção;
- nunca apresentar projeção como economia realizada.

---

## 16. Design system e experiência do usuário

### 16.1 Idioma e tom

- Interface em português do Brasil.
- Mensagens claras e operacionais.
- Evitar jargão técnico para motoristas e operadores.
- Erros devem explicar o que ocorreu e como corrigir.

### 16.2 Cards principais

Use o padrão visual:

```tsx
<Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md">
  <CardHeader className="border-b border-border/30 p-6 pb-4">
    <CardTitle className="text-xl font-bold tracking-tight text-foreground/90">
      Título do Card
    </CardTitle>
  </CardHeader>
  <CardContent className="px-6 pb-8">
    {/* Conteúdo */}
  </CardContent>
</Card>
```

### 16.3 Inputs

```tsx
<Input className="h-12 rounded-xl border-border/40 bg-card/50 px-4 transition-all hover:border-primary/40 focus:ring-2 focus:ring-primary/20" />
```

### 16.4 Botões e ícones

- Nunca use `mr-2` ou `ml-2` no ícone interno.
- Use `gap-2` no botão.

```tsx
<Button className="gap-2">
  <Plus className="h-4 w-4" />
  Novo registro
</Button>
```

### 16.5 Loading

- Não usar spinner isolado para tabelas, cards ou listas completas.
- Criar skeletons que espelhem a estrutura visual real.

### 16.6 Badges

Use badges pastel e consistentes para status:

- sucesso/ativo: verde suave;
- alerta/pendente: âmbar suave;
- erro/crítico: destrutivo suave;
- neutro/inativo: cinza suave.

### 16.7 Mobile-first

Os seguintes fluxos devem funcionar muito bem em celular:

- login;
- registro de quilometragem;
- execução de checklist;
- abertura rápida de ocorrência ou ordem;
- consulta de pendências do veículo.

### 16.8 Autocomplete

Ao selecionar veículos, planos ou responsáveis:

- use popover com foco preservado;
- suporte setas, Enter e rolagem automática;
- use busca fuzzy com tolerância a erro de digitação;
- identifique veículo por código, placa e modelo nas telas privadas;
- nunca exponha placa na página pública.

### 16.9 Acessibilidade

- labels reais em formulários;
- navegação por teclado;
- foco visível;
- contraste adequado;
- mensagens de erro associadas ao campo;
- tabelas responsivas com alternativa em cards no celular quando necessário.

---

## 17. Páginas privadas previstas

Crie somente conforme o roadmap atual.

### Base

- `/{tenantSlug}/login`
- `/{tenantSlug}/dashboard`
- `/{tenantSlug}/veiculos`
- `/{tenantSlug}/veiculos/[id]`
- `/{tenantSlug}/planos-preventivos`
- `/{tenantSlug}/administracao/usuarios`
- `/{tenantSlug}/administracao/permissoes`
- `/{tenantSlug}/administracao/projeto`
- `/{tenantSlug}/administracao/auditoria`

### Operação

- `/{tenantSlug}/quilometragem`
- `/{tenantSlug}/checklists`
- `/{tenantSlug}/ordens-servico`
- `/{tenantSlug}/ordens-servico/[id]`
- `/{tenantSlug}/piloto`

### Gestão

- `/{tenantSlug}/indicadores`
- `/{tenantSlug}/orcamento`
- `/{tenantSlug}/relatorios`
- `/{tenantSlug}/recomendacoes`

### Pública

- `/{tenantSlug}/transparencia`

A rota pública não deve herdar layout autenticado nem carregar dados privados.

---

## 18. Página pública e governança da informação

A página pública deve apresentar somente snapshots publicados e agregados.

### Conteúdo permitido

- percentual de conclusão do projeto;
- etapa atual;
- principais avanços do mês;
- próximos passos;
- percentual de preventivas versus corretivas em nível consolidado;
- disponibilidade consolidada da frota;
- evolução do controle e cobertura de dados;
- marcos concluídos;
- uso geral de recursos, em nível seguro e agregado;
- relatórios PDF publicados;
- gráficos agregados;
- fotos institucionais somente se futuramente fornecidas e aprovadas;
- modelos de processo sem dados reais.

### Conteúdo proibido

- placa;
- RENAVAM;
- identificação individual de veículo;
- localização ou rota;
- dados de motorista;
- custos detalhados por fornecedor;
- documentos fiscais completos;
- contratos completos;
- credenciais;
- estrutura de rede;
- detalhes de acesso ao SCPI;
- dados que possam comprometer a operação.

### Regra técnica de publicação

- não reutilizar diretamente o objeto privado de relatório;
- criar DTO público com allowlist explícita;
- endpoints públicos devem retornar somente relatórios com status `PUBLICADO`;
- publicação e despublicação exigem permissão e auditoria;
- snapshots publicados devem ser imutáveis;
- PDFs públicos devem ser gerados a partir do snapshot público, não de dados privados ao vivo;
- incluir data de atualização e período de referência;
- exibir observação quando a cobertura de dados ainda for parcial.

---

## 19. Docker e ambiente local

Crie um `docker-compose.yml` para o PostgreSQL.

Requisitos:

- nome do projeto Compose: `simap`;
- serviço: `postgres`;
- nome do container: `simap-postgres`;
- imagem PostgreSQL estável, preferencialmente `postgres:16-alpine`;
- banco padrão: `simap`;
- usuário e senha vindos de variáveis de ambiente;
- volume persistente: `simap_postgres_data`;
- network: `simap-network`;
- healthcheck com `pg_isready`;
- porta configurável, padrão `5432`;
- restart apropriado para ambiente local;
- não incluir pgAdmin sem solicitação;
- por padrão, containerizar apenas o banco; não containerizar a aplicação sem necessidade.

Crie `.env.example` com no mínimo:

```text
POSTGRES_DB=simap
POSTGRES_USER=simap
POSTGRES_PASSWORD=troque_esta_senha
POSTGRES_PORT=5432
DATABASE_URL=postgresql://simap:troque_esta_senha@localhost:5432/simap?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gere_um_segredo_forte
APP_TIMEZONE=America/Sao_Paulo
NEXT_PUBLIC_APP_NAME=SIMAP
SEED_ADMIN_NAME=Administrador SIMAP
SEED_ADMIN_EMAIL=admin@simap.local
SEED_ADMIN_PASSWORD=troque_esta_senha
SEED_DEMO=false
```

Nunca versionar credenciais reais. O seed deve ler credenciais do ambiente.

README mínimo:

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm prisma generate
pnpm prisma migrate dev
pnpm tsx prisma/seed.ts
pnpm dev
```

Inclua também instruções de `prisma migrate deploy` para ambientes não locais.

---

# 20. ROADMAPS DE DESENVOLVIMENTO

---

## R0 — Fundação técnica e incorporação dos meses 1 e 2 validados

### Objetivo

Criar a base segura do SIMAP e transformar os entregáveis já validados — diagnóstico da frota e plano de manutenção preventiva — em dados gerenciáveis pelo sistema.

Este roadmap é uma preparação técnica. Ele não altera o fato de que os marcos institucionais dos meses 1 e 2 já estão validados.

### Entradas esperadas

- lista oficial dos 97 veículos, quando disponibilizada;
- classificação por tipo, placa, modelo, ano e combustível;
- documento de periodicidades preventivas por categoria;
- dados mínimos do tenant Jaborandi/SP.

### Implementar

1. Inicialização do projeto Next.js com a stack definida.
2. Docker Compose do PostgreSQL.
3. Prisma, migration inicial e seed.
4. Tenant Jaborandi/SP.
5. Autenticação NextAuth.
6. RBAC base e overrides por usuário.
7. Middleware e isolamento por tenant.
8. Layout autenticado, sidebar, header, breadcrumbs, tema claro/escuro e toaster.
9. Dashboard inicial com:
   - total de veículos cadastrados;
   - veículos ativos/inativos;
   - cobertura de cadastro;
   - status dos 8 marcos;
   - linha de base configurada;
   - meta de redução configurada;
   - avisos de dados ainda não importados.
10. CRUD de veículos.
11. Importação manual por CSV com:
   - template para download;
   - preview;
   - validação linha a linha;
   - relatório de erros;
   - confirmação antes de persistir;
   - operação em transação;
   - auditoria;
   - não duplicar placa ou código dentro do tenant.
12. Exportação CSV da frota.
13. CRUD de planos preventivos.
14. Itens de plano por tempo e/ou km.
15. Vinculação de plano a veículo.
16. Versionamento mínimo de plano publicado.
17. Gestão do projeto e marcos:
   - Mês 1: `VALIDADO`, 100%;
   - Mês 2: `VALIDADO`, 100%;
   - Meses 3 a 8: `PENDENTE`, 0%.
18. Gestão básica de usuários e permissões.
19. Tela de auditoria para perfis autorizados.
20. Documentação `.ai` e README.
21. Template CSV, sem inventar os 97 veículos.
22. Seed opcional de demonstração somente quando `SEED_DEMO=true`, marcando claramente os dados como demonstração.

### Não implementar ainda

- quilometragem operacional;
- checklists;
- ordens de serviço;
- custos;
- indicadores avançados;
- relatórios executivos;
- recomendações;
- página pública final.

### Critérios de aceite

- aplicação inicia com `pnpm dev`;
- PostgreSQL sobe com `docker compose up -d`;
- migration inicial executa em banco vazio;
- seed cria tenant, configurações, marcos e admin;
- login funciona;
- usuário de um tenant não acessa outro tenant;
- CRUD de veículo funciona com validação e auditoria;
- importação CSV rejeita linhas inválidas sem corromper dados;
- plano preventivo aceita intervalo por km, por tempo ou ambos;
- plano pode ser vinculado a veículo;
- M1 e M2 aparecem como validados;
- linha de base e meta são configuráveis;
- nenhuma credencial real está hardcoded;
- `pnpm lint`, `pnpm typecheck`, testes aplicáveis e `pnpm build` passam.

### Evidência técnica do roadmap

- tela da frota pronta para receber os 97 veículos;
- tela de planos pronta para receber o documento validado;
- migrations;
- seed;
- template CSV;
- checklist manual de segurança multi-tenant.

---

## R1 — Mês 3: implantação da preventiva e início da operação controlada

### Entregável institucional

Implantação da preventiva e início da operação controlada.

### Evidência esperada

Ordens de serviço executadas e registros consistentes.

### Objetivo de produto

Permitir que um grupo piloto registre quilometragem, execute checklists e opere ordens preventivas/corretivas em ambiente real.

### Implementar

1. Registro de quilometragem:
   - formulário rápido;
   - histórico por veículo;
   - validação de regressão;
   - correção controlada;
   - importação CSV opcional de histórico;
   - indicador de leitura recente.
2. Vínculo de motoristas a veículos.
3. Grupo piloto configurável:
   - nome;
   - período;
   - veículos participantes;
   - status;
   - observações.
4. Templates de checklist por categoria.
5. Execução mobile-first de checklist.
6. Histórico de inspeções.
7. Ação para abrir ordem corretiva a partir de alerta crítico.
8. Ordens de serviço preventivas e corretivas.
9. Itens de serviço e custos básicos, ainda sem dashboard financeiro completo.
10. Registro de indisponibilidade.
11. Motor de vencimento preventivo:
    - próxima data;
    - próxima quilometragem;
    - vencimento pelo primeiro critério;
    - estados `EM_DIA`, `PROXIMA`, `VENCIDA`, `SEM_DADOS`.
12. Painel operacional:
    - preventivas próximas;
    - preventivas vencidas;
    - veículos sem leitura recente;
    - ordens abertas;
    - veículos indisponíveis;
    - aderência do piloto.
13. Timeline do veículo com:
    - leituras;
    - checklists;
    - ordens;
    - eventos de auditoria relevantes.
14. Documentação de operação para motorista, operador e gestor.
15. Roteiro de treinamento rápido.

### Regras especiais

- motorista acessa apenas veículos vinculados;
- não aceitar quilometragem menor sem fluxo de correção;
- checklist crítico não deve desaparecer sem tratamento;
- concluir ordem preventiva atualiza a base do item de plano correspondente;
- registros do piloto devem ser distinguíveis dos demais sem duplicar dados.

### Critérios de aceite

- gestor cria grupo piloto e adiciona veículos;
- motorista vinculado registra quilometragem pelo celular;
- usuário não vinculado recebe `403`;
- checklist pode ser concluído em tela responsiva;
- item crítico permite abrir ordem corretiva com dados pré-preenchidos;
- operador cria, inicia e conclui ordem preventiva;
- operador cria e conclui ordem corretiva;
- ordem concluída registra custos e quilometragem;
- indisponibilidade pode ser aberta e encerrada;
- motor de preventiva identifica corretamente vencimentos por tempo ou km;
- regressão de hodômetro exige permissão e motivo;
- auditoria registra operações críticas;
- testes unitários cobrem regras de hodômetro e vencimento;
- `pnpm lint`, `pnpm typecheck`, testes e `pnpm build` passam.

### Evidência funcional

- pelo menos um fluxo de demonstração completo: leitura → checklist → alerta → ordem → execução → conclusão;
- relatório operacional exportável com ordens e registros do período;
- dados reais só serão incluídos quando fornecidos.

---

## R2 — Mês 4: monitoramento, ajustes e visão financeira

### Entregável institucional

Monitoramento, ajuste e visão financeira.

### Evidência esperada

Relatório com custo, volume de corretivas versus preventivas e primeiros insights.

### Objetivo de produto

Transformar os registros operacionais em indicadores confiáveis, sem esconder problemas de cobertura dos dados.

### Implementar

1. Dashboard gerencial com filtros por:
   - período;
   - categoria;
   - veículo;
   - tipo de manutenção;
   - status;
   - grupo piloto;
   - unidade responsável.
2. Indicadores:
   - custo total;
   - custo preventivo;
   - custo corretivo;
   - custo por km;
   - volume preventivo versus corretivo;
   - disponibilidade;
   - tempo de parada;
   - preventivas vencidas;
   - cumprimento de preventiva;
   - cobertura e qualidade dos dados.
3. Gráficos Recharts com tooltip, legenda, acessibilidade e estados vazios.
4. Comparação com período anterior equivalente.
5. Visão financeira por veículo e consolidada, privada.
6. Orçamento anual:
   - linha de base;
   - meta de redução;
   - preventiva planejada;
   - corretiva planejada;
   - contingência;
   - realizado;
   - saldo e variação.
7. Snapshot mensal de KPI.
8. Registro de avanços do mês, próximos passos e observações.
9. Exportação CSV dos indicadores tabulares.
10. Relatório gerencial inicial em PDF.
11. Tela de inconsistências:
    - ordens sem custo completo;
    - veículos sem leitura;
    - indisponibilidade sem encerramento;
    - plano sem base de manutenção;
    - divergências de dados.
12. Ajustes no processo com base no piloto, documentados em `.ai/DECISIONS.md` e, quando operacional, no histórico do projeto.

### Regras especiais

- não calcular custo por km com denominador inválido;
- mostrar “Sem dados suficientes” em vez de zero enganoso;
- não contar períodos de indisponibilidade sobrepostos duas vezes;
- diferenciar volume de custo;
- snapshots devem ser reproduzíveis;
- dados financeiros detalhados permanecem privados.

### Critérios de aceite

- gestor filtra indicadores por período e categoria;
- custo por km bate com casos de teste conhecidos;
- disponibilidade consolida intervalos corretamente;
- dashboard exibe cobertura dos dados;
- orçamento distingue planejado e realizado;
- snapshot mensal não muda quando dados posteriores são lançados;
- relatório PDF contém período, filtros, indicadores e observações de qualidade;
- testes cobrem fórmulas de custo/km, disponibilidade e percentuais;
- `pnpm lint`, `pnpm typecheck`, testes e `pnpm build` passam.

### Evidência funcional

- relatório mensal com custos;
- volume de preventivas e corretivas;
- primeiros insights baseados em regras transparentes;
- lista de inconsistências pendentes.

---

## R3 — Mês 5: primeiro Relatório Executivo de desempenho da frota

### Entregável institucional

1º Relatório Executivo de desempenho da frota.

### Evidência esperada

Comparativo inicial entre cenário anterior e pós-implantação, especialmente corretivas versus preventivas e volume de intervenções.

### Objetivo de produto

Produzir um relatório executivo versionado, reproduzível e adequado para tomada de decisão.

### Implementar

1. Módulo de relatório executivo.
2. Seleção de período atual e período de comparação.
3. Comparações:
   - volume preventivo;
   - volume corretivo;
   - custo por tipo;
   - custo por km;
   - disponibilidade;
   - tempo de parada;
   - qualidade do registro;
   - evolução de aderência.
4. Linha de base identificada explicitamente.
5. Separação entre:
   - realizado;
   - variação;
   - tendência;
   - projeção.
6. Editor controlado para:
   - resumo executivo;
   - principais avanços;
   - riscos;
   - próximos passos;
   - notas metodológicas.
7. Geração de PDF institucional com:
   - capa;
   - período;
   - resumo;
   - indicadores;
   - gráficos;
   - metodologia;
   - cobertura dos dados;
   - responsáveis;
   - data de geração.
8. Versionamento e snapshot imutável.
9. Status:
   - `RASCUNHO`;
   - `EM_REVISAO`;
   - `APROVADO`;
   - futuramente `PUBLICADO` quando aplicável.
10. Fluxo de aprovação por perfil autorizado.
11. Auditoria de geração, revisão e aprovação.

### Regras especiais

- comparação deve usar períodos equivalentes quando possível;
- relatório não pode afirmar causalidade sem base;
- dados insuficientes devem ser declarados;
- não tratar projeção anual como economia já realizada;
- PDF deve ser gerado a partir do snapshot, não de consultas mutáveis após aprovação.

### Critérios de aceite

- gestor gera relatório para dois períodos;
- métricas do relatório correspondem aos snapshots;
- PDF preserva layout em desktop e impressão;
- versão aprovada não muda retroativamente;
- nova correção gera nova versão;
- auditor consegue verificar filtros, linha de base e data de geração;
- testes cobrem comparação e imutabilidade do snapshot;
- `pnpm lint`, `pnpm typecheck`, testes e `pnpm build` passam.

### Evidência funcional

- primeiro relatório executivo em PDF;
- comparativo anterior versus pós-implantação;
- histórico de versões e aprovação.

---

## R4 — Mês 6: análise de eficiência operacional da frota

### Entregável institucional

Análise de eficiência operacional da frota.

### Evidência esperada

Identificação dos veículos mais críticos, considerando maior custo ou maior tempo de parada.

### Objetivo de produto

Entregar rankings e análises transparentes, sem IA e sem decisões automáticas.

### Implementar

1. Painel de eficiência por veículo.
2. Ranking configurável por:
   - custo total;
   - custo por km;
   - quantidade de corretivas;
   - tempo total de parada;
   - frequência de falhas;
   - preventivas vencidas;
   - baixa cobertura de dados.
3. Criticidade com regras explícitas e pesos configuráveis.
4. Exibição de:
   - posição;
   - indicador;
   - cobertura de dados;
   - justificativa da criticidade;
   - tendência.
5. Curva ABC ou Pareto quando houver dados suficientes.
6. Visão por categoria para evitar comparação injusta entre veículos de usos muito diferentes.
7. Página detalhada do veículo com análise histórica privada.
8. Exportação de análise em PDF e CSV.
9. Notas metodológicas e limitações.
10. Alertas de falso positivo causados por pouco uso ou dados incompletos.

### Regras especiais

- não comparar ambulância e carro administrativo sem permitir segmentação;
- custo alto absoluto não significa automaticamente ineficiência;
- custo por km exige quilometragem confiável;
- classificação deve ser explicável;
- não usar machine learning;
- não recomendar substituição automaticamente.

### Critérios de aceite

- gestor identifica veículos críticos por mais de um critério;
- ranking muda de forma previsível ao alterar filtros ou pesos;
- cada posição possui justificativa;
- veículos sem dados suficientes são sinalizados, não classificados como bons;
- análises por categoria funcionam;
- exportações preservam filtros e metodologia;
- testes cobrem ranking, empates, dados faltantes e pesos;
- `pnpm lint`, `pnpm typecheck`, testes e `pnpm build` passam.

### Evidência funcional

- relatório de veículos mais críticos;
- ranking por custo e parada;
- análise segmentada por categoria.

---

## R5 — Mês 7: relatório de otimização e recomendações

### Entregável institucional

Relatório de otimização e recomendações.

### Evidência esperada

Sugestões formais de ajuste de preventiva, possível substituição de veículos ou revisão de uso.

### Objetivo de produto

Transformar análises em recomendações humanas, rastreáveis e aprováveis.

### Implementar

1. Módulo de recomendações.
2. Criação a partir de:
   - veículo;
   - categoria;
   - indicador;
   - relatório;
   - análise de eficiência.
3. Tipos de recomendação definidos neste prompt.
4. Evidências vinculadas.
5. Prioridade e responsável.
6. Status:
   - `RASCUNHO`;
   - `EM_ANALISE`;
   - `APROVADA`;
   - `REJEITADA`;
   - `IMPLEMENTADA`;
   - `ARQUIVADA`.
7. Aprovação com justificativa.
8. Histórico completo.
9. Revisão/versionamento de plano preventivo:
   - clonar versão atual;
   - ajustar intervalos;
   - comparar versões;
   - publicar nova versão;
   - manter veículos na versão anterior até migração controlada.
10. Simulação simples de orçamento:
    - cenário atual;
    - maior alocação em preventiva;
    - meta de redução;
    - impacto estimado claramente rotulado como cenário, não resultado garantido.
11. Relatório de otimização em PDF.
12. Checklist de governança para recomendações de possível substituição.

### Regras especiais

- nenhuma recomendação é decisão automática;
- “considerar substituição” exige evidências, cobertura e aprovação;
- cenários financeiros são estimativas;
- alterações de plano não podem reescrever histórico;
- recomendações rejeitadas permanecem auditáveis.

### Critérios de aceite

- gestor cria recomendação a partir de uma análise;
- recomendação mantém vínculo com evidências;
- aprovador registra decisão e justificativa;
- plano preventivo pode ganhar nova versão sem apagar a anterior;
- simulação identifica premissas;
- PDF de otimização contém recomendações, prioridades, responsáveis e evidências;
- testes cobrem versionamento e transições de status;
- `pnpm lint`, `pnpm typecheck`, testes e `pnpm build` passam.

### Evidência funcional

- relatório formal de otimização;
- recomendações rastreáveis;
- versões de planos preventivos;
- cenário orçamentário documentado.

---

## R6 — Mês 8: relatório consolidado ao prefeito e transparência pública

### Entregável institucional

Relatório consolidado ao prefeito.

### Evidência esperada

Documento executivo com evolução dos indicadores, ganhos operacionais e financeiros.

### Objetivo de produto

Consolidar a jornada dos 8 meses e publicar uma versão pública segura, agregada e consistente.

### Implementar

1. Relatório consolidado dos 8 meses.
2. Linha do tempo dos marcos.
3. Evolução mensal de:
   - cobertura de dados;
   - preventivas;
   - corretivas;
   - custos;
   - custo por km;
   - disponibilidade;
   - tempo de parada;
   - cumprimento da preventiva;
   - recomendações.
4. Ganhos operacionais realizados.
5. Ganhos financeiros realizados.
6. Projeções claramente separadas.
7. Comparação com linha de base configurada.
8. Resumo executivo para o prefeito.
9. Apêndice metodológico.
10. PDF final institucional.
11. Página pública `/{tenantSlug}/transparencia`.
12. Gestão de publicações mensais.
13. Snapshot público imutável.
14. DTO público por allowlist.
15. Publicação de PDFs seguros.
16. Status público do projeto:
    - percentual concluído;
    - etapa;
    - avanços;
    - próximos passos.
17. Indicadores públicos agregados.
18. Data de atualização.
19. Fluxo de validação antes de publicar.
20. Auditoria de publicação e despublicação.
21. Testes automatizados para garantir ausência de campos sensíveis no endpoint público.
22. Documentação final e guias de operação.
23. Checklist de encerramento e continuidade pós-programa.

### Regras especiais

- página pública não consulta tabelas privadas diretamente no cliente;
- endpoint público retorna somente snapshot aprovado;
- placas e IDs individuais nunca aparecem;
- fornecedor nunca aparece;
- dados incompletos devem ser declarados;
- PDF público deve ser diferente do relatório interno quando necessário;
- a porcentagem do projeto deve derivar dos marcos e pesos configurados;
- Mês 8 só pode ser marcado como concluído após aprovação do relatório consolidado.

### Critérios de aceite

- relatório consolidado reúne os 8 meses;
- métricas têm origem e período identificáveis;
- valores realizados e projetados estão separados;
- página pública funciona sem autenticação;
- nenhum campo sensível é retornado por endpoints públicos;
- somente relatórios publicados aparecem;
- despublicação remove acesso público sem apagar histórico;
- PDF público contém apenas dados permitidos;
- testes de segurança pública passam;
- documentação de operação está completa;
- `pnpm lint`, `pnpm typecheck`, testes e `pnpm build` passam.

### Evidência funcional

- relatório executivo final em PDF;
- página pública ativa;
- histórico de publicações;
- indicadores agregados;
- checklist de segurança da informação.

---

## 21. Seed e dados iniciais

O seed inicial deve criar:

1. Tenant:
   - `Município de Jaborandi/SP`;
   - slug `jaborandi-sp`.
2. Projeto:
   - título `Implementação de Manutenção Preventiva nos veículos públicos do município`;
   - sistema `SIMAP`;
   - duração `8 meses`;
   - linha temática `Transporte Público`.
3. Configurações:
   - ano da linha de base: `2025`;
   - valor inicial da linha de base: `285000.00`;
   - meta de redução: `20.00`;
   - timezone: `America/Sao_Paulo`.
4. Marcos:
   - M1 validado, 100%;
   - M2 validado, 100%;
   - M3 a M8 pendentes, 0%.
5. Usuário administrador vindo de variáveis de ambiente.
6. Permissões padrão por cargo.
7. Categorias iniciais de veículo.
8. Nenhum veículo real inventado.
9. Dados de demonstração somente com `SEED_DEMO=true` e identificados como fictícios.

---

## 22. Importação e qualidade dos dados

### Template de veículos

Crie CSV com colunas documentadas, por exemplo:

```text
codigo_frota,placa,categoria,marca,modelo,ano,combustivel,finalidade,setor,criticidade,status,observacoes
```

Regras:

- normalizar espaços e caixa quando seguro;
- preservar o valor original no relatório de importação quando houver erro;
- validar placa sem impedir formatos antigos legítimos;
- detectar duplicidade na planilha e no banco;
- permitir preview;
- não persistir parcialmente sem confirmação explícita;
- disponibilizar relatório das linhas rejeitadas.

### Template de planos

Pode ser criado em roadmap apropriado com colunas como:

```text
nome_plano,categoria,item,intervalo_km,intervalo_dias,antecedencia_km,antecedencia_dias,prioridade,obrigatorio
```

### Qualidade

- criar estados de dado ausente, incompleto e inconsistente;
- nunca mascarar ausência como zero;
- permitir correção com trilha de auditoria;
- exibir cobertura em dashboards e relatórios.

---

## 23. Testes obrigatórios

Priorize testes de risco real.

### Segurança

- isolamento entre tenants;
- permissão negada;
- motorista sem vínculo;
- endpoint público sem campos sensíveis;
- tentativa de forjar `tenantId`;
- exclusão com dependências.

### Domínio

- hodômetro crescente;
- correção regressiva autorizada;
- preventiva por km;
- preventiva por tempo;
- preventiva vencendo pelo primeiro critério;
- custo total de ordem;
- custo por km;
- disponibilidade com intervalos sobrepostos;
- comparação por período;
- ranking com dados faltantes;
- snapshots imutáveis;
- transições de status.

### Interface

- formulários com validação;
- estados vazios;
- estados de erro;
- skeletons;
- fluxo mobile de quilometragem e checklist;
- geração de PDF;
- acessibilidade de componentes críticos.

### E2E mínimo conforme evolução

- login;
- criar veículo;
- vincular plano;
- registrar km;
- executar checklist;
- abrir e concluir OS;
- consultar indicador;
- gerar relatório;
- publicar relatório público.

Não crie E2E de módulos ainda inexistentes.

---

## 24. Performance e robustez

- paginação server-side em listas grandes;
- filtros indexados;
- evitar N+1 no Prisma;
- selecionar apenas campos necessários;
- usar transações em operações compostas;
- tratar concorrência em leitura de hodômetro e conclusão de OS;
- usar TanStack Query com chaves consistentes;
- invalidar somente consultas necessárias;
- usar estados vazios e erros recuperáveis;
- não otimizar prematuramente com infraestrutura complexa.

---

## 25. Documentação obrigatória

### `.ai/PROJECT_CONTEXT.md`

Contexto do Pro Inova, problema, objetivos, escopo e público.

### `.ai/ARCHITECTURE.md`

Arquitetura, fluxo de autenticação, tenant, APIs, banco, serviços de domínio e publicação pública.

### `.ai/RULES.md`

Regras não negociáveis: TypeScript strict, sem `any`, migrations, tenant, auditoria, datas, design system, escopo negativo e segurança pública.

### `.ai/ROADMAP.md`

Tabela com R0 a R6, status, critérios, dependências e evidências.

### `.ai/CURRENT_ROADMAP.md`

- roadmap atual;
- objetivo;
- itens em andamento;
- itens concluídos;
- bloqueios;
- validações executadas.

### `.ai/DATA_DICTIONARY.md`

Entidades, campos, enums, relações, obrigatoriedade, origem e sensibilidade.

### `.ai/DECISIONS.md`

ADRs simplificadas com contexto, decisão, alternativas e consequências.

### `.ai/CHANGELOG.md`

Mudanças por roadmap.

### `.ai/PENDING_INPUTS.md`

Somente informações realmente faltantes, como planilha oficial dos 97 veículos ou periodicidades aprovadas.

### Guias de usuário

Crie gradualmente:

- `docs/GUIA_ADMIN.md`;
- `docs/GUIA_GESTOR.md`;
- `docs/GUIA_OPERADOR.md`;
- `docs/GUIA_MOTORISTA.md`;
- `docs/GUIA_AUDITOR.md`;
- `docs/GUIA_TRANSPARENCIA.md`.

---

## 26. Scripts do projeto

O `package.json` deve conter scripts coerentes, por exemplo:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

Ajuste somente quando necessário e não deixe scripts quebrados ou referências a dependências inexistentes.

---

## 27. Definition of Done por roadmap

Um roadmap só está concluído quando:

1. todos os itens obrigatórios foram implementados;
2. critérios de aceite foram verificados;
3. migrations existem e funcionam em banco vazio;
4. seed funciona;
5. validações Zod existem;
6. RBAC e tenant foram aplicados;
7. ações críticas são auditadas;
8. estados de loading, vazio e erro foram implementados;
9. fluxo responsivo foi validado quando aplicável;
10. testes do roadmap passam;
11. `pnpm lint` passa;
12. `pnpm typecheck` passa;
13. `pnpm build` passa;
14. documentação `.ai` foi atualizada;
15. README foi atualizado quando houve alteração de setup;
16. nenhuma funcionalidade de roadmap futuro foi implementada sem necessidade;
17. nenhuma operação Git foi executada;
18. limitações reais foram registradas sem fingir conclusão.

---

## 28. Formato obrigatório do relatório ao final de cada execução

Ao concluir ou interromper um roadmap, responda com:

```markdown
# Relatório de execução — SIMAP

## Roadmap trabalhado
- Código:
- Nome:
- Status: CONCLUÍDO | PARCIAL | BLOQUEADO

## O que foi implementado
- ...

## Banco de dados
- Migrations criadas:
- Modelos alterados:
- Seed alterado:

## Rotas e telas
- ...

## Segurança e auditoria
- ...

## Testes e validações executadas
- pnpm lint: PASSOU | FALHOU | NÃO EXECUTADO
- pnpm typecheck: PASSOU | FALHOU | NÃO EXECUTADO
- pnpm test: PASSOU | FALHOU | NÃO EXECUTADO
- pnpm build: PASSOU | FALHOU | NÃO EXECUTADO

## Como executar
- ...

## Credenciais de desenvolvimento
- Informar somente a origem via `.env`; não expor segredo real.

## Pendências reais
- ...

## Decisões tomadas
- ...

## Próximo roadmap
- Nomear, mas não implementar.
```

Nunca declare que um comando passou se ele não foi executado.

---

## 29. Ordem de trabalho recomendada dentro de cada roadmap

1. Inspecionar estado atual.
2. Ler `.ai/RULES.md` e `.ai/CURRENT_ROADMAP.md`.
3. Confirmar roadmap alvo.
4. Atualizar modelagem e migration.
5. Implementar regras puras de domínio.
6. Implementar APIs com autenticação, permissão, tenant, Zod e auditoria.
7. Implementar hooks/TanStack Query.
8. Implementar telas e componentes.
9. Implementar estados de loading, vazio e erro.
10. Criar ou atualizar testes.
11. Executar migration e seed em ambiente local.
12. Executar lint, typecheck, testes e build.
13. Corrigir falhas.
14. Atualizar documentação.
15. Emitir relatório final e parar.

---

## 30. Restrições finais não negociáveis

- Não usar `any`.
- Não usar `prisma db push`.
- Não usar `prisma db pull`.
- Não confiar no tenant enviado pelo cliente.
- Não criar endpoint privado sem autenticação e permissão.
- Não expor modelo Prisma cru em endpoint público.
- Não expor placa, motorista ou fornecedor na transparência.
- Não editar silenciosamente registros históricos.
- Não apagar dependências sem conflito e autorização.
- Não mascarar ausência de dados como zero.
- Não chamar projeção de economia realizada.
- Não criar IA preditiva.
- Não criar telemetria.
- Não integrar automaticamente com o SCPI.
- Não criar módulo completo de compras/licitação.
- Não inventar os 97 veículos.
- Não realizar operações Git.
- Não implementar mais de um roadmap por execução.
- Não usar spinner isolado para listas e tabelas completas.
- Não usar margem no ícone interno de botão; usar `gap-2`.
- Não deixar documentação divergente do código.

---

## 31. Comando final ao Antigravity

Agora:

1. leia este prompt por completo;
2. inspecione o repositório atual;
3. determine o roadmap pela regra `ROADMAP_ALVO`;
4. em repositório novo, execute somente o `R0`;
5. implemente o roadmap com código funcional, migrations, seed, testes e documentação;
6. valide os comandos técnicos;
7. apresente o relatório de execução no formato obrigatório;
8. pare antes do próximo roadmap.

O resultado esperado não é um protótipo visual descartável. É uma base municipal simples, segura, auditável, progressiva e utilizável em operação real, sem extrapolar o escopo do Pro Inova.
