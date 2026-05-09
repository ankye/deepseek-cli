import type { CacheEntry, CacheKey, CacheManager, ContextProjectionResult, MemoryEntry, MemoryManager, MemoryScope, SessionId } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export const PROJECTION_CACHE_NAMESPACE = "context.projection";

export interface ProjectionCacheInput {
  readonly requestFingerprint: string;
  readonly dependencyFingerprints: readonly string[];
}

export function projectionCacheKey(input: ProjectionCacheInput): CacheKey {
  return asId<"cacheKey">(`${PROJECTION_CACHE_NAMESPACE}:${stableHash(`${input.requestFingerprint}:${[...input.dependencyFingerprints].sort().join("|")}`)}`);
}

export function createProjectionCacheEntry(input: ProjectionCacheInput, value: ContextProjectionResult, createdAt = new Date(0).toISOString()): CacheEntry<ContextProjectionResult> {
  return {
    key: projectionCacheKey(input),
    namespace: PROJECTION_CACHE_NAMESPACE,
    value,
    createdAt,
    invalidation: [...input.dependencyFingerprints].sort()
  };
}

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

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
