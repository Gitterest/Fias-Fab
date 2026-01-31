import express from "express";
import bodyParser from "body-parser";
import { IdempotencyStore, MemoryStore } from "./idempotency.js";
import { createShopifyClient, ShopifyClient } from "./shopify.js";
import { proxyRouter } from "./routes/proxy.js";
import { webhookRouter } from "./routes/webhooks.js";
import { adminRouter } from "./routes/admin.js";

export const createApp = (deps?: {
  shopify?: ShopifyClient;
  store?: IdempotencyStore;
}) => {
  const app = express();
  const shopify = deps?.shopify ?? createShopifyClient();
  const store = deps?.store ?? new MemoryStore();

  app.use("/proxy", bodyParser.json(), proxyRouter(shopify, store));
  app.use("/webhooks", bodyParser.raw({ type: "application/json" }), webhookRouter(shopify, store));
  app.use("/admin", bodyParser.json(), adminRouter(shopify));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  return app;
};
