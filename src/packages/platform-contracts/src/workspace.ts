import type { JsonObject } from "./common.js";
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

export interface WorkspaceStateManager {
  identify(roots: readonly string[]): Promise<WorkspaceIdentity>;
  snapshot(path: string): Promise<FileSnapshot>;
  transact(transaction: WorkspaceEditTransaction): Promise<void>;
}
