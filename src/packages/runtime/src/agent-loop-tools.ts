import type {
  AgentLoopRequest,
  CapabilityManifest,
  JsonObject,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeToolResultEvidence,
  ToolResultFeedback
} from "@deepseek/platform-contracts";
import { createToolResultEvidence, createToolResultEvidenceCacheEntry } from "@deepseek/memory-cache-management";
import { toolProjectionPolicy } from "./prompt-assembly-integration.js";

export async function recordToolResultEvidence(
  deps: RuntimeDependencies,
  input: {
    readonly toolCallId: string;
    readonly toolName: string;
    readonly capabilityId?: string;
    readonly terminalKind: string;
    readonly feedback: ToolResultFeedback;
  }
): Promise<RuntimeToolResultEvidence> {
  const evidence = createToolResultEvidence(input);
  await deps.cache.set(createToolResultEvidenceCacheEntry(evidence));
  return evidence;
}

export function projectToolSet(
  capabilities: readonly CapabilityManifest[],
  request: AgentLoopRequest
): readonly CapabilityManifest[] {
  const policy = toolProjectionPolicy(request);
  if (policy === "all") return capabilities;
  if (policy === "read-write") {
    return capabilities.filter((manifest) => manifest.sideEffect === "none" || manifest.sideEffect === "read" || manifest.sideEffect === "write");
  }
  return capabilities.filter((manifest) => manifest.sideEffect === "none" || manifest.sideEffect === "read");
}

export interface SkillActivateTerminalMetadata {
  readonly name: string;
  readonly status: string;
  readonly segmentCount: number;
  readonly loadingState: string;
}

export function extractSkillActivateMetadata(terminal: RuntimeEvent): SkillActivateTerminalMetadata | undefined {
  const output = terminal.data?.output;
  if (!output || typeof output !== "object") return undefined;
  const evidence = (output as { evidence?: unknown }).evidence;
  if (!evidence || typeof evidence !== "object") return undefined;
  const metadata = (evidence as { metadata?: unknown }).metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const record = metadata as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : undefined;
  const status = typeof record.status === "string" ? record.status : undefined;
  const segmentCount = typeof record.segmentCount === "number" ? record.segmentCount : undefined;
  const loadingState = typeof record.loadingState === "string" ? record.loadingState : undefined;
  if (!name || !status || segmentCount === undefined || !loadingState) return undefined;
  return { name, status, segmentCount, loadingState };
}

export function asJsonObject(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : undefined;
}
