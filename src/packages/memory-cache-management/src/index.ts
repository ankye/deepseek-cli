import type { CacheEntry, CacheKey, CacheManager, MemoryEntry, MemoryManager, MemoryScope, SessionId } from "@deepseek/platform-contracts";

export class InMemoryMemoryManager implements MemoryManager {
  private readonly entries: MemoryEntry[] = [];

  async put(entry: MemoryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async query(scope: MemoryScope): Promise<readonly MemoryEntry[]> {
    return this.entries.filter((entry) => entry.scope === scope);
  }
}

export class InMemoryCacheManager implements CacheManager {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: CacheKey): Promise<CacheEntry<T> | undefined> {
    return this.entries.get(key) as CacheEntry<T> | undefined;
  }

  async set<T>(entry: CacheEntry<T>): Promise<void> {
    this.entries.set(entry.key, entry as CacheEntry<unknown>);
  }

  async invalidate(namespace: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.entries) {
      if (entry.namespace === namespace) {
        this.entries.delete(key);
        count++;
      }
    }
    return count;
  }
}

export function scopedMemoryKey(sessionId: SessionId, name: string): string {
  return `${sessionId}:${name}`;
}
