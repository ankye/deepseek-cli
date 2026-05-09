import type { JsonObject, RedactedError, RedactionMetadata, SerializableResult } from "./common.js";
import type { SessionId, WorkspaceId } from "./ids.js";

export interface WorkspaceIdentity {
  readonly id: WorkspaceId;
  readonly roots: readonly string[];
  readonly trusted: boolean;
}

export interface FileSnapshot {
  readonly path: string;
  readonly contentHash: string;
  readonly capturedAt: string;
}

export interface WorkspaceEditTransaction {
  readonly id: string;
  readonly sessionId: SessionId;
  readonly edits: readonly JsonObject[];
  readonly rollback: JsonObject;
}

export type WorkspaceCheckpointStatus = "eligible" | "restored" | "rejected" | "failed";
export type WorkspaceCheckpointRestoreStatus = "restored" | "rejected" | "failed";
export type WorkspaceUndoStatus = WorkspaceCheckpointRestoreStatus;

export interface WorkspaceCheckpointRecord extends JsonObject {
  readonly id: string;
  readonly transactionId: string;
  readonly sessionId: SessionId;
  readonly path: string;
  readonly beforeHash: string;
  readonly afterHash: string;
  readonly status: WorkspaceCheckpointStatus;
  readonly createdAt: string;
  readonly restoredAt?: string;
  readonly diagnostics: readonly RedactedError[];
  readonly provenance: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface WorkspaceCheckpointEvidence extends JsonObject {
  readonly checkpointId: string;
  readonly transactionId: string;
  readonly sessionId: SessionId;
  readonly path: string;
  readonly beforeHash: string;
  readonly afterHash: string;
  readonly status: WorkspaceCheckpointStatus;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
}

export interface WorkspaceTransactionResult extends JsonObject {
  readonly transactionId: string;
  readonly applied: boolean;
  readonly checkpoints: readonly WorkspaceCheckpointEvidence[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
}

export interface WorkspaceRestoreCheckpointRequest extends JsonObject {
  readonly checkpointId: string;
  readonly reason?: string;
}

export interface WorkspaceUndoLatestRequest extends JsonObject {
  readonly sessionId?: SessionId;
  readonly path?: string;
  readonly reason?: string;
}

export interface WorkspaceCheckpointRestoreResult extends JsonObject {
  readonly checkpointId: string;
  readonly transactionId?: string;
  readonly sessionId?: SessionId;
  readonly path?: string;
  readonly status: WorkspaceCheckpointRestoreStatus;
  readonly beforeHash?: string;
  readonly afterHash?: string;
  readonly restoredHash?: string;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
}

export interface WorkspaceUndoLatestResult extends JsonObject {
  readonly status: WorkspaceUndoStatus;
  readonly checkpoint?: WorkspaceCheckpointRestoreResult;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
}

export interface WorkspaceStateManager {
  identify(roots: readonly string[]): Promise<WorkspaceIdentity>;
  snapshot(path: string): Promise<FileSnapshot>;
  transact(transaction: WorkspaceEditTransaction): Promise<WorkspaceTransactionResult>;
  checkpoints(): readonly WorkspaceCheckpointRecord[];
  restoreCheckpoint(request: WorkspaceRestoreCheckpointRequest): Promise<SerializableResult<WorkspaceCheckpointRestoreResult>>;
  undoLatest(request?: WorkspaceUndoLatestRequest): Promise<SerializableResult<WorkspaceUndoLatestResult>>;
}
