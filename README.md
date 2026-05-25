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

- Node.js 20+
- pnpm 10+ (`corepack enable`)
- Docker + Docker Compose

## Rodando localmente

```bash
# instalar dependências
pnpm install

# subir toda a stack (apps + WordPress + RabbitMQ + Postgres + MySQL + OTel + Jaeger)
docker compose up
```

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
