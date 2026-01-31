import "dotenv/config";
import { createApp } from "./app.js";
import { FileStore, MemoryStore } from "./idempotency.js";

const store = process.env.IDEMPOTENCY_FILE
  ? new FileStore(process.env.IDEMPOTENCY_FILE)
  : new MemoryStore();

const app = createApp({ store });

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`fab-os-backend listening on ${port}`);
});
