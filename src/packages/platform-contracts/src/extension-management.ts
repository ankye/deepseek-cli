import type { JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { ExtensionAuthReadinessEvidence, ExtensionCredentialRequirementDiff } from "./extension-auth.js";

export const EXTENSION_MANAGEMENT_SCHEMA_VERSION = "1.0.0";

export type ExtensionManagementStatus = "completed" | "failed" | "partial" | "skipped";

export type ExtensionManagementCommandKind =
  | "extension.list"
  | "extension.plugin.install"
  | "extension.plugin.verify"
  | "extension.plugin.snapshot"
  | "extension.plugin.apply-lockfile"
  | "extension.skill.list"
  | "extension.skill.activate"
  | "extension.auth.scopes"
  | "extension.mcp.test";

export type ExtensionManagementTargetKind =
  | "extension"
  | "plugin"
  | "plugin-lock-entry"
  | "skill"
  | "mcp-server"
  | "mcp-tool"
  | "mcp-resource"
  | "credential-scope"
  | "contribution";

export interface ExtensionManagementActionHint extends JsonObject {
  readonly action: "inspect" | "activate" | "install" | "verify" | "snapshot" | "apply" | "test" | "diagnose";
  readonly command?: string;
}

export interface ExtensionManagementItem extends JsonObject {
  readonly targetKind: ExtensionManagementTargetKind;
  readonly targetId: string;
  readonly label: string;
  readonly status: ExtensionManagementStatus | "enabled" | "disabled" | "inert" | "connected" | "unavailable";
  readonly summary: string;
  readonly provenance: JsonObject;
  readonly permissions?: readonly string[];
  readonly actionHints: readonly ExtensionManagementActionHint[];
  readonly redaction: RedactionMetadata;
}

export interface ExtensionPermissionDiffRecord extends JsonObject {
  readonly targetId: string;
  readonly added: readonly string[];
  readonly removed: readonly string[];
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ExtensionCredentialScopeDiagnostic extends JsonObject {
  readonly targetId: string;
  readonly ref?: string;
  readonly provider: string;
  readonly profile: string;
  readonly workspace?: string;
  readonly source: string;
  readonly available: boolean;
  readonly status: "available" | "missing" | "denied" | "degraded" | "unavailable";
  readonly audit: JsonObject;
  readonly suggestedActions: readonly string[];
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ExtensionManagementLifecycleRecord extends JsonObject {
  readonly step: string;
  readonly targetId: string;
  readonly status: ExtensionManagementStatus;
  readonly diagnostics: readonly RedactedError[];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
}

export interface ExtensionManagementRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: ExtensionManagementCommandKind;
  readonly status: ExtensionManagementStatus;
  readonly summary: string;
  readonly items: readonly ExtensionManagementItem[];
  readonly permissionDiffs: readonly ExtensionPermissionDiffRecord[];
  readonly authDiffs?: readonly ExtensionCredentialRequirementDiff[];
  readonly authReadiness?: readonly ExtensionAuthReadinessEvidence[];
  readonly credentialScopes: readonly ExtensionCredentialScopeDiagnostic[];
  readonly lifecycle: readonly ExtensionManagementLifecycleRecord[];
  readonly diagnostics: readonly RedactedError[];
  readonly audit: JsonObject;
  readonly referencePitFixtureIds: readonly string[];
  readonly redaction: RedactionMetadata;
}
