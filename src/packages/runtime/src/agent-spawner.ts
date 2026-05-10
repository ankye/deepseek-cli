import type {
  AgentLoopSummary,
  AgentSpawnRequest,
  AgentSpawnResult,
  AgentSpawner,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeKernel
} from "@deepseek/platform-contracts";
import { runAgentLoop, defaultAgentLoopLimits } from "./agent-loop.js";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

export function createAgentSpawner(deps: RuntimeDependencies, kernel: RuntimeKernel, workspaceRoot: string): AgentSpawner {
  return {
    async spawn(request: AgentSpawnRequest): Promise<AgentSpawnResult> {
      const parentSessionId = request.parentSessionId;
      let forkedSessionId = parentSessionId;
      if (parentSessionId) {
        const forked = await deps.sessions.fork({
          parentSessionId,
          reason: request.reason ?? "agent.spawn"
        });
        if (forked.ok && forked.value) forkedSessionId = forked.value.childSessionId;
      }

      const limits = {
        ...defaultAgentLoopLimits,
        maxModelIterations: Math.min(request.maxIterations ?? 8, defaultAgentLoopLimits.maxModelIterations * 2)
      };

      const events: RuntimeEvent[] = [];
      for await (const event of runAgentLoop(deps, kernel, {
        prompt: request.prompt,
        ...(forkedSessionId ? { sessionId: forkedSessionId } : {}),
        caller: "core.agent.spawn",
        workspaceRoot,
        outputMode: "jsonl",
        profile: defaultDeepSeekProfile,
        toolProjection: request.toolProjection ?? "read-only",
        ...(request.timeoutMs ? { timeoutMs: request.timeoutMs } : {}),
        limits
      })) {
        events.push(event);
      }

      const terminal = [...events].reverse().find((event) =>
        event.kind === "agent.loop.completed" || event.kind === "agent.loop.failed" || event.kind === "agent.loop.cancelled"
      );
      const summary = (terminal?.data as AgentLoopSummary | undefined);
      return {
        childSessionId: summary?.sessionId ?? forkedSessionId ?? (parentSessionId as never),
        terminalStatus: (summary?.status ?? "failed") as AgentSpawnResult["terminalStatus"],
        assistantText: String(summary?.assistantText ?? ""),
        iterations: Number(summary?.iterations ?? 0),
        toolCalls: Number(summary?.toolCalls ?? 0),
        diagnostics: summary?.diagnostics ?? []
      };
    }
  };
}
