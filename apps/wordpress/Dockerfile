# WordPress + WooCommerce + WPGraphQL — Catalog context, federated into the Apollo
# supergraph (escopo §4.2, §6). The wp-graphql-federations plugin makes WordPress a
# Federation v2 subgraph; the entrypoint installs/activates the plugins and seeds the
# federation config + a sample product reproducibly (no manual wp-admin steps).
#
# WordPress MUST be >= 6.8 — current WooCommerce refuses to install on older cores.
FROM wordpress:6.8-php8.3-apache

# wp-cli needs a DB client (for the readiness wait) and unzip (for plugin installs).
RUN apt-get update && apt-get install -y --no-install-recommends \
      less default-mysql-client unzip ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# WP-CLI (the alpine wordpress:cli image won't exec on every host kernel; running the
# phar under this image's PHP is portable).
RUN curl -fsSL -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
  && chmod +x /usr/local/bin/wp

# Bake the vendored federation plugin into the image; the entrypoint copies it into
# wp-content/plugins on first boot (a compose bind mount, if present, shadows this for
# live local edits). The plugin has a fallback PSR-4 autoloader — no composer needed.
COPY plugins/wp-graphql-federations /usr/src/wp-graphql-federations

COPY docker-entrypoint-custom.sh /usr/local/bin/docker-entrypoint-custom.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-custom.sh

ENTRYPOINT ["docker-entrypoint-custom.sh"]
CMD ["apache2-foreground"]
