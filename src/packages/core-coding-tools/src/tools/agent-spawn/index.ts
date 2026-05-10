import type {
  AgentSpawnRequest,
  AgentSpawner,
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps } from "../../shared/workspace.js";

export interface AgentSpawnToolDeps extends CoreCodingToolsDependencies {
  readonly agentSpawner?: AgentSpawner;
}

export function defineAgentSpawnTool(deps: AgentSpawnToolDeps | undefined) {
  return defineToolManifest(
    "agent.spawn",
    coreToolIds.agentSpawn,
    "Agent Spawn",
    "process",
    ["agent:spawn"],
    objectSchema(["prompt"], {
      prompt: { type: "string" },
      toolProjection: { type: "string" },
      timeoutMs: { type: "number" },
      maxIterations: { type: "number" },
      reason: { type: "string" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => agentSpawnTool(input, context, ready as AgentSpawnToolDeps))
  );
}

async function agentSpawnTool(input: JsonObject, context: CapabilityExecutionContext, deps: AgentSpawnToolDeps): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as AgentSpawnRequest;
  if (!deps.agentSpawner) {
    return failure("agent.spawn", "AGENT_SPAWNER_UNAVAILABLE", "No AgentSpawner registered in runtime dependencies.", []);
  }
  try {
    const result = await deps.agentSpawner.spawn({
      ...parsed,
      toolProjection: parsed.toolProjection ?? "read-only"
    });
    return success("agent.spawn", [String(result.childSessionId)], {
      preview: boundedText(result.assistantText, 16_000),
      metadata: {
        childSessionId: result.childSessionId,
        terminalStatus: result.terminalStatus,
        iterations: result.iterations,
        toolCalls: result.toolCalls,
        diagnostics: result.diagnostics as unknown as JsonObject
      },
      replay: replay(context),
      status: result.terminalStatus === "completed" ? "completed" : "failed"
    });
  } catch (error) {
    return failure("agent.spawn", "AGENT_SPAWN_FAILED", error instanceof Error ? error.message : "Agent spawn failed.", []);
  }
}
