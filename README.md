# Marketplace B2B — GraphQL Federado, MCP e Saga de Pagamentos

Monorepo **Nx** do desafio técnico de um marketplace B2B. O catálogo vem de uma instância
**WordPress + WooCommerce** exposta via WPGraphQL e federada (Apollo Federation v2); um
**gateway NestJS** compõe o supergraph; usuários/fornecedores, carrinho e pedidos são
subgraphs NestJS; pagamento e reserva de estoque são coordenados por uma **Saga Coreography**
sobre **RabbitMQ**; a autenticação é **OAuth2 (Better Auth)**; um **servidor Apollo MCP**
expõe operações curadas para agentes de IA; e tudo é instrumentado com **OpenTelemetry**.

> **Estado atual:** este repositório contém o **esqueleto do monorepo** (estrutura, projetos
> Nx, Docker Compose e CI). A lógica de domínio de cada serviço é entregue em mudanças
> subsequentes. Veja `openspec/` (no workspace) para as propostas e specs.

## Arquitetura

```
            Clientes (Web/Mobile)        Agente de IA (MCP)
                   │                            │
                   ▼                            ▼
            Apollo Gateway (NestJS) ◄──── Apollo MCP Server
                   │  valida JWT (Better Auth / OAuth2)
        ┌──────────┼───────────────┐
        ▼          ▼               ▼
   WooCommerce  users-suppliers  orders-cart ──┐ publica eventos
   (WPGraphQL)   (NestJS)         (NestJS)      ▼
                                            RabbitMQ
                                          ┌────┴─────┐
                                          ▼          ▼
                                  payment-processor  stock-worker
                                          └────► OpenTelemetry ◄────┘
```

## Estrutura do monorepo (escopo §15)

```
apps/
  gateway/            # Apollo Gateway (NestJS) — compõe o supergraph
  mcp-server/         # Apollo MCP Server (read-only, OAuth2)
  users-suppliers/    # Subgraph: usuários, fornecedores, ownership de produto
  orders-cart/        # Subgraph: carrinho e pedidos (outbox de eventos)
  payment-processor/  # Microsserviço RabbitMQ: pagamento idempotente
  stock-worker/       # Microsserviço RabbitMQ: reserva de estoque
  better-auth/        # Authorization Server OAuth2 (JWT RS256, JWKS)
  wordpress/          # WP + WooCommerce + WPGraphQL (somente Docker)
libs/
  shared-domain/      # Value objects, tipos e eventos de domínio
  shared-otel/        # Instrumentação OpenTelemetry compartilhada
  shared-auth/        # Guards / validação de JWT
  graphql-contracts/  # Operações .graphql usadas pelo MCP
infra/
  sst.config.ts       # Stack SST v3 (stub)
tools/                # Scripts do workspace (ex.: config do OTel Collector)
docker-compose.yml    # Stack de desenvolvimento local
```

## Pré-requisitos

- Node.js 22+ (o pnpm 11 usa `node:sqlite`, ausente antes do 22.5)
- pnpm 11 via `corepack enable` (fixado em `pnpm@11.4.0` no `package.json`)
- Docker + Docker Compose

## Rodando localmente

```bash
# instalar dependências
pnpm install

# subir toda a stack (apps + WordPress + RabbitMQ + Postgres + MySQL + OTel + Jaeger)
docker compose up
```

> No VS Code, **F5** ("Run full stack (docker compose up)") sobe a mesma stack. As
> demais configs de debug anexam o depurador a **um** serviço enquanto o resto roda.

| Serviço            | URL / Porta                         |
|--------------------|-------------------------------------|
| Gateway (GraphQL)  | http://localhost:3000/graphql       |
| users-suppliers    | http://localhost:3001               |
| orders-cart        | http://localhost:3002               |
| better-auth        | http://localhost:3003               |
| mcp-server         | http://localhost:3004               |
| WordPress          | http://localhost:8080               |
| RabbitMQ (admin)   | http://localhost:15672              |
| Jaeger UI          | http://localhost:16686              |

## Comandos Nx

```bash
pnpm nx run-many -t build           # build de todos os projetos (cache local)
pnpm nx affected -t build test lint # apenas o que mudou
pnpm nx graph                       # grafo de dependências do workspace
pnpm nx serve gateway               # rodar um serviço em modo dev
```

> Cache do Nx é **local** (Nx Cloud não é usado). O CI (`.github/workflows/ci.yml`) roda
> `typecheck`, `lint`, `test` e `build` via pnpm.

## Supergraph federado + Autenticação (OAuth2)

O **gateway** (`apps/gateway`) compõe o supergraph a partir dos subgraphs NestJS
`users-suppliers` e `orders-cart` **e do catálogo WooCommerce** (`apps/wordpress`),
todos via Apollo Federation v2 (`IntrospectAndCompose`). Operações expostas: `me`,
`myCart`, `products` (queries) e `createSupplier`, `addToCart`, `removeFromCart` (mutations).

A autenticação é OAuth2 via **Better Auth** (`apps/better-auth`): tokens **JWT RS256**,
JWKS em `/auth/jwks`, descoberta em `/.well-known/openid-configuration`, com Authorization
Code + PKCE e scopes (`cart:read`, `cart:write`, `orders:read`, `mcp:read`). O gateway
valida o Bearer JWT (via `libs/shared-auth` + JWKS) e propaga o contexto autenticado
(`x-user-id`, `x-supplier-id`, `x-roles`, `traceparent`) para os subgraphs.

```bash
# Caminho rápido (sessão → JWT), útil para testar o supergraph:
#   1. criar usuário (define o cookie de sessão)
curl -s -c cookies.txt -X POST http://localhost:3003/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"name":"Dev","email":"dev@example.com","password":"password12345"}'
#   2. emitir um JWT RS256 para a sessão (plugin jwt do Better Auth)
TOKEN=$(curl -s -b cookies.txt http://localhost:3003/auth/token | jq -r .token)
#   3. consultar o supergraph autenticado (sem token → 401):
curl -X POST http://localhost:3000/graphql \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"query":"{ me { id email ownedSuppliers { id legalName } } myCart { id items { productId quantity } } }"}'
```

> Para o fluxo OAuth2 completo (Authorization Code + PKCE), use o cliente `marketplace-web`
> já registrado; os endpoints estão em `/.well-known/openid-configuration` (:3003).

> **Migrações:** o serviço `migrator` (um disparo) prepara todo o banco em `docker compose up`:
> tabelas do marketplace (supplier, cart, `supplier_product_ownership`, …) via MikroORM, as
> tabelas do Better Auth (user, session, jwks, oauth_*) e o seed dos clientes OAuth2 de
> desenvolvimento (`marketplace-web` público/PKCE e `marketplace-mcp` confidencial). Idempotente.

## Catálogo WooCommerce federado

O **WordPress** (`apps/wordpress`) participa do supergraph como subgraph **Federation v2**
graças ao plugin **`wp-graphql-federations`** (provido pelo autor do desafio). O `entrypoint`
provisiona tudo de forma reprodutível (sem cliques no wp-admin): instala/ativa WPGraphQL,
WooCommerce e WooGraphQL (release `v1.0.2`), copia/ativa o plugin de federação e **seed da
config** expondo o tipo concreto **`SimpleProduct`** como entidade `@key(fields: "databaseId")`.

- **Identificador canônico de produto:** o `databaseId` (int) do WooCommerce — contrato
  compartilhado entre o catálogo, `supplier_product_ownership` (em `users-suppliers`) e o carrinho.
- **`users-suppliers`** estende `SimpleProduct` com `supplier: Supplier` (resolvido pela tabela
  `supplier_product_ownership`, fonte da verdade de ownership — escopo O2).
- **Seed de ownership:** o one-shot **`catalog-seed`** roda após o WordPress ficar saudável,
  resolve o `databaseId` do produto de exemplo via WPGraphQL (por SKU) e vincula-o a um fornecedor
  demo — idempotente.
- ⚠️ **Federe apenas tipos concretos** (`SimpleProduct`, …): habilitar a **interface `Product`**
  como entidade quebra o `_service{sdl}`/`_entities` do plugin. (Mutações de produto + enforcement
  de ownership ficam para a mudança seguinte.)

```bash
# Produto federado + seu fornecedor, atravessando catalog → users-suppliers (autenticado):
curl -X POST http://localhost:3000/graphql \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"query":"{ products(first:5){ nodes { databaseId ... on SimpleProduct { name supplier { id legalName } } } } }"}'
```

| Serviço | Porta |
|---|---|
| Catálogo (WordPress/WPGraphQL) | http://localhost:8080/graphql |
