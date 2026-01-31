import { MemoryStore } from "../src/idempotency.js";

test("stores idempotency entries", async () => {
  const store = new MemoryStore();
  await store.set("order:1", { ok: true });
  const value = await store.get<{ ok: boolean }>("order:1");
  expect(value?.ok).toBe(true);
});
