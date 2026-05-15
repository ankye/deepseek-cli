import type {
  AgentSpawner,
  AgentStopRequest,
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { requireDeps } from "../../../shared/workspace.js";

export interface AgentStopToolDeps extends CoreCodingToolsDependencies {
  readonly agentSpawner?: AgentSpawner;
}

export function defineAgentStopTool(deps: AgentStopToolDeps | undefined) {
  return defineToolManifest(
    "agent.stop",
    coreToolIds.agentStop,
    "Agent Stop",
    "process",
    ["agent:stop"],
    objectSchema(["workerInstanceId"], {
      workerInstanceId: { type: "string" },
      parentSessionId: { type: "string" },
      parentAgentId: { type: "string" },
      workOrderId: { type: "string" },
      stopReason: { type: "string" },
      reason: { type: "string" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => agentStopTool(input, context, ready as AgentStopToolDeps))
  );
}

async function agentStopTool(input: JsonObject, context: CapabilityExecutionContext, deps: AgentStopToolDeps): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as AgentStopRequest;
  if (!deps.agentSpawner?.stop) {
    return failure("agent.stop", "AGENT_STOP_UNAVAILABLE", "No AgentSpawner stop handler registered in runtime dependencies.", []);
  }
  try {
    const result = await deps.agentSpawner.stop({
      ...parsed,
      ...(parsed.parentSessionId ?? context.envelope.sessionId ? { parentSessionId: parsed.parentSessionId ?? context.envelope.sessionId } : {})
    });
    return success("agent.stop", [String(result.workerSessionId)], {
      preview: boundedText(result.workerResult.summary, 16_000),
      metadata: {
        workerInstanceId: result.workerInstanceId,
        workerSessionId: result.workerSessionId,
        workerAgentId: result.workerAgentId,
        workOrderId: result.workOrderId,
        lifecycleState: result.lifecycleState,
        status: result.status,
        stopReason: result.stopReason,
        usage: result.usage,
        resultProvenance: result.resultProvenance,
        workerResult: result.workerResult as unknown as JsonObject,
        diagnostics: result.diagnostics as unknown as JsonObject
      },
      replay: replay(context),
      status: "completed"
    });
  } catch (error) {
    return failure("agent.stop", "AGENT_STOP_FAILED", error instanceof Error ? error.message : "Agent stop failed.", []);
  }
}
