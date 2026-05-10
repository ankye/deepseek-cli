import { spawn, type ChildProcess } from "node:child_process";
import type {
  BackgroundTaskManager,
  BackgroundTaskOutput,
  BackgroundTaskSummary
} from "@deepseek/platform-contracts";

interface StoredTask {
  readonly summary: BackgroundTaskSummary;
  readonly child: ChildProcess;
  stdout: Buffer;
  stderr: Buffer;
  status: BackgroundTaskSummary["status"];
  exitCode: number | undefined;
  done: boolean;
}

function makeTaskId(counter: number): string {
  return `bg-task-${counter}-${Date.now().toString(36)}`;
}

export class NodeBackgroundTaskManager implements BackgroundTaskManager {
  private readonly tasks = new Map<string, StoredTask>();
  private counter = 0;

  async start(input: { readonly command: string; readonly args: readonly string[]; readonly cwd: string }): Promise<BackgroundTaskSummary> {
    this.counter += 1;
    const taskId = makeTaskId(this.counter);
    const child = spawn(input.command, [...input.args], {
      cwd: input.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    const stored: StoredTask = {
      summary: {
        taskId,
        command: input.command,
        args: [...input.args],
        cwd: input.cwd,
        startedAt: new Date().toISOString(),
        status: "running",
        done: false
      },
      child,
      stdout: Buffer.alloc(0),
      stderr: Buffer.alloc(0),
      status: "running",
      exitCode: undefined,
      done: false
    };
    child.stdout?.on("data", (chunk: Buffer) => { stored.stdout = Buffer.concat([stored.stdout, chunk]); });
    child.stderr?.on("data", (chunk: Buffer) => { stored.stderr = Buffer.concat([stored.stderr, chunk]); });
    child.once("exit", (code, signal) => {
      stored.done = true;
      stored.exitCode = typeof code === "number" ? code : undefined;
      stored.status = signal ? "killed" : code === 0 ? "exited" : code === null ? "failed" : "exited";
    });
    child.once("error", () => {
      stored.done = true;
      stored.status = "failed";
    });
    this.tasks.set(taskId, stored);
    return stored.summary;
  }

  async output(input: { readonly taskId: string; readonly stdoutOffset?: number; readonly stderrOffset?: number }): Promise<BackgroundTaskOutput> {
    const stored = this.tasks.get(input.taskId);
    if (!stored) throw new Error(`BACKGROUND_TASK_NOT_FOUND: ${input.taskId}`);
    const stdoutOffset = Math.max(0, input.stdoutOffset ?? 0);
    const stderrOffset = Math.max(0, input.stderrOffset ?? 0);
    const stdout = stored.stdout.slice(stdoutOffset).toString("utf8");
    const stderr = stored.stderr.slice(stderrOffset).toString("utf8");
    return {
      taskId: input.taskId,
      stdout,
      stderr,
      stdoutOffset: stored.stdout.length,
      stderrOffset: stored.stderr.length,
      done: stored.done,
      ...(stored.exitCode !== undefined ? { exitCode: stored.exitCode } : {}),
      status: stored.status
    };
  }

  async kill(input: { readonly taskId: string }): Promise<BackgroundTaskSummary> {
    const stored = this.tasks.get(input.taskId);
    if (!stored) throw new Error(`BACKGROUND_TASK_NOT_FOUND: ${input.taskId}`);
    if (!stored.done) {
      stored.child.kill("SIGTERM");
      await Promise.race([
        new Promise<void>((resolve) => stored.child.once("exit", () => resolve())),
        new Promise<void>((resolve) => setTimeout(resolve, 2000))
      ]);
      if (!stored.done) stored.child.kill("SIGKILL");
    }
    return { ...stored.summary, status: stored.status, done: stored.done, ...(stored.exitCode !== undefined ? { exitCode: stored.exitCode } : {}) };
  }

  async list(): Promise<readonly BackgroundTaskSummary[]> {
    return [...this.tasks.values()].map((stored) => ({
      ...stored.summary,
      status: stored.status,
      done: stored.done,
      ...(stored.exitCode !== undefined ? { exitCode: stored.exitCode } : {})
    }));
  }

  async disposeAll(): Promise<void> {
    for (const stored of this.tasks.values()) {
      if (stored.done) continue;
      stored.child.kill("SIGTERM");
    }
    await Promise.race([
      Promise.all([...this.tasks.values()].map((stored) => new Promise<void>((resolve) => {
        if (stored.done) resolve();
        else stored.child.once("exit", () => resolve());
      }))),
      new Promise<void>((resolve) => setTimeout(resolve, 2000))
    ]);
    for (const stored of this.tasks.values()) {
      if (!stored.done) stored.child.kill("SIGKILL");
    }
  }
}
