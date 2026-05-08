import type { JsonObject, RedactionMetadata } from "./common.js";
import type { CacheKey, MemoryId, SessionId } from "./ids.js";

export type MemoryScope = "working" | "session" | "project" | "user" | "semantic" | "skill";

export interface MemoryEntry {
  readonly id: MemoryId;
  readonly scope: MemoryScope;
  readonly content: string;
  readonly provenance: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly ttlMs?: number;
  readonly confidence?: number;
}

export interface CacheEntry<T = unknown> {
  readonly key: CacheKey;
  readonly namespace: string;
  readonly value: T;
  readonly createdAt: string;
  readonly ttlMs?: number;
  readonly invalidation: readonly string[];
}

export interface MemoryManager {
  put(entry: MemoryEntry, sessionId?: SessionId): Promise<void>;
  query(scope: MemoryScope, sessionId?: SessionId): Promise<readonly MemoryEntry[]>;
}

export interface CacheManager {
  get<T>(key: CacheKey): Promise<CacheEntry<T> | undefined>;
  set<T>(entry: CacheEntry<T>): Promise<void>;
  invalidate(namespace: string, reason: string): Promise<number>;
}
