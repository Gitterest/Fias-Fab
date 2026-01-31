import request from "supertest";
import { createApp } from "../src/app.js";
import { MemoryStore } from "../src/idempotency.js";

const makeApp=(balance=5)=>{let current=balance;const shopify={getCustomerBalance:async()=>current,setCustomerBalance:async(_id:string,value:number)=>{current=value;return current;},incrementCustomerBalance:async(_id:string,delta:number)=>{current+=delta;return current;},ensureMetafieldDefinition:async()=>{}};return createApp({shopify,store:new MemoryStore()})};

beforeAll(()=>{process.env.APP_PROXY_BYPASS="true"});

test("deducts credits when sufficient",async()=>{const app=makeApp(3);const res=await request(app).post("/proxy/credits/deduct?logged_in_customer_id=1").send({run_id:"run-1",tool:"image_compressor"});expect(res.status).toBe(200);expect(res.body.balance_after).toBe(2)});

test("returns insufficient when balance low",async()=>{const app=makeApp(0);const res=await request(app).post("/proxy/credits/deduct?logged_in_customer_id=1").send({run_id:"run-2",tool:"svg_batch_tool"});expect(res.status).toBe(409);expect(res.body.reason).toBe("insufficient")});

test("idempotent deduct",async()=>{const app=makeApp(5);const first=await request(app).post("/proxy/credits/deduct?logged_in_customer_id=1").send({run_id:"run-3",tool:"image_compressor"});const second=await request(app).post("/proxy/credits/deduct?logged_in_customer_id=1").send({run_id:"run-3",tool:"image_compressor"});expect(first.body.balance_after).toBe(second.body.balance_after)});
