import fs from "node:fs";

export interface IdempotencyStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

export class MemoryStore implements IdempotencyStore {
  private store = new Map<string, unknown>();
  async get<T>(key: string) {
    return (this.store.get(key) as T) ?? null;
  }
  async set<T>(key: string, value: T) {
    this.store.set(key, value);
  }
}

export class FileStore implements IdempotencyStore {
  constructor(private path: string) {}
  private read() {
    if (!fs.existsSync(this.path)) return {} as Record<string, unknown>;
    return JSON.parse(fs.readFileSync(this.path, "utf8"));
  }
  private write(data: Record<string, unknown>) {
    fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
  }
  async get<T>(key: string) {
    const data = this.read();
    return (data[key] as T) ?? null;
  }
  async set<T>(key: string, value: T) {
    const data = this.read();
    data[key] = value as unknown;
    this.write(data);
  }
}
