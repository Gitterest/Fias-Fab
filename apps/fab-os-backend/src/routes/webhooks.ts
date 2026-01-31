import { Router } from "express";
import { IdempotencyStore } from "../idempotency.js";
import { parseCreditsFromOrder } from "../credits.js";
import { ShopifyClient, verifyHmac } from "../shopify.js";

type OrderPayload = {
  id: number;
  customer?: { id: number } | null;
  line_items: { sku?: string | null; name?: string | null; quantity?: number | null; properties?: { name: string; value: string }[] | null }[];
};

export const webhookRouter = (shopify: ShopifyClient, store: IdempotencyStore) => {
  const router = Router();

  router.post("/orders/paid", async (req, res) => {
    const hmac = req.header("X-Shopify-Hmac-Sha256");
    if (!verifyHmac(req.body as Buffer, hmac)) return res.status(401).send("invalid hmac");
    const payload = JSON.parse((req.body as Buffer).toString("utf8")) as OrderPayload;
    if (!payload.customer?.id) return res.status(200).send("no customer");
    const credits = parseCreditsFromOrder(payload.line_items ?? []);
    if (!credits) return res.status(200).send("no credits");
    const key = `order:${payload.id}`;
    const existing = await store.get(key);
    if (existing) return res.status(200).send("already processed");
    await shopify.incrementCustomerBalance(String(payload.customer.id), credits);
    await store.set(key, { processedAt: new Date().toISOString(), credits });
    return res.status(200).send("ok");
  });

  return router;
};
