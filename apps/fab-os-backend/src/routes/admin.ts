import { Router } from "express";
import { ShopifyClient } from "../shopify.js";

export const adminRouter = (shopify: ShopifyClient) => {
  const router = Router();

  router.post("/bootstrap/metafield-definition", async (_req, res) => {
    if (process.env.ALLOW_ADMIN_BOOTSTRAP !== "true") {
      return res.status(403).send("disabled");
    }
    await shopify.ensureMetafieldDefinition();
    return res.json({ ok: true });
  });

  return router;
};
