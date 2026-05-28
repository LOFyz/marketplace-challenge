import { Logger } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  SupplierEntitySchema,
  SupplierProductOwnershipEntitySchema,
} from '@org/users-infrastructure';

// Fixed dev identities so the seed is idempotent and deterministic across boots.
const DEMO_SUPPLIER_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_OWNER_ID = '00000000-0000-4000-8000-0000000000ff';

/**
 * Resolve a WooCommerce product's `databaseId` from its SKU via WPGraphQL. The catalog
 * subgraph assigns the id at provision time, so we look it up at seed time (this runs
 * after WordPress is federation-ready) rather than guessing a deterministic post id.
 */
async function fetchProductDatabaseIdBySku(
  url: string,
  sku: string,
): Promise<number | null> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: '{ products(first: 100) { nodes { databaseId sku } } }',
    }),
  });
  const json = (await res.json()) as {
    data?: { products?: { nodes?: Array<{ databaseId: number; sku: string }> } };
  };
  const match = json.data?.products?.nodes?.find((n) => n?.sku === sku);
  return match ? Number(match.databaseId) : null;
}

/**
 * Seed supplier-product ownership for the sample catalog (escopo §14.6): ensure a demo
 * supplier exists and link it to the seeded product by `databaseId`. Idempotent.
 */
export async function seedCatalogOwnership(
  em: EntityManager,
  opts: { wpUrl: string; sku: string },
): Promise<void> {
  const databaseId = await fetchProductDatabaseIdBySku(opts.wpUrl, opts.sku);
  if (databaseId == null) {
    Logger.warn(
      `Sample product sku=${opts.sku} not found at ${opts.wpUrl}; skipping ownership seed`,
      'CatalogSeed',
    );
    return;
  }

  const existingSupplier = await em.findOne(SupplierEntitySchema, {
    id: DEMO_SUPPLIER_ID,
  });
  if (!existingSupplier) {
    const now = new Date();
    em.persist(
      em.create(SupplierEntitySchema, {
        id: DEMO_SUPPLIER_ID,
        legalName: 'Demo Supplier Co.',
        taxId: 'DEMO-TAXID-0001',
        ownerId: DEMO_OWNER_ID,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  const existingOwnership = await em.findOne(SupplierProductOwnershipEntitySchema, {
    productDatabaseId: databaseId,
  });
  if (!existingOwnership) {
    em.persist(
      em.create(SupplierProductOwnershipEntitySchema, {
        productDatabaseId: databaseId,
        supplierId: DEMO_SUPPLIER_ID,
        createdAt: new Date(),
      }),
    );
  }

  await em.flush();
  Logger.log(
    `Linked product databaseId=${databaseId} → supplier ${DEMO_SUPPLIER_ID}`,
    'CatalogSeed',
  );
}
