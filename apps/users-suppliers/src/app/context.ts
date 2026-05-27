export interface SubgraphContext {
  userId?: string;
  supplierId?: string;
  roles: string[];
}

/** Build the request context from the gateway-propagated headers (escopo §4.1). */
export function contextFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): SubgraphContext {
  const h = (k: string): string | undefined => {
    const v = headers[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    userId: h('x-user-id') || undefined,
    supplierId: h('x-supplier-id') || undefined,
    roles: (h('x-roles') ?? '').split(',').filter(Boolean),
  };
}
