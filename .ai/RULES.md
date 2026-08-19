# Regras de Desenvolvimento Não Negociáveis — SIMAP

## 1. Tipagem e TypeScript
- `strict: true` ativado;
- O uso de `any` é **terminantemente proibido**, inclusive em catches, respostas genéricas e bibliotecas externas. Utilize generics, `unknown` e validação com Zod;
- Validações de entrada e saída devem compartilhar os mesmos contratos Zod entre backend e frontend.

## 2. Banco de Dados e ORM
- Valores monetários/custos devem usar `Decimal`, nunca `Float`;
- Quilometragens e hodômetros devem ser inteiros não negativos;
- Datas devem ser salvas em UTC. Datas de negócio sem hora devem ser exibidas usando `formatUTCDate()` para evitar inconsistências em UTC-3;
- É **proibido** utilizar `prisma db push` ou `prisma db pull`. Toda alteração estrutural deve gerar migrations versionadas em `prisma/migrations/`;
- O seed em `prisma/seed.ts` deve ser idempotente.

## 3. Segurança e Multi-tenancy
- Nenhum endpoint privado pode ser executado sem autenticação e validação de permissão granular;
- Nunca confiar no `tenantId` ou `tenantSlug` enviado pelo cliente. Validar estritamente contra a sessão autenticada;
- Endpoints públicos nunca retornam modelos Prisma crus nem informações sensíveis (placas, motoristas, fornecedores ou dados internos).

## 4. UI e Design System
- Não usar spinners isolados para tabelas completas ou cards; utilize **Skeletons** que reflitam o layout esperado;
- Ícones em botões devem usar `gap-2` no container do botão, nunca margens arbitrárias `mr-2` ou `ml-2` no SVG;
- Elementos visuais devem seguir o padrão refinado: cards translúcidos `backdrop-blur-md`, inputs ergonômicos e badges semânticos em tons pastel;
- Interface totalmente em Português do Brasil (pt-BR) e moeda em BRL (R$).

## 5. Integridade Operacional e Metodologia
- Não inventar dados reais de veículos (a frota oficial de 97 veículos será importada ou cadastrada);
- Não mascarar ausência de dados como zero;
- Não tratar projeções de economia como resultados realizados;
- Não executar operações automáticas do Git (commit, push, checkout, branch);
- Implementar estritamente um roadmap por vez.
