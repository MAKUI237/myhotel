const memory = new Map<string, string>();

export async function getItem(key: string): Promise<string | null> {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    memory.delete(key);
  }
}
