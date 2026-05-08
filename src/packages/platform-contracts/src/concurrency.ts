import type { JsonObject, TraceContext } from "./common.js";
import type { TaskId } from "./ids.js";

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "timed-out";
export type ResourceLockKind =
  | "workspace"
  | "path"
  | "session"
  | "agent-instance"
  | "model-provider"
  | "process-slot"
  | "extension-loading"
  | "plugin-install-update"
  | "mcp-connection"
  | "hook-execution"
  | "remote-transport";

export interface TaskScope {
  readonly id: TaskId;
  readonly parentId?: TaskId;
  readonly name: string;
  readonly deadlineMs?: number;
  readonly trace?: TraceContext;
  readonly metadata?: JsonObject;
}

export interface TaskEvent {
  readonly taskId: TaskId;
  readonly status: TaskStatus;
  readonly at: string;
  readonly trace?: TraceContext;
  readonly reason?: string;
}

export interface ResourceLock {
  readonly kind: ResourceLockKind;
  readonly key: string;
}

export interface QueuePolicy {
  readonly maxConcurrency: number;
  readonly maxQueueSize: number;
  readonly retryBudget: number;
}

export interface ConcurrencyOrchestrator {
  run<T>(scope: TaskScope, work: () => Promise<T>): Promise<T>;
  withLock<T>(lock: ResourceLock, work: () => Promise<T>): Promise<T>;
  cancel(taskId: TaskId, reason: string): Promise<void>;
  subscribe(listener: (event: TaskEvent) => void): () => void;
  events(): readonly TaskEvent[];
}
