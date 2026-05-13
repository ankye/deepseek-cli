import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type {
  FileSnapshot,
  JsonObject,
  PlatformRuntime,
  RedactedError,
  SerializableResult,
  WorkspaceCheckpointRecord,
  WorkspaceCheckpointRestoreResult,
  WorkspaceEditTransaction,
  WorkspaceIdentity,
  WorkspaceRequestRevertResult,
  WorkspaceRevertRequest,
  WorkspaceRestoreCheckpointRequest,
  WorkspaceStateManager,
  WorkspaceTransactionResult,
  WorkspaceUndoLatestRequest,
  WorkspaceUndoLatestResult
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

const CHECKPOINT_SCHEMA_VERSION = "1.0.0";
const deterministicTime = new Date(0).toISOString();

export class InMemoryWorkspaceStateManager implements WorkspaceStateManager {
  private readonly transactions: WorkspaceEditTransaction[] = [];
  private readonly checkpointRecords: (WorkspaceCheckpointRecord & { readonly beforeContent?: string })[] = [];

  constructor(private readonly platform?: PlatformRuntime) {}

  async identify(roots: readonly string[]): Promise<WorkspaceIdentity> {
    return {
      id: asId<"workspace">(`workspace-${createHash("sha1").update(roots.join("|")).digest("hex").slice(0, 8)}`),
      roots,
      trusted: true
    };
  }

  async snapshot(path: string): Promise<FileSnapshot> {
    const content = this.platform
      ? await this.platform.readFile(path).catch(() => "")
      : await readFile(path, "utf8").catch(() => "");
    return {
      path,
      contentHash: hashText(content),
      capturedAt: new Date(0).toISOString()
    };
  }

  async transact(transaction: WorkspaceEditTransaction): Promise<WorkspaceTransactionResult> {
    const checkpoints = transaction.edits
      .map((edit, index) => this.createCheckpoint(transaction, edit, index))
      .filter((checkpoint): checkpoint is WorkspaceCheckpointRecord & { readonly beforeContent: string } => checkpoint !== undefined);
    this.transactions.push(sanitizeTransaction(transaction));
    this.checkpointRecords.push(...checkpoints);
    return {
      transactionId: transaction.id,
      applied: checkpoints.length > 0,
      checkpoints: checkpoints.map(({ beforeContent: _beforeContent, ...checkpoint }) => ({
        checkpointId: checkpoint.id,
        transactionId: checkpoint.transactionId,
        sessionId: checkpoint.sessionId,
        ...(checkpoint.turnId ? { turnId: checkpoint.turnId } : {}),
        ...(checkpoint.requestId ? { requestId: checkpoint.requestId } : {}),
        path: checkpoint.path,
        beforeHash: checkpoint.beforeHash,
        afterHash: checkpoint.afterHash,
        status: checkpoint.status,
        diagnostics: checkpoint.diagnostics,
        redaction: checkpoint.redaction
      })),
      diagnostics: [],
      redaction: { class: "internal", fields: ["checkpoints.path"] }
    };
  }

  records(): readonly WorkspaceEditTransaction[] {
    return [...this.transactions];
  }

  checkpoints(): readonly WorkspaceCheckpointRecord[] {
    return this.checkpointRecords.map(({ beforeContent: _beforeContent, ...checkpoint }) => checkpoint);
  }

  async restoreCheckpoint(request: WorkspaceRestoreCheckpointRequest): Promise<SerializableResult<WorkspaceCheckpointRestoreResult>> {
    const index = this.checkpointRecords.findIndex((checkpoint) => checkpoint.id === request.checkpointId);
    const checkpoint = this.checkpointRecords[index];
    if (!checkpoint) {
      return {
        ok: false,
        error: diagnostic("CHECKPOINT_NOT_FOUND", "Checkpoint was not found."),
        value: restoreResult(request.checkpointId, "rejected", [diagnostic("CHECKPOINT_NOT_FOUND", "Checkpoint was not found.")])
      };
    }
    if (checkpoint.status !== "eligible") {
      const error = diagnostic("CHECKPOINT_NOT_ELIGIBLE", `Checkpoint is ${checkpoint.status}.`);
      return { ok: false, error, value: restoreResult(checkpoint.id, "rejected", [error], checkpoint) };
    }
    if (!this.platform) {
      const error = diagnostic("CHECKPOINT_PLATFORM_UNAVAILABLE", "Checkpoint restore requires an injected platform runtime.");
      return { ok: false, error, value: restoreResult(checkpoint.id, "failed", [error], checkpoint) };
    }
    const current = await this.platform.readFile(checkpoint.path).catch((error: unknown) => errorDiagnostic(error, "CHECKPOINT_READ_FAILED"));
    if (isRedactedError(current)) {
      const failed = { ...checkpoint, status: "failed" as const, diagnostics: [current] };
      this.checkpointRecords[index] = failed;
      return { ok: false, error: current, value: restoreResult(checkpoint.id, "failed", [current], failed) };
    }
    const currentHash = hashText(current);
    if (currentHash !== checkpoint.afterHash) {
      const error = diagnostic("CHECKPOINT_STALE_FILE", "Current file hash does not match checkpoint after hash.");
      return { ok: false, error, value: restoreResult(checkpoint.id, "rejected", [error], checkpoint, currentHash) };
    }
    const writeFailure = await this.platform.writeFile(checkpoint.path, checkpoint.beforeContent ?? "")
      .then(() => undefined)
      .catch((error: unknown) => errorDiagnostic(error, "CHECKPOINT_WRITE_FAILED"));
    if (writeFailure) {
      const failed = { ...checkpoint, status: "failed" as const, diagnostics: [writeFailure] };
      this.checkpointRecords[index] = failed;
      return { ok: false, error: writeFailure, value: restoreResult(checkpoint.id, "failed", [writeFailure], failed, currentHash) };
    }
    const restoredHash = hashText(checkpoint.beforeContent ?? "");
    const restored = { ...checkpoint, status: "restored" as const, restoredAt: deterministicTime };
    this.checkpointRecords[index] = restored;
    return { ok: true, value: restoreResult(checkpoint.id, "restored", [], restored, currentHash, restoredHash) };
  }

  async undoLatest(request: WorkspaceUndoLatestRequest = {}): Promise<SerializableResult<WorkspaceUndoLatestResult>> {
    const checkpoint = [...this.checkpointRecords]
      .reverse()
      .find((candidate) => candidate.status === "eligible" && (!request.sessionId || candidate.sessionId === request.sessionId) && (!request.path || candidate.path === request.path));
    if (!checkpoint) {
      const error = diagnostic("CHECKPOINT_UNDO_EMPTY", "No eligible checkpoint exists for the requested scope.");
      return {
        ok: false,
        error,
        value: {
          status: "rejected",
          diagnostics: [error],
          redaction: { class: "internal" }
        }
      };
    }
    const restored = await this.restoreCheckpoint({ checkpointId: checkpoint.id, reason: request.reason ?? "undo-latest" });
    return {
      ok: restored.ok,
      ...(restored.error ? { error: restored.error } : {}),
      value: {
        status: restored.value?.status ?? "failed",
        ...(restored.value ? { checkpoint: restored.value } : {}),
        diagnostics: restored.value?.diagnostics ?? (restored.error ? [restored.error] : []),
        redaction: { class: "internal", fields: ["checkpoint.path"] }
      }
    };
  }

  async revertRequest(request: WorkspaceRevertRequest): Promise<SerializableResult<WorkspaceRequestRevertResult>> {
    const candidates = this.checkpointRecords.filter((checkpoint) => matchesRevertTarget(checkpoint, request));
    if (candidates.length === 0) {
      const error = diagnostic("CHECKPOINT_REVERT_EMPTY", "No checkpoints match the requested request or turn target.");
      const value = requestRevertResult("rejected", request, [], [error]);
      return { ok: false, error, value };
    }
    if (request.dryRun === true) {
      return { ok: true, value: requestRevertResult("preview", request, candidates.map((checkpoint) => restoreResult(checkpoint.id, "restored", [], checkpoint)), []) };
    }
    const restored: WorkspaceCheckpointRestoreResult[] = [];
    for (const checkpoint of candidates) {
      const result = await this.restoreCheckpoint({ checkpointId: checkpoint.id, reason: request.reason ?? "request-revert" });
      if (result.value) restored.push(result.value);
    }
    const diagnostics = restored.flatMap((checkpoint) => checkpoint.diagnostics);
    const restoredCount = restored.filter((checkpoint) => checkpoint.status === "restored").length;
    const status: WorkspaceRequestRevertResult["status"] =
      restoredCount === candidates.length ? "restored" : restoredCount > 0 ? "partial" : diagnostics.some((entry) => entry.code === "CHECKPOINT_STALE_FILE") ? "rejected" : "failed";
    const value = requestRevertResult(status, request, restored, diagnostics);
    return { ok: status === "restored" || status === "partial", ...(status === "restored" || status === "partial" ? {} : { error: diagnostics[0] ?? diagnostic("CHECKPOINT_REVERT_FAILED", "Request revert failed.") }), value };
  }

  private createCheckpoint(
    transaction: WorkspaceEditTransaction,
    edit: JsonObject,
    index: number
  ): (WorkspaceCheckpointRecord & { readonly beforeContent: string }) | undefined {
    if (edit.applied !== true) return undefined;
    const path = typeof edit.path === "string" ? edit.path : undefined;
    const beforeHash = typeof edit.beforeHash === "string" ? edit.beforeHash : undefined;
    const afterHash = typeof edit.afterHash === "string" ? edit.afterHash : undefined;
    const rollback = transaction.rollback as { readonly content?: unknown; readonly contentHash?: unknown };
    const beforeContent = typeof rollback.content === "string" ? rollback.content : undefined;
    if (!path || !beforeHash || !afterHash || beforeContent === undefined) return undefined;
    const checkpointId = `checkpoint-${hashText(`${transaction.id}:${path}:${index}:${beforeHash}:${afterHash}`)}`;
    return {
      schemaVersion: CHECKPOINT_SCHEMA_VERSION,
      id: checkpointId,
      transactionId: transaction.id,
      sessionId: transaction.sessionId,
      ...(transaction.turnId ? { turnId: transaction.turnId } : {}),
      ...(transaction.requestId ? { requestId: transaction.requestId } : {}),
      path,
      beforeHash,
      afterHash,
      status: "eligible",
      createdAt: deterministicTime,
      diagnostics: [],
      provenance: {
        editIndex: index,
        precondition: typeof edit.precondition === "string" ? edit.precondition : "unknown",
        rollbackHash: typeof rollback.contentHash === "string" ? rollback.contentHash : beforeHash
      },
      redaction: { class: "sensitive", fields: ["path"] },
      beforeContent
    };
  }
}

function sanitizeTransaction(transaction: WorkspaceEditTransaction): WorkspaceEditTransaction {
  return {
    ...transaction,
    rollback: {
      ...transaction.rollback,
      content: undefined,
      privateContent: undefined,
      redaction: { class: "sensitive", fields: ["content", "privateContent"] }
    }
  };
}

function restoreResult(
  checkpointId: string,
  status: WorkspaceCheckpointRestoreResult["status"],
  diagnostics: readonly RedactedError[],
  checkpoint?: WorkspaceCheckpointRecord,
  currentHash?: string,
  restoredHash?: string
): WorkspaceCheckpointRestoreResult {
  return {
    checkpointId,
    ...(checkpoint ? {
      transactionId: checkpoint.transactionId,
      sessionId: checkpoint.sessionId,
      ...(checkpoint.turnId ? { turnId: checkpoint.turnId } : {}),
      ...(checkpoint.requestId ? { requestId: checkpoint.requestId } : {}),
      path: checkpoint.path,
      beforeHash: checkpoint.beforeHash,
      afterHash: checkpoint.afterHash
    } : {}),
    status,
    ...(restoredHash ? { restoredHash } : {}),
    diagnostics,
    metadata: {
      ...(currentHash ? { currentHash } : {})
    },
    redaction: { class: "internal", fields: ["path"] }
  };
}

function matchesRevertTarget(checkpoint: WorkspaceCheckpointRecord, request: WorkspaceRevertRequest): boolean {
  const target = request.target;
  if (target.sessionId && checkpoint.sessionId !== target.sessionId) return false;
  if (target.turnId && checkpoint.turnId !== target.turnId) return false;
  if (target.requestId && checkpoint.requestId !== target.requestId) return false;
  if (target.path && checkpoint.path !== target.path) return false;
  return Boolean(target.sessionId || target.turnId || target.requestId || target.path);
}

function requestRevertResult(
  status: WorkspaceRequestRevertResult["status"],
  request: WorkspaceRevertRequest,
  checkpoints: readonly WorkspaceCheckpointRestoreResult[],
  diagnostics: readonly RedactedError[]
): WorkspaceRequestRevertResult {
  const affectedPaths = uniqueStrings(checkpoints.map((checkpoint) => checkpoint.path).filter((path): path is string => typeof path === "string"));
  const restoredPaths = uniqueStrings(checkpoints.filter((checkpoint) => checkpoint.status === "restored").map((checkpoint) => checkpoint.path).filter((path): path is string => typeof path === "string"));
  const stalePaths = uniqueStrings(checkpoints.filter((checkpoint) => checkpoint.diagnostics.some((entry) => entry.code === "CHECKPOINT_STALE_FILE")).map((checkpoint) => checkpoint.path).filter((path): path is string => typeof path === "string"));
  const nonRestorablePaths = uniqueStrings(checkpoints.filter((checkpoint) => checkpoint.status !== "restored" && !checkpoint.diagnostics.some((entry) => entry.code === "CHECKPOINT_STALE_FILE")).map((checkpoint) => checkpoint.path).filter((path): path is string => typeof path === "string"));
  return {
    status,
    target: request.target,
    eventKind: "workspace.request.reverted",
    checkpoints,
    affectedCheckpointIds: checkpoints.map((checkpoint) => checkpoint.checkpointId),
    affectedPaths,
    restoredPaths,
    stalePaths,
    nonRestorablePaths,
    nonReversibleEffects: [],
    contextProjection: {
      reverted: status !== "rejected" && status !== "failed",
      ...(request.target.turnId ? { targetTurnId: request.target.turnId } : {}),
      ...(request.target.requestId ? { targetRequestId: request.target.requestId } : {}),
      compensatedWorkspaceEffects: restoredPaths
    },
    diagnostics,
    redaction: { class: "internal", fields: ["checkpoints.path", "affectedPaths", "restoredPaths", "stalePaths", "nonRestorablePaths"] }
  };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "public" }
  };
}

function errorDiagnostic(error: unknown, code: string): RedactedError {
  return diagnostic(code, error instanceof Error ? error.message : "Workspace checkpoint operation failed.");
}

function isRedactedError(value: unknown): value is RedactedError {
  return typeof value === "object" && value !== null && "code" in value && "message" in value && "retryable" in value;
}

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
