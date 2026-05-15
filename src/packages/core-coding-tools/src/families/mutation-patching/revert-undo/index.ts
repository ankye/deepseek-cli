import type {
  CapabilityExecutionContext,
  CoreCodingToolName,
  CoreToolResult,
  JsonObject,
  SerializableResult,
  SessionId,
  TurnId
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { requireDeps, resolveToolPath } from "../../../shared/workspace.js";

const TOOL_NAME = "revert.undo" as CoreCodingToolName;

interface RevertUndoInput extends JsonObject {
  readonly checkpointId?: string;
  readonly path?: string;
  readonly workspaceRoot?: string;
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly requestId?: string;
  readonly dryRun?: boolean;
  readonly reason?: string;
  readonly limitBytes?: number;
}

export function defineRevertUndoTool(deps: CoreCodingToolsDependencies | undefined) {
  return defineToolManifest(
    TOOL_NAME,
    coreToolIds.revertUndo,
    "Revert Undo",
    "write",
    ["workspace:write"],
    objectSchema([], {
      checkpointId: { type: "string" },
      path: { type: "string" },
      workspaceRoot: { type: "string" },
      sessionId: { type: "string" },
      turnId: { type: "string" },
      requestId: { type: "string" },
      dryRun: { type: "boolean" },
      reason: { type: "string" },
      limitBytes: { type: "number" }
    }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => revertUndoTool(input, context, ready))
  );
}

async function revertUndoTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as RevertUndoInput;
  const resolvedPath = parsed.path ? resolveToolPath(deps, parsed.workspaceRoot, parsed.path) : undefined;
  if (resolvedPath && (!resolvedPath.ok || !resolvedPath.value)) return failure(TOOL_NAME, "PATH_REJECTED", resolvedPath.error?.message ?? "Path rejected.", [String(parsed.path ?? "")]);
  const path = resolvedPath?.value?.path;

  if (parsed.dryRun === true) {
    const checkpoints = previewCheckpoints(deps, parsed, path);
    if (checkpoints.length === 0) return failure(TOOL_NAME, "CHECKPOINT_PREVIEW_EMPTY", "No eligible checkpoint matches the requested undo target.", path ? [path] : []);
    return success(TOOL_NAME, checkpoints.map((checkpoint) => checkpoint.path), {
      preview: boundedText(checkpoints.map((checkpoint) => `${checkpoint.id} ${checkpoint.status} ${checkpoint.path}`).join("\n"), parsed.limitBytes),
      metadata: { dryRun: true, checkpointCount: checkpoints.length, checkpoints },
      replay: replay(context)
    });
  }

  if (parsed.checkpointId) {
    const result = await deps.workspaceState.restoreCheckpoint({ checkpointId: parsed.checkpointId, reason: parsed.reason ?? "revert-undo" });
    if (!result.ok) return failure(TOOL_NAME, result.error?.code ?? "CHECKPOINT_RESTORE_FAILED", result.error?.message ?? "Checkpoint restore failed.", result.value?.path ? [result.value.path] : [], { restore: result.value ?? {} });
    return success(TOOL_NAME, result.value?.path ? [result.value.path] : [], {
      preview: boundedText(`restored ${result.value?.checkpointId ?? parsed.checkpointId}`, parsed.limitBytes),
      metadata: { dryRun: false, restore: result.value ?? {} },
      replay: replay(context)
    });
  }

  if (parsed.requestId || parsed.turnId || parsed.sessionId) {
    const result = await deps.workspaceState.revertRequest({
      target: {
        ...(parsed.sessionId ? { sessionId: parsed.sessionId } : {}),
        ...(parsed.turnId ? { turnId: parsed.turnId } : {}),
        ...(parsed.requestId ? { requestId: parsed.requestId } : {}),
        ...(path ? { path } : {})
      },
      reason: parsed.reason ?? "revert-undo"
    });
    if (!result.ok) return failure(TOOL_NAME, result.error?.code ?? "CHECKPOINT_REVERT_FAILED", result.error?.message ?? "Revert failed.", result.value?.affectedPaths ?? [], { revert: result.value ?? {} });
    return success(TOOL_NAME, result.value?.restoredPaths ?? [], {
      preview: boundedText((result.value?.restoredPaths ?? []).join("\n"), parsed.limitBytes),
      metadata: { dryRun: false, revert: result.value ?? {} },
      replay: replay(context)
    });
  }

  const result = await deps.workspaceState.undoLatest({ ...(path ? { path } : {}), reason: parsed.reason ?? "revert-undo" });
  if (!result.ok) return failure(TOOL_NAME, result.error?.code ?? "CHECKPOINT_UNDO_FAILED", result.error?.message ?? "Undo failed.", result.value?.checkpoint?.path ? [result.value.checkpoint.path] : [], { undo: result.value ?? {} });
  return success(TOOL_NAME, result.value?.checkpoint?.path ? [result.value.checkpoint.path] : [], {
    preview: boundedText(`undo ${result.value?.checkpoint?.checkpointId ?? "latest"}`, parsed.limitBytes),
    metadata: { dryRun: false, undo: result.value ?? {} },
    replay: replay(context)
  });
}

function previewCheckpoints(deps: CoreCodingToolsDependencies, parsed: RevertUndoInput, path: string | undefined) {
  return deps.workspaceState.checkpoints()
    .filter((checkpoint) => checkpoint.status === "eligible")
    .filter((checkpoint) => !parsed.checkpointId || checkpoint.id === parsed.checkpointId)
    .filter((checkpoint) => !parsed.sessionId || checkpoint.sessionId === parsed.sessionId)
    .filter((checkpoint) => !parsed.turnId || checkpoint.turnId === parsed.turnId)
    .filter((checkpoint) => !parsed.requestId || checkpoint.requestId === parsed.requestId)
    .filter((checkpoint) => !path || checkpoint.path === path)
    .slice(0, 50);
}
