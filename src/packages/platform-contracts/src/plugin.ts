import type { JsonObject } from "./common.js";
import type { RedactedError, RedactionMetadata } from "./common.js";
import type { PluginId, SessionId, WorkspaceId } from "./ids.js";
import type {
  ExtensionAuthReadinessEvidence,
  ExtensionCredentialAuthorizationResult,
  ExtensionCredentialGrant,
  ExtensionCredentialOperation,
  ExtensionCredentialOwner,
  ExtensionCredentialRequirement,
  ExtensionCredentialRequirementDiff
} from "./extension-auth.js";
import type { TrustStatus } from "./capability.js";

export interface PermissionDiff {
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

export interface PluginManifest {
  readonly id: PluginId;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly integrity: string;
  readonly permissions: readonly string[];
  readonly credentialRequirements?: readonly ExtensionCredentialRequirement[];
  readonly contributions: JsonObject;
}

export interface PluginLockfileEntry {
  readonly pluginId: PluginId;
  readonly version: string;
  readonly source: string;
  readonly integrity: string;
  readonly permissions: readonly string[];
  readonly credentialRequirements?: readonly ExtensionCredentialRequirement[];
  readonly installedAt: string;
}

export interface PluginLockfile {
  readonly version: 1;
  readonly entries: readonly PluginLockfileEntry[];
}

export type IntegrityVerdict =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: "missing" | "mismatch";
      readonly expected: string;
      readonly actual: string;
    };

export class IntegrityMismatchError extends Error {
  readonly name = "IntegrityMismatchError";
  readonly expected: string;
  readonly actual: string;

  constructor(expected: string, actual: string) {
    super(`plugin integrity mismatch: expected ${expected}, actual ${actual}`);
    this.expected = expected;
    this.actual = actual;
  }
}

export interface PluginInstallResult {
  readonly diff: PermissionDiff;
  readonly authDiff?: ExtensionCredentialRequirementDiff;
  readonly authReadiness?: ExtensionAuthReadinessEvidence;
  readonly lockEntry: PluginLockfileEntry;
}

export type PluginContributionKind =
  | "command"
  | "hook"
  | "skill"
  | "mcp-connector"
  | "tool"
  | "workflow-template"
  | "context-provider"
  | "other";

export interface PluginCredentialAuthorizationRequest extends JsonObject {
  readonly pluginId: PluginId;
  readonly contributionId: string;
  readonly contributionKind: PluginContributionKind;
  readonly ownerSubsystem: string;
  readonly owner: ExtensionCredentialOwner;
  readonly requirement: ExtensionCredentialRequirement;
  readonly operation: ExtensionCredentialOperation;
  readonly grants: readonly ExtensionCredentialGrant[];
  readonly trust?: TrustStatus;
  readonly workspaceId?: WorkspaceId;
  readonly sessionId?: SessionId;
}

export type PluginCredentialAuthorizer = (
  request: PluginCredentialAuthorizationRequest,
) => Promise<ExtensionCredentialAuthorizationResult> | ExtensionCredentialAuthorizationResult;

export interface PluginContributionActivationRequest extends JsonObject {
  readonly pluginId: PluginId;
  readonly contributionId: string;
  readonly contributionKind: PluginContributionKind;
  readonly ownerSubsystem: string;
  readonly owner?: ExtensionCredentialOwner;
  readonly credentialRequirements?: readonly ExtensionCredentialRequirement[];
  readonly grants?: readonly ExtensionCredentialGrant[];
  readonly operation?: ExtensionCredentialOperation;
  readonly trust?: TrustStatus;
  readonly workspaceId?: WorkspaceId;
  readonly sessionId?: SessionId;
}

export interface PluginContributionActivationResult extends JsonObject {
  readonly pluginId: PluginId;
  readonly contributionId: string;
  readonly contributionKind: PluginContributionKind;
  readonly ownerSubsystem: string;
  readonly status: "activated" | "denied" | "not-required";
  readonly authorizations: readonly ExtensionCredentialAuthorizationResult[];
  readonly authReadiness?: ExtensionAuthReadinessEvidence;
  readonly diagnostics: readonly RedactedError[];
  readonly referencePitFixtureIds: readonly string[];
  readonly audit: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface PluginManager {
  install(manifest: PluginManifest): Promise<PluginInstallResult>;
  uninstall(id: PluginId): Promise<void>;
  list(): Promise<readonly PluginManifest[]>;
  verify(manifest: PluginManifest): Promise<IntegrityVerdict>;
  snapshot(): Promise<PluginLockfile>;
  applyLockfile(lockfile: PluginLockfile): Promise<ReadonlyArray<PluginInstallResult>>;
  authorizeContributionActivation(request: PluginContributionActivationRequest): Promise<PluginContributionActivationResult>;
}
