import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { TrustStatus } from "./capability.js";

export const COMMAND_COMPOSITION_SCHEMA_VERSION = "1.0.0";

export type CommandCompositionContributionKind =
  | "command"
  | "skill"
  | "hook"
  | "mcp-prompt"
  | "mcp-tool"
  | "plugin-command"
  | "extension-command"
  | "workflow"
  | "renderer-hint";

export type CommandCompositionOwnerSubsystem =
  | "command-system"
  | "skill-system"
  | "hook-system"
  | "mcp-gateway"
  | "plugin-system"
  | "extension-system"
  | "workflow-orchestration"
  | "runtime"
  | "host"
  | string;

export type CommandCompositionSourceKind =
  | "built-in"
  | "core"
  | "user"
  | "workspace"
  | "extension"
  | "plugin"
  | "mcp"
  | "catalog"
  | "test"
  | string;

export type CommandCompositionSideEffect =
  | "none"
  | "read"
  | "write"
  | "network"
  | "process"
  | "runtime-control"
  | "host-lifecycle"
  | "host-render"
  | "session-control"
  | "workspace-metadata"
  | string;

export type CommandCompositionTargetKind =
  | "command"
  | "skill"
  | "hook"
  | "mcp-prompt"
  | "mcp-tool"
  | "plugin-command"
  | "extension-command"
  | "workflow"
  | "renderer-hint";

export type CommandCompositionProjectionScope = "user-visible" | "host-visible" | "model-visible" | "result-list";

export type CommandCompositionDiagnosticCode =
  | "COMPOSITION_ALIAS_COLLISION"
  | "COMPOSITION_NAME_COLLISION"
  | "COMPOSITION_MODEL_VISIBILITY_REJECTED"
  | "COMPOSITION_SCHEMA_VERSION_MISSING"
  | "COMPOSITION_RECORD_INVALID";

export interface CommandCompositionSource extends JsonObject {
  readonly kind: CommandCompositionSourceKind;
  readonly id?: string;
  readonly name?: string;
  readonly version?: string;
  readonly trust?: TrustStatus;
  readonly integrity?: string;
  readonly pluginId?: string;
  readonly extensionId?: string;
  readonly metadata?: JsonObject;
}

export interface CommandCompositionTarget extends JsonObject {
  readonly kind: CommandCompositionTargetKind;
  readonly id: string;
}

export interface CommandCompositionProjection extends JsonObject {
  readonly userVisible?: boolean;
  readonly hostVisible?: boolean;
  readonly modelVisible?: boolean;
  readonly resultListVisible?: boolean;
  readonly hostOnly?: boolean;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
  readonly group?: string;
  readonly order?: number;
  readonly metadata?: JsonObject;
}

export interface CommandCompositionRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly id: string;
  readonly kind: CommandCompositionContributionKind;
  readonly ownerSubsystem: CommandCompositionOwnerSubsystem;
  readonly source: CommandCompositionSource;
  readonly target: CommandCompositionTarget;
  readonly displayName: string;
  readonly aliases: readonly string[];
  readonly description?: string;
  readonly modes?: readonly string[];
  readonly hostSupport?: readonly string[];
  readonly permissions: readonly string[];
  readonly sideEffect: CommandCompositionSideEffect;
  readonly inputSchema?: JsonObject;
  readonly outputSchema?: JsonObject;
  readonly projection: CommandCompositionProjection;
  readonly provenance: JsonObject;
  readonly compatibility: CompatibilityMetadata;
  readonly redaction: RedactionMetadata;
  readonly referencePitFixtureIds: readonly string[];
  readonly metadata?: JsonObject;
}

export interface CommandCompositionContribution extends JsonObject {
  readonly schemaVersion?: string;
  readonly id?: string;
  readonly kind: CommandCompositionContributionKind;
  readonly ownerSubsystem: CommandCompositionOwnerSubsystem;
  readonly source: CommandCompositionSource;
  readonly target: CommandCompositionTarget;
  readonly displayName: string;
  readonly aliases?: readonly string[];
  readonly description?: string;
  readonly modes?: readonly string[];
  readonly hostSupport?: readonly string[];
  readonly permissions?: readonly string[];
  readonly sideEffect?: CommandCompositionSideEffect;
  readonly inputSchema?: JsonObject;
  readonly outputSchema?: JsonObject;
  readonly projection?: CommandCompositionProjection;
  readonly provenance?: JsonObject;
  readonly compatibility?: CompatibilityMetadata;
  readonly redaction?: RedactionMetadata;
  readonly referencePitFixtureIds?: readonly string[];
  readonly metadata?: JsonObject;
}

export interface CommandCompositionDiagnostic extends RedactedError {
  readonly code: CommandCompositionDiagnosticCode;
  readonly severity: "info" | "warning" | "error";
  readonly scope?: CommandCompositionProjectionScope;
  readonly targetIds: readonly string[];
  readonly token?: string;
}

export interface CommandCompositionProjectionResult extends JsonObject {
  readonly schemaVersion: string;
  readonly scope: CommandCompositionProjectionScope;
  readonly ok: boolean;
  readonly records: readonly CommandCompositionRecord[];
  readonly diagnostics: readonly CommandCompositionDiagnostic[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}
