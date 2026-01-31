# Fia's Fabrication

## Credits system setup
- Credit packs: SKU prefix `CREDITS_` (ex: `CREDITS_10`), optional title `10 Credits` or line item property `credits`.
- Webhook: register `orders/paid` to `/webhooks/orders/paid`.
- Metafield definition: run `npm run bootstrap:metafield` in `apps/fab-os-backend` or call `POST /admin/bootstrap/metafield-definition` with `ALLOW_ADMIN_BOOTSTRAP=true`.
- Dev test: place a credit pack order, confirm `customer.metafields.credits.balance`, then run tool buttons with `data-credit-tool`/`data-credit-cost`.
