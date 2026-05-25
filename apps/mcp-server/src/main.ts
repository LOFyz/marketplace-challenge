// Apollo MCP Server entrypoint (escopo §8). Exposes curated, read-only operations over
// the federated supergraph to AI agents, authenticated via Better Auth OAuth2
// (scope `mcp:read`). Tool whitelist, OAuth/JWKS validation, and the Apollo MCP wiring
// land in the MCP change — this is the bootstrap shell.
const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3000/graphql';
const port = Number(process.env.PORT ?? 3004);

async function bootstrap() {
  // eslint-disable-next-line no-console
  console.log(`🤖 MCP server bootstrap on :${port} — supergraph at ${gatewayUrl}`);
}

bootstrap();
