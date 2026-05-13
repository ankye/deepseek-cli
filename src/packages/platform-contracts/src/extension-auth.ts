import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { CredentialRef, McpServerId, PluginId, SessionId, WorkspaceId } from "./ids.js";
import type { TrustStatus } from "./capability.js";

export const EXTENSION_AUTH_SCHEMA_VERSION = "1.0.0";

export type ExtensionCredentialOwnerKind =
  | "mcp-server"
  | "plugin"
  | "plugin-contribution"
  | "skill"
  | "hook"
  | "extension"
  | "connector"
  | "test";

export type ExtensionCredentialOperation =
  | "resolve"
  | "use-tool"
  | "read-resource"
  | "activate-contribution"
  | "install"
  | "apply-lockfile"
  | "diagnose";

export type ExtensionCredentialGrantStatus = "active" | "revoked" | "expired";

export type ExtensionCredentialDenialReason =
  | "missing"
  | "revoked"
  | "expired"
  | "undeclared"
  | "owner-mismatch"
  | "operation-mismatch"
  | "trust-mismatch"
  | "workspace-mismatch";

export interface ExtensionCredentialOwner extends JsonObject {
  readonly kind: ExtensionCredentialOwnerKind;
  readonly id: string;
  readonly pluginId?: PluginId;
  readonly mcpServerId?: McpServerId;
  readonly contributionId?: string;
  readonly source?: string;
  readonly trust?: TrustStatus;
  readonly metadata?: JsonObject;
}

export interface ExtensionCredentialRequirement extends JsonObject {
  readonly schemaVersion: string;
  readonly requirementId: string;
  readonly credentialRef?: CredentialRef;
  readonly owner: ExtensionCredentialOwner;
  readonly operations: readonly ExtensionCredentialOperation[];
  readonly provider?: string;
  readonly profile?: string;
  readonly workspaceId?: WorkspaceId;
  readonly sessionId?: SessionId;
  readonly trust?: TrustStatus;
  readonly required: boolean;
  readonly reason?: string;
  readonly referencePitFixtureIds?: readonly string[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface ExtensionCredentialGrant extends JsonObject {
  readonly schemaVersion: string;
  readonly grantId: string;
  readonly credentialRef: CredentialRef;
  readonly owner: ExtensionCredentialOwner;
  readonly operations: readonly ExtensionCredentialOperation[];
  readonly trust?: TrustStatus;
  readonly workspaceId?: WorkspaceId;
  readonly sessionId?: SessionId;
  readonly status: ExtensionCredentialGrantStatus;
  readonly expiresAt?: string;
  readonly revokedAt?: string;
  readonly audit: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export interface ExtensionCredentialAuthorizationEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "allowed" | "denied";
  readonly owner: ExtensionCredentialOwner;
  readonly operation: ExtensionCredentialOperation;
  readonly requirementId?: string;
  readonly grantId?: string;
  readonly credentialRef?: CredentialRef;
  readonly reason?: ExtensionCredentialDenialReason;
  readonly diagnostics: readonly RedactedError[];
  readonly referencePitFixtureIds: readonly string[];
  readonly audit: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export type ExtensionCredentialAuthorizationResult =
  | (ExtensionCredentialAuthorizationEvidence & {
      readonly status: "allowed";
      readonly grantId: string;
      readonly credentialRef: CredentialRef;
    })
  | (ExtensionCredentialAuthorizationEvidence & {
      readonly status: "denied";
      readonly reason: ExtensionCredentialDenialReason;
    });

export interface ExtensionCredentialRequirementDiff extends JsonObject {
  readonly added: readonly ExtensionCredentialRequirement[];
  readonly removed: readonly ExtensionCredentialRequirement[];
  readonly unchanged: readonly ExtensionCredentialRequirement[];
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface ExtensionAuthReadinessEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly owner: ExtensionCredentialOwner;
  readonly requirements: readonly ExtensionCredentialRequirement[];
  readonly grants: readonly ExtensionCredentialGrant[];
  readonly authorizations: readonly ExtensionCredentialAuthorizationResult[];
  readonly status: "ready" | "missing-grant" | "denied" | "not-required";
  readonly diagnostics: readonly RedactedError[];
  readonly referencePitFixtureIds: readonly string[];
  readonly audit: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}
