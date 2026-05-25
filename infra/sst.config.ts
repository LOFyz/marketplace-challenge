/// <reference path="./.sst/platform/config.d.ts" />

// SST v3 (Ion) stack — escopo §11. STUB ONLY: no resources are declared yet.
// The full stack (ECS Fargate services for gateway/subgraphs/workers/better-auth/
// mcp-server, RDS Postgres, RDS MySQL for WooCommerce, Amazon MQ for RabbitMQ, ECR,
// S3, Secrets Manager) is implemented in a later change (§11.1–§11.2).
export default $config({
  app(input) {
    return {
      name: 'marketplace-challenge',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage ?? ''),
      home: 'aws',
    };
  },
  async run() {
    // Resources are defined here in the deploy change. Intentionally empty so the
    // monorepo matches escopo §15 structure without provisioning anything.
  },
});
