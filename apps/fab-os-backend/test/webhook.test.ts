import crypto from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";
import { MemoryStore } from "../src/idempotency.js";

const secret="test-secret";
const makeApp=()=>{const shopify={getCustomerBalance:async()=>0,setCustomerBalance:async(_id:string,value:number)=>value,incrementCustomerBalance:async()=>0,ensureMetafieldDefinition:async()=>{}};return createApp({shopify,store:new MemoryStore()})};

beforeAll(()=>{process.env.SHOPIFY_WEBHOOK_SECRET=secret});

test("orders/paid is idempotent",async()=>{const app=makeApp();const payload=JSON.stringify({id:100,customer:{id:1},line_items:[{sku:"CREDITS_10",quantity:1}]});const hmac=crypto.createHmac("sha256",secret).update(payload).digest("base64");const first=await request(app).post("/webhooks/orders/paid").set("X-Shopify-Hmac-Sha256",hmac).set("Content-Type","application/json").send(payload);const second=await request(app).post("/webhooks/orders/paid").set("X-Shopify-Hmac-Sha256",hmac).set("Content-Type","application/json").send(payload);expect(first.text).toBe("ok");expect(second.text).toBe("already processed")});
