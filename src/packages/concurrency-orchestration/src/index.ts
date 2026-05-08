import type { ConcurrencyOrchestrator, QueuePolicy, ResourceLock, TaskEvent, TaskId, TaskScope } from "@deepseek/platform-contracts";

export class DeterministicScheduler implements ConcurrencyOrchestrator {
  private readonly taskEvents: TaskEvent[] = [];
  private readonly lockChains = new Map<string, Promise<unknown>>();
  private readonly cancelled = new Map<string, string>();
  private readonly listeners = new Set<(event: TaskEvent) => void>();
  private readonly queue: Array<() => void> = [];
  private running = 0;
  private readonly policy: QueuePolicy;

  constructor(policy: Partial<QueuePolicy> = {}) {
    this.policy = {
      maxConcurrency: policy.maxConcurrency ?? 1,
      maxQueueSize: policy.maxQueueSize ?? 100,
      retryBudget: policy.retryBudget ?? 0
    };
  }

  async run<T>(scope: TaskScope, work: () => Promise<T>): Promise<T> {
    this.record(scope, "queued");
    const cancelledReason = this.cancelled.get(scope.id);
    if (cancelledReason) {
      this.record(scope, "cancelled", cancelledReason);
      throw new Error(`Task cancelled: ${cancelledReason}`);
    }
    if (scope.deadlineMs !== undefined && scope.deadlineMs <= 0) {
      this.record(scope, "timed-out", "deadline elapsed before task start");
      throw new Error("Task deadline elapsed");
    }

    await this.acquireSlot(scope);

    const timer = scope.deadlineMs === undefined
      ? undefined
      : new Promise<never>((_, reject) => {
          setTimeout(() => {
            this.cancel(scope.id, "timeout").catch(() => undefined);
            reject(new Error("Task deadline elapsed"));
          }, scope.deadlineMs);
        });

    this.record(scope, "running");
    try {
      const result = await (timer ? Promise.race([work(), timer]) : work());
      const cancelledAfterWork = this.cancelled.get(scope.id);
      if (cancelledAfterWork) {
        this.record(scope, cancelledAfterWork === "timeout" ? "timed-out" : "cancelled", cancelledAfterWork);
        throw new Error(`Task cancelled: ${cancelledAfterWork}`);
      }
      this.record(scope, "completed");
      return result;
    } catch (error) {
      const reason = this.cancelled.get(scope.id);
      if (reason === "timeout") {
        this.record(scope, "timed-out", reason);
      } else if (reason) {
        this.record(scope, "cancelled", reason);
      } else {
        this.record(scope, "failed", error instanceof Error ? error.message : "unknown");
      }
      throw error;
    } finally {
      this.releaseSlot();
    }
  }

  async withLock<T>(lock: ResourceLock, work: () => Promise<T>): Promise<T> {
    const key = `${lock.kind}:${lock.key}`;
    const previous = this.lockChains.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.lockChains.set(
      key,
      previous.then(() => current)
    );
    await previous;
    try {
      return await work();
    } finally {
      release();
      if (this.lockChains.get(key) === current) {
        this.lockChains.delete(key);
      }
    }
  }

  async cancel(taskId: TaskId, reason: string): Promise<void> {
    this.cancelled.set(taskId, reason);
    this.record({ id: taskId }, reason === "timeout" ? "timed-out" : "cancelled", reason);
  }

  subscribe(listener: (event: TaskEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  events(): readonly TaskEvent[] {
    return [...this.taskEvents];
  }

  private async acquireSlot(scope: TaskScope): Promise<void> {
    if (this.queue.length >= this.policy.maxQueueSize) {
      this.record(scope, "failed", "queue full");
      throw new Error("Task queue full");
    }
    if (this.running < this.policy.maxConcurrency) {
      this.running += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.running += 1;
  }

  private releaseSlot(): void {
    this.running = Math.max(0, this.running - 1);
    const next = this.queue.shift();
    if (next) next();
  }

  private record(scope: Pick<TaskScope, "id" | "trace">, status: TaskEvent["status"], reason?: string): void {
    const event: TaskEvent = {
      taskId: scope.id,
      status,
      at: new Date(0).toISOString(),
      ...(scope.trace ? { trace: scope.trace } : {}),
      ...(reason ? { reason } : {})
    };
    this.taskEvents.push(event);
    for (const listener of this.listeners) listener(event);
  }
}

export function defaultResourceLocks(): readonly ResourceLock["kind"][] {
  return [
    "workspace",
    "path",
    "session",
    "agent-instance",
    "model-provider",
    "process-slot",
    "extension-loading",
    "plugin-install-update",
    "mcp-connection",
    "hook-execution",
    "remote-transport"
  ];
}
