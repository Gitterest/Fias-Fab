import { Router } from "express";
import { IdempotencyStore } from "../idempotency.js";
import { withLock } from "../locks.js";
import { TOOL_COSTS } from "../credits.js";
import { ShopifyClient, verifyProxySignature } from "../shopify.js";

const rateMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 60;

const rateLimit = (customerId: string) => {
  const now = Date.now();
  const entry = rateMap.get(customerId) ?? { count: 0, ts: now };
  if (now - entry.ts > 60_000) {
    entry.count = 0;
    entry.ts = now;
  }
  entry.count += 1;
  rateMap.set(customerId, entry);
  return entry.count <= RATE_LIMIT;
};

export const proxyRouter = (shopify: ShopifyClient, store: IdempotencyStore) => {
  const router = Router();

  router.get("/entitlements", async (req, res) => {
    if (!verifyProxySignature(req.query)) return res.status(401).send("invalid signature");
    const customerId = String(req.query.logged_in_customer_id ?? "");
    if (!customerId) return res.status(401).json({ balance: 0 });
    if (!rateLimit(customerId)) return res.status(429).json({ balance: 0 });
    const balance = await shopify.getCustomerBalance(customerId);
    res.setHeader("Cache-Control", "private, max-age=30");
    return res.json({ balance });
  });

  router.post("/credits/deduct", async (req, res) => {
    if (!verifyProxySignature(req.query)) return res.status(401).send("invalid signature");
    const customerId = String(req.query.logged_in_customer_id ?? "");
    if (!customerId) return res.status(401).json({ ok: false });
    if (!rateLimit(customerId)) return res.status(429).json({ ok: false });
    const runId = String(req.body?.run_id ?? "");
    const tool = String(req.body?.tool ?? "");
    const cost = TOOL_COSTS[tool];
    if (!runId || !cost) return res.status(400).json({ ok: false });
    const key = `deduct:${customerId}:${runId}`;
    const existing = await store.get<{ ok: boolean; balance_after?: number; reason?: string }>(key);
    if (existing) {
      return existing.ok
        ? res.json(existing)
        : res.status(409).json(existing);
    }
    const result = await withLock(customerId, async () => {
      const balance = await shopify.getCustomerBalance(customerId);
      if (balance < cost) {
        return { ok: false, reason: "insufficient", balance_after: balance };
      }
      const balance_after = await shopify.setCustomerBalance(customerId, balance - cost);
      return { ok: true, balance_after };
    });
    await store.set(key, result);
    return result.ok ? res.json(result) : res.status(409).json(result);
  });

  return router;
};
