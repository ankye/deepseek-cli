import type { ConcurrencyOrchestrator, ResourceLock, TaskEvent, TaskId, TaskScope } from "@deepseek/platform-contracts";

export class DeterministicScheduler implements ConcurrencyOrchestrator {
  private readonly taskEvents: TaskEvent[] = [];
  private readonly lockChains = new Map<string, Promise<unknown>>();
  private readonly cancelled = new Map<string, string>();

  async run<T>(scope: TaskScope, work: () => Promise<T>): Promise<T> {
    const cancelledReason = this.cancelled.get(scope.id);
    if (cancelledReason) {
      this.record(scope.id, "cancelled", cancelledReason);
      throw new Error(`Task cancelled: ${cancelledReason}`);
    }
    if (scope.deadlineMs !== undefined && scope.deadlineMs <= 0) {
      this.record(scope.id, "timed-out", "deadline elapsed before task start");
      throw new Error("Task deadline elapsed");
    }
    this.record(scope.id, "running");
    try {
      const result = await work();
      const cancelledAfterWork = this.cancelled.get(scope.id);
      if (cancelledAfterWork) {
        this.record(scope.id, "cancelled", cancelledAfterWork);
        throw new Error(`Task cancelled: ${cancelledAfterWork}`);
      }
      this.record(scope.id, "completed");
      return result;
    } catch (error) {
      if (this.cancelled.has(scope.id)) throw error;
      this.record(scope.id, "failed", error instanceof Error ? error.message : "unknown");
      throw error;
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
    this.record(taskId, "cancelled", reason);
  }

  events(): readonly TaskEvent[] {
    return [...this.taskEvents];
  }

  private record(taskId: TaskId, status: TaskEvent["status"], reason?: string): void {
    this.taskEvents.push({
      taskId,
      status,
      at: new Date(0).toISOString(),
      ...(reason ? { reason } : {})
    });
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
