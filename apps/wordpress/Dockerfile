# WordPress + WooCommerce + WPGraphQL — Catalog context (escopo §4.2, §11.3).
#
# The product catalog and WooCommerce orders are owned by this instance and exposed
# via WPGraphQL, then converted into a federated subgraph for the Apollo supergraph.
#
# This image only pins the WordPress runtime. WooCommerce, WPGraphQL, and
# WPGraphQL-for-WooCommerce are installed/activated via wp-cli against the running
# MySQL database during the seed step (see docker-compose.yml and seed scripts in a
# later change). No `nx build` target — this is a Docker-only project (see project.json).
FROM wordpress:6.5-php8.3-apache

# Provisioned at seed time via wp-cli:
#   wp plugin install woocommerce wp-graphql --activate
#   wp plugin install https://github.com/wp-graphql/wp-graphql-woocommerce --activate
