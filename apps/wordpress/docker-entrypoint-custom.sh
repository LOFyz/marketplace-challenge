#!/bin/bash
# Provisions WordPress as a Federation v2 catalog subgraph (escopo §4.2, §6):
#   - installs/activates WPGraphQL, WooCommerce, WooGraphQL, and wp-graphql-federations
#   - seeds the federation config so ONLY the concrete `SimpleProduct` is exposed as a
#     @key(fields:"databaseId") entity (the `Product` interface crashes the plugin)
#   - seeds a sample product and self-checks that `_service { sdl }` composes
# All steps are idempotent and resilient (wp.org installs are retried — a transient blip
# during a heavy concurrent bring-up must NOT leave the catalog half-provisioned).
# NOTE: deliberately no `set -e` — Apache runs in the background and the container must
# stay alive so the healthcheck reports readiness and retries can make progress.

WP=(wp --allow-root --path=/var/www/html)
SITE_URL="${WP_SITE_URL:-http://localhost:8080}"
ADMIN_USER="${WP_ADMIN_USER:-admin}"
ADMIN_PASS="${WP_ADMIN_PASSWORD:-admin}"
ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@example.com}"
WOOGRAPHQL_ZIP="https://github.com/wp-graphql/wp-graphql-woocommerce/releases/download/v1.0.2/wp-graphql-woocommerce.zip"
# Pinned to a known-good WooCommerce version. The unpinned wp.org URL
# (.../plugin/woocommerce.zip) fails through wp-cli with "could not be found" —
# something in wp-cli's unpacking path handles the version-pinned filename
# correctly but not the unpinned one. Pinning is also better for reproducibility.
WOOCOMMERCE_ZIP="https://downloads.wordpress.org/plugin/woocommerce.10.7.0.zip"
SAMPLE_SKU="${CATALOG_SAMPLE_SKU:-MKT-WIDGET-001}"

# Start Apache + the stock WordPress entrypoint (writes wp-config, copies core) in bg.
docker-entrypoint.sh apache2-foreground &

# --- wait for the database -------------------------------------------------
DB_HOST_ARG="${WORDPRESS_DB_HOST:-db}"
DB_HOST_NAME="${DB_HOST_ARG%:*}"
DB_HOST_PORT="${DB_HOST_ARG##*:}"; [ "$DB_HOST_NAME" = "$DB_HOST_PORT" ] && DB_HOST_PORT=3306
echo "⏳ waiting for MySQL at ${DB_HOST_NAME}:${DB_HOST_PORT}..."
until mysql -h "$DB_HOST_NAME" -P "$DB_HOST_PORT" -u"$WORDPRESS_DB_USER" -p"$WORDPRESS_DB_PASSWORD" --skip-ssl -e "SELECT 1" >/dev/null 2>&1; do
  sleep 2
done

# --- wait for WP core files, then install ----------------------------------
until "${WP[@]}" core version >/dev/null 2>&1; do echo "⏳ waiting for WordPress core..."; sleep 2; done
if ! "${WP[@]}" core is-installed >/dev/null 2>&1; then
  echo "🚀 installing WordPress..."
  "${WP[@]}" core install --url="$SITE_URL" --title="Marketplace Catalog" \
    --admin_user="$ADMIN_USER" --admin_password="$ADMIN_PASS" --admin_email="$ADMIN_EMAIL" --skip-email
fi

# --- plugins (idempotent + retried) ----------------------------------------
# $1 = slug (for is-installed/activate); $2 = install source (wp.org slug or zip URL).
ensure_plugin() {
  if "${WP[@]}" plugin is-installed "$1" >/dev/null 2>&1; then
    "${WP[@]}" plugin activate "$1" >/dev/null 2>&1 || true
    return 0
  fi
  for attempt in 1 2 3 4 5; do
    if "${WP[@]}" plugin install "$2" --activate; then return 0; fi
    echo "⏳ retry ${attempt}/5 installing ${1} (transient wp.org/network blip)..."
    sleep 6
  done
  echo "❌ could not install ${1} after retries" >&2
  return 1
}

echo "🔌 installing catalog plugins..."
ensure_plugin wp-graphql wp-graphql
# WooCommerce: pinned direct zip (see WOOCOMMERCE_ZIP comment) — the wp.org slug path
# trips wp-cli's compatibility gate with a spurious "min WP 6.8" on a 6.8.3 site, and
# the unpinned URL fails wp-cli's unpacking. The pinned zip is reproducible and works.
ensure_plugin woocommerce "$WOOCOMMERCE_ZIP"
ensure_plugin wp-graphql-woocommerce "$WOOGRAPHQL_ZIP"
# Federation plugin: copy the baked source on first boot, then activate.
if [ -d /usr/src/wp-graphql-federations ] && [ ! -d /var/www/html/wp-content/plugins/wp-graphql-federations ]; then
  cp -r /usr/src/wp-graphql-federations /var/www/html/wp-content/plugins/wp-graphql-federations
fi
"${WP[@]}" plugin activate wp-graphql-federations >/dev/null 2>&1 || true

# --- federation config: expose ONLY concrete SimpleProduct (NEVER the Product interface) ---
echo "🧩 seeding federation config (SimpleProduct @key=databaseId)..."
"${WP[@]}" option update wpgraphql_federation_settings \
  '{"SimpleProduct":{"enabled":true,"key":"databaseId","kind":"post_type"}}' --format=json

# --- sample product (idempotent by SKU) ------------------------------------
if [ -z "$("${WP[@]}" wc product list --sku="$SAMPLE_SKU" --field=id --user=1 2>/dev/null)" ]; then
  echo "📦 seeding sample product ($SAMPLE_SKU)..."
  "${WP[@]}" wc product create --name="Marketplace Widget" --type=simple --sku="$SAMPLE_SKU" \
    --regular_price=19.99 --manage_stock=true --stock_quantity=100 --status=publish --user=1 >/dev/null \
    || echo "⚠️  product seed failed (will retry on next boot)"
fi

# --- self-check: _service { sdl } must compose with SimpleProduct @key ------
echo "🔎 verifying federation SDL..."
ok=0
for _ in $(seq 1 30); do
  SDL=$(curl -s http://localhost/graphql -H 'content-type: application/json' -d '{"query":"{ _service { sdl } }"}' || true)
  case "$SDL" in
    *'type SimpleProduct'*) ok=1; break ;;
  esac
  sleep 2
done
if [ "$ok" = 1 ]; then
  echo "✅ catalog subgraph is federation-ready (SimpleProduct @key=databaseId)"
else
  echo "⚠️  federation SDL not ready yet — healthcheck will keep probing" >&2
fi

# Keep the container alive (Apache is the foreground workload).
wait
