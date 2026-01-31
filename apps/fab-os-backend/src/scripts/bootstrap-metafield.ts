import "dotenv/config";
import { createShopifyClient } from "../shopify.js";

const client = createShopifyClient();

client.ensureMetafieldDefinition().then(() => {
  console.log("metafield definition ensured");
});
