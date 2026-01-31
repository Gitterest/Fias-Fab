# Security Notes
- Webhooks: verify `X-Shopify-Hmac-Sha256` with raw body and `SHOPIFY_WEBHOOK_SECRET`.
- App proxy: verify signature with `SHOPIFY_APP_PROXY_SECRET`, fail closed.
- Idempotency: `order:<order_id>` for top-ups and `deduct:<customer_id>:<run_id>` for tool runs; replace file/memory store with Redis/Postgres in prod.
