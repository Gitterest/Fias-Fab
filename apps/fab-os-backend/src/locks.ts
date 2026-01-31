const locks = new Map<string, Promise<void>>();

export const withLock = async <T>(key: string, fn: () => Promise<T>) => {
  const previous = locks.get(key) ?? Promise.resolve();
  let resolveNext: () => void;
  const next = new Promise<void>((resolve) => {
    resolveNext = resolve;
  });
  locks.set(key, previous.then(() => next));
  await previous;
  try {
    return await fn();
  } finally {
    resolveNext!();
    if (locks.get(key) === next) locks.delete(key);
  }
};
