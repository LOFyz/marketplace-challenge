import { Module } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloGatewayDriver,
  type ApolloGatewayDriverConfig,
} from '@nestjs/apollo';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import {
  extractBearer,
  principalFromPayload,
  verifyAccessToken,
  type Principal,
} from '@org/shared-auth';

interface GatewayContext {
  principal?: Principal;
  traceparent?: string;
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            {
              name: 'users-suppliers',
              url:
                process.env['SUBGRAPH_USERS_URL'] ??
                'http://localhost:3001/graphql',
            },
            {
              name: 'orders-cart',
              url:
                process.env['SUBGRAPH_ORDERS_URL'] ??
                'http://localhost:3002/graphql',
            },
          ],
        }),
        // Propagate the validated auth context + trace to every subgraph (§4.1).
        buildService({ url }) {
          const dataSource = new RemoteGraphQLDataSource({ url });
          dataSource.willSendRequest = (options: {
            request: { http?: { headers: { set(k: string, v: string): void } } };
            context: GatewayContext;
          }) => {
            const { request, context } = options;
            const headers = request.http?.headers;
            if (!headers) return;
            if (context.principal) {
              headers.set('x-user-id', context.principal.userId);
              if (context.principal.supplierId) {
                headers.set('x-supplier-id', context.principal.supplierId);
              }
              headers.set('x-roles', context.principal.roles.join(','));
            }
            if (context.traceparent) headers.set('traceparent', context.traceparent);
          };
          return dataSource;
        },
      },
      server: {
        // Validate the bearer JWT (if present) and attach the principal (§7).
        context: async ({ req }: { req: { headers: Record<string, string | string[] | undefined> } }): Promise<GatewayContext> => {
          const auth = req.headers['authorization'];
          const token = extractBearer(Array.isArray(auth) ? auth[0] : auth);
          const traceparent = req.headers['traceparent'];
          // Auth boundary (design Decision 4 / escopo §7): every operation in this
          // supergraph is user-scoped, so a valid Bearer JWT is required. Missing
          // or invalid → 401. (Subgraph introspection for composition uses a
          // separate gateway→subgraph channel, not this client-facing context.)
          // A GraphQLError with http.status is required for Apollo to emit 401 —
          // Nest HTTP exceptions thrown here surface as a generic 500.
          const unauthorized = (msg: string) =>
            new GraphQLError(msg, {
              extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
            });
          if (!token) {
            throw unauthorized('Missing bearer token');
          }
          let principal: Principal;
          try {
            principal = principalFromPayload(await verifyAccessToken(token));
          } catch {
            throw unauthorized('Invalid or expired token');
          }
          return {
            principal,
            traceparent: Array.isArray(traceparent) ? traceparent[0] : traceparent,
          };
        },
      },
    }),
  ],
})
export class AppModule {}
