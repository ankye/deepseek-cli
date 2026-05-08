import type {
  ConcurrencyOrchestrator,
  QueuePolicy,
  ResourceLock,
  TaskEvent,
  TaskExecutionContext,
  TaskId,
  TaskScope
} from "@deepseek/platform-contracts";

type TaskTerminalStatus = Extract<TaskEvent["status"], "completed" | "failed" | "cancelled" | "timed-out">;

interface QueuedTaskRecord {
  readonly scope: TaskScope;
  resolveSlot: () => void;
  rejectSlot: (error: Error) => void;
  readonly controller: AbortController;
  status: "queued" | "running" | TaskTerminalStatus;
  terminalEmitted: boolean;
  cancellationReason?: string;
}

export class SchedulerError extends Error {
  constructor(readonly code: "SCHEDULER_QUEUE_BACKPRESSURE" | "SCHEDULER_TASK_CANCELLED" | "SCHEDULER_TASK_TIMEOUT", message: string) {
    super(message);
    this.name = code;
  }
}

export class DeterministicScheduler implements ConcurrencyOrchestrator {
  private readonly taskEvents: TaskEvent[] = [];
  private readonly lockChains = new Map<string, Promise<unknown>>();
  private readonly cancelled = new Map<string, string>();
  private readonly tasks = new Map<string, QueuedTaskRecord>();
  private readonly listeners = new Set<(event: TaskEvent) => void>();
  private readonly queue: QueuedTaskRecord[] = [];
  private running = 0;
  private readonly policy: QueuePolicy;

  constructor(policy: Partial<QueuePolicy> = {}) {
    this.policy = {
      maxConcurrency: policy.maxConcurrency ?? 1,
      maxQueueSize: policy.maxQueueSize ?? 100,
      retryBudget: policy.retryBudget ?? 0
    };
  }

  async run<T>(scope: TaskScope, work: (context: TaskExecutionContext) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const task: QueuedTaskRecord = {
      scope,
      resolveSlot: () => undefined,
      rejectSlot: () => undefined,
      controller,
      status: "queued",
      terminalEmitted: false
    };
    this.tasks.set(scope.id, task);
    this.record(scope, "queued");
    const cancelledReason = this.cancelled.get(scope.id);
    if (cancelledReason) {
      this.emitTerminal(task, "cancelled", cancelledReason);
      this.tasks.delete(scope.id);
      throw new SchedulerError("SCHEDULER_TASK_CANCELLED", `Task cancelled: ${cancelledReason}`);
    }
    if (scope.deadlineMs !== undefined && scope.deadlineMs <= 0) {
      this.emitTerminal(task, "timed-out", "deadline elapsed before task start");
      this.tasks.delete(scope.id);
      throw new SchedulerError("SCHEDULER_TASK_TIMEOUT", "Task deadline elapsed");
    }

    try {
      await this.acquireSlot(task);
    } catch (error) {
      this.tasks.delete(scope.id);
      throw error;
    }

    task.status = "running";
    this.record(scope, "running");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (scope.deadlineMs !== undefined) {
      timeout = setTimeout(() => {
        this.cancel(scope.id, "timeout").catch(() => undefined);
      }, scope.deadlineMs);
    }
    try {
      const context: TaskExecutionContext = {
        signal: controller.signal,
        ...(task.cancellationReason ? { cancellationReason: task.cancellationReason } : {})
      };
      const abort = new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          "abort",
          () => {
            const reason = task.cancellationReason ?? (typeof controller.signal.reason === "string" ? controller.signal.reason : "aborted");
            reject(new SchedulerError(reason === "timeout" ? "SCHEDULER_TASK_TIMEOUT" : "SCHEDULER_TASK_CANCELLED", `Task cancelled: ${reason}`));
          },
          { once: true }
        );
      });
      const workPromise = work(context);
      workPromise.catch(() => undefined);
      const result = await Promise.race([workPromise, abort]);
      const cancelledAfterWork = this.cancelled.get(scope.id);
      if (cancelledAfterWork) {
        const status = cancelledAfterWork === "timeout" ? "timed-out" : "cancelled";
        this.emitTerminal(task, status, cancelledAfterWork);
        throw new SchedulerError(cancelledAfterWork === "timeout" ? "SCHEDULER_TASK_TIMEOUT" : "SCHEDULER_TASK_CANCELLED", `Task cancelled: ${cancelledAfterWork}`);
      }
      this.emitTerminal(task, "completed");
      return result;
    } catch (error) {
      const reason = this.cancelled.get(scope.id);
      if (reason === "timeout") {
        this.emitTerminal(task, "timed-out", reason);
      } else if (reason) {
        this.emitTerminal(task, "cancelled", reason);
      } else {
        this.emitTerminal(task, "failed", error instanceof Error ? error.message : "unknown");
      }
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
      this.tasks.delete(scope.id);
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
    const task = this.tasks.get(taskId);
    if (!task) {
      this.record({ id: taskId }, reason === "timeout" ? "timed-out" : "cancelled", reason);
      return;
    }
    task.cancellationReason = reason;
    task.controller.abort(reason);
    if (task.status === "queued") {
      this.removeQueued(task);
      this.emitTerminal(task, reason === "timeout" ? "timed-out" : "cancelled", reason);
      task.rejectSlot(new SchedulerError(reason === "timeout" ? "SCHEDULER_TASK_TIMEOUT" : "SCHEDULER_TASK_CANCELLED", `Task cancelled: ${reason}`));
      this.tasks.delete(taskId);
      return;
    }
  }

  subscribe(listener: (event: TaskEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  events(): readonly TaskEvent[] {
    return [...this.taskEvents];
  }

  private async acquireSlot(task: QueuedTaskRecord): Promise<void> {
    if (this.queue.length >= this.policy.maxQueueSize) {
      this.emitTerminal(task, "failed", "queue full");
      throw new SchedulerError("SCHEDULER_QUEUE_BACKPRESSURE", "Task queue full");
    }
    if (this.running < this.policy.maxConcurrency) {
      this.running += 1;
      return;
    }
    await new Promise<void>((resolve, reject) => {
      task.resolveSlot = resolve;
      task.rejectSlot = reject;
      this.queue.push(task);
    });
    this.running += 1;
  }

  private releaseSlot(): void {
    this.running = Math.max(0, this.running - 1);
    const next = this.queue.shift();
    if (next) next.resolveSlot();
  }

  private removeQueued(task: QueuedTaskRecord): void {
    const index = this.queue.indexOf(task);
    if (index >= 0) this.queue.splice(index, 1);
  }

  private emitTerminal(task: QueuedTaskRecord, status: TaskTerminalStatus, reason?: string): void {
    if (task.terminalEmitted) return;
    task.status = status;
    task.terminalEmitted = true;
    this.record(task.scope, status, reason);
  }

  private record(scope: Pick<TaskScope, "id" | "trace">, status: TaskEvent["status"], reason?: string): void {
    const metadata = "metadata" in scope ? (scope as TaskScope).metadata : undefined;
    const event: TaskEvent = {
      taskId: scope.id,
      status,
      at: new Date(0).toISOString(),
      ...(scope.trace ? { trace: scope.trace } : {}),
      ...(metadata ? { metadata } : {}),
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
