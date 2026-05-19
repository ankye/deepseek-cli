import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, TraceContext } from "./common.js";
import type { AuditId, PluginId, SessionId, WorkspaceId } from "./ids.js";
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

export const PLUGIN_PLATFORM_SCHEMA_VERSION = "1.0.0";

export interface PermissionDiff extends JsonObject {
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

export type PluginSourceKind = "built-in" | "workspace" | "user" | "enterprise" | "registry" | "marketplace" | string;

export type PluginApiLevel =
  | "manifest"
  | "declarative-author"
  | "governed-runtime"
  | "host-projection"
  | "test-harness";

export type PluginApiAvailability =
  | "active"
  | "inactive"
  | "experimental"
  | "deprecated"
  | "unsupported"
  | "host-gated";

export type PluginLifecycleState =
  | "discovered"
  | "validated"
  | "resolved"
  | "installed"
  | "enabled"
  | "activated"
  | "degraded"
  | "disabled"
  | "uninstalled"
  | "quarantined"
  | "update-staged"
  | "updated"
  | "rollback-ready"
  | "rolled-back"
  | "health-checked";

export type PluginLifecycleTrigger =
  | "discover"
  | "validate"
  | "resolve-dependencies"
  | "install"
  | "enable"
  | "activate"
  | "degrade"
  | "disable"
  | "uninstall"
  | "quarantine"
  | "stage-update"
  | "apply-update"
  | "prepare-rollback"
  | "rollback"
  | "health-check";

export type PluginContributionKind =
  | "command"
  | "action"
  | "target-resolver"
  | "result-list-provider"
  | "keymap"
  | "palette-entry"
  | "render-hint"
  | "hook"
  | "skill"
  | "tool"
  | "mcp-connector"
  | "agent"
  | "context-provider"
  | "memory-provider"
  | "cache-provider"
  | "workflow-template"
  | "model-profile"
  | "config-fragment"
  | "diagnostics-provider"
  | "resource-bundle"
  | "other";

export type PluginContributionSideEffect =
  | "none"
  | "read"
  | "write"
  | "network"
  | "process"
  | "model"
  | "credential"
  | "host-render"
  | "mixed";

export type PluginProjectionHost = "cli" | "cli-tui" | "json" | "jsonl" | "vscode" | "diagnostics" | string;

export type PluginProjectionVisibility = "visible" | "hidden" | "diagnostics-only" | "inactive";

export type PluginConflictOutcome = "winner" | "hidden" | "degraded" | "rejected" | "requires-override";

export type PluginHealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown" | "inactive" | "timed-out";

export type PluginForbiddenApiKind =
  | "host-callback"
  | "lifecycle-callback"
  | "runtime-handle"
  | "raw-credential-access"
  | "filesystem-primitive"
  | "process-primitive"
  | "network-primitive"
  | "model-provider-client"
  | "runtime-internal-import"
  | "cli-internal-import"
  | "host-layout-mutation"
  | "undeclared-owner-route"
  | "private-execution";

export interface PluginApiCompatibilityMetadata extends CompatibilityMetadata {
  readonly status: PluginApiAvailability;
  readonly apiLevel?: PluginApiLevel;
  readonly ownerSubsystem?: string;
  readonly deprecatedSince?: string;
  readonly replacementPath?: string;
  readonly earliestRemovalVersion?: string;
  readonly affectedHosts?: readonly PluginProjectionHost[];
  readonly activationAllowed?: boolean;
  readonly optInRequired?: boolean;
  readonly inactiveReason?: string;
}

export interface PluginApiLevelUsage extends JsonObject {
  readonly level: PluginApiLevel;
  readonly version: string;
  readonly status: PluginApiAvailability;
  readonly allowed: boolean;
  readonly source: string;
  readonly trust?: TrustStatus;
  readonly compatibility: PluginApiCompatibilityMetadata;
  readonly diagnostics: readonly RedactedError[];
}

export interface PluginApiDiagnostic extends RedactedError {
  readonly apiLevel: PluginApiLevel;
  readonly status: PluginApiAvailability;
  readonly allowed: boolean;
  readonly replacementPath?: string;
  readonly earliestRemovalVersion?: string;
  readonly affectedHosts?: readonly PluginProjectionHost[];
}

export interface PluginForbiddenApiDiagnostic extends PluginApiDiagnostic {
  readonly forbiddenApiKind: PluginForbiddenApiKind;
  readonly path: string;
  readonly guidance: string;
}

export interface PluginHostRequirement extends JsonObject {
  readonly host: PluginProjectionHost;
  readonly minVersion?: string;
  readonly required?: boolean;
  readonly reason?: string;
}

export interface PluginActivationCondition extends JsonObject {
  readonly lifecycleState?: PluginLifecycleState;
  readonly trust?: TrustStatus;
  readonly hosts?: readonly PluginProjectionHost[];
  readonly requiresExplicitOptIn?: boolean;
  readonly expression?: string;
}

export interface PluginActivationPolicy extends JsonObject {
  readonly autoEnable?: boolean;
  readonly activationEvents?: readonly string[];
  readonly conditions?: readonly PluginActivationCondition[];
  readonly healthRequired?: boolean;
}

export interface PluginContributionProjection extends JsonObject {
  readonly visibility: PluginProjectionVisibility;
  readonly hosts: readonly PluginProjectionHost[];
  readonly route?: string;
  readonly surface?: string;
  readonly hostOwnsLayout: boolean;
}

export interface PluginContributionProvenance extends JsonObject {
  readonly pluginId: PluginId;
  readonly pluginVersion: string;
  readonly source: string;
  readonly packId?: string;
  readonly filePath?: string;
  readonly exportedName?: string;
}

export interface PluginContributionDescriptor extends JsonObject {
  readonly id: string;
  readonly kind: PluginContributionKind;
  readonly apiLevel: PluginApiLevel;
  readonly ownerSubsystem: string;
  readonly inputSchema?: JsonObject;
  readonly outputSchema?: JsonObject;
  readonly permissions: readonly string[];
  readonly sideEffect: PluginContributionSideEffect;
  readonly source: string;
  readonly provenance: PluginContributionProvenance;
  readonly compatibility: PluginApiCompatibilityMetadata;
  readonly activation: PluginActivationCondition;
  readonly projection: PluginContributionProjection;
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
  readonly metadata?: JsonObject;
}

export interface PluginContributionCatalogEntry extends JsonObject {
  readonly kind: PluginContributionKind;
  readonly ownerSubsystem: string;
  readonly apiLevel: PluginApiLevel;
  readonly status: PluginApiAvailability;
  readonly sideEffect: PluginContributionSideEffect;
  readonly permissions: readonly string[];
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject;
  readonly defaultProjection: PluginContributionProjection;
  readonly compatibility: PluginApiCompatibilityMetadata;
  readonly activation: PluginActivationCondition;
  readonly diagnostics: readonly RedactedError[];
}

export interface PluginContributionCatalog extends JsonObject {
  readonly schemaVersion: string;
  readonly apiVersion: string;
  readonly entries: readonly PluginContributionCatalogEntry[];
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
}

export interface PluginDependencyDescriptor extends JsonObject {
  readonly pluginId: PluginId;
  readonly versionRange?: string;
  readonly optional?: boolean;
  readonly reason?: string;
}

export interface PluginDependencyEdge extends JsonObject {
  readonly from: PluginId;
  readonly to: PluginId;
  readonly optional: boolean;
  readonly versionRange?: string;
  readonly status: "resolved" | "missing" | "version-mismatch" | "skipped-optional";
}

export interface PluginDependencyResolution extends JsonObject {
  readonly status: "resolved" | "degraded" | "blocked";
  readonly activationOrder: readonly PluginId[];
  readonly edges: readonly PluginDependencyEdge[];
  readonly skippedOptionalEdges: readonly PluginDependencyEdge[];
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
}

export interface PluginContributionReference extends JsonObject {
  readonly pluginId: PluginId;
  readonly contributionId: string;
  readonly kind: PluginContributionKind;
  readonly ownerSubsystem: string;
}

export interface PluginConflictRecord extends JsonObject {
  readonly conflictId: string;
  readonly conflictKind:
    | "command-id"
    | "command-alias"
    | "keymap"
    | "palette-title"
    | "target-resolver"
    | "render-hint"
    | "hook-ordering"
    | "provider-id"
    | "config-fragment"
    | "other";
  readonly winner: PluginContributionReference;
  readonly loser: PluginContributionReference;
  readonly precedenceSource: string;
  readonly affectedHosts: readonly PluginProjectionHost[];
  readonly affectedModes: readonly string[];
  readonly suggestedOverrides: readonly string[];
  readonly outcome: PluginConflictOutcome;
  readonly diagnostics: readonly RedactedError[];
}

export interface PluginHealthProbeDescriptor extends JsonObject {
  readonly id: string;
  readonly kind: "manifest" | "owner-route" | "hook" | "capability" | "custom";
  readonly timeoutMs: number;
  readonly sideEffect: PluginContributionSideEffect;
  readonly permissions: readonly string[];
}

export interface PluginHealthRecord extends JsonObject {
  readonly pluginId: PluginId;
  readonly status: PluginHealthStatus;
  readonly checkedAt: string;
  readonly probes: readonly PluginHealthProbeDescriptor[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface PluginRollbackRecord extends JsonObject {
  readonly pluginId: PluginId;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly reason: string;
  readonly previousLockEntry?: PluginLockfileEntry;
  readonly activationSnapshotId?: string;
  readonly retentionExpiresAt?: string;
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
}

export interface PluginPolicyDecisionSummary extends JsonObject {
  readonly action: "allow" | "ask" | "deny" | "rewrite" | "require-sandbox" | "quarantine" | string;
  readonly reason: string;
  readonly approvalRequired?: boolean;
  readonly audit?: JsonObject;
}

export interface PluginHookDecisionSummary extends JsonObject {
  readonly hookId: string;
  readonly point: string;
  readonly decision: "allow" | "block" | "skip" | "request-rollback" | "diagnostic-only";
  readonly diagnostics: readonly RedactedError[];
  readonly replayFingerprint: string;
}

export interface PluginLifecycleTransition extends JsonObject {
  readonly schemaVersion: string;
  readonly pluginId: PluginId;
  readonly pluginVersion: string;
  readonly source: string;
  readonly trust?: TrustStatus;
  readonly previousState?: PluginLifecycleState;
  readonly nextState: PluginLifecycleState;
  readonly trigger: PluginLifecycleTrigger;
  readonly actor: string;
  readonly reason: string;
  readonly policyDecision: PluginPolicyDecisionSummary;
  readonly permissionDiff?: PermissionDiff;
  readonly authDiff?: ExtensionCredentialRequirementDiff;
  readonly dependencyDecision?: PluginDependencyResolution;
  readonly compatibilityDecision?: PluginApiCompatibilityMetadata;
  readonly hookDecisions: readonly PluginHookDecisionSummary[];
  readonly diagnostics: readonly RedactedError[];
  readonly auditId?: AuditId;
  readonly audit: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly trace?: TraceContext;
  readonly replayFingerprint: string;
}

export interface PluginLifecycleEvent extends JsonObject {
  readonly schemaVersion: string;
  readonly eventId: string;
  readonly kind:
    | "plugin.lifecycle"
    | "plugin.activation"
    | "plugin.projection"
    | "plugin.diagnostic"
    | "plugin.health"
    | "plugin.runtime-request"
    | "plugin.rollback"
    | "plugin.audit";
  readonly at: string;
  readonly pluginId: PluginId;
  readonly pluginVersion?: string;
  readonly source?: string;
  readonly trust?: TrustStatus;
  readonly lifecycle?: PluginLifecycleTransition;
  readonly contribution?: PluginContributionReference;
  readonly diagnostics: readonly RedactedError[];
  readonly auditId?: AuditId;
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface PluginAuditRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly auditId: AuditId;
  readonly at: string;
  readonly pluginId: PluginId;
  readonly action: string;
  readonly actor: string;
  readonly lifecycleState?: PluginLifecycleState;
  readonly eventKind: PluginLifecycleEvent["kind"];
  readonly metadata: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface PluginRuntimeRequestEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly pluginId: PluginId;
  readonly contributionId?: string;
  readonly apiLevel: PluginApiLevel;
  readonly ownerSubsystem: string;
  readonly operation: string;
  readonly status: "completed" | "failed" | "denied" | "skipped" | "requires-approval";
  readonly permissions: readonly string[];
  readonly policyDecision: PluginPolicyDecisionSummary;
  readonly sideEffect: PluginContributionSideEffect;
  readonly diagnostics: readonly RedactedError[];
  readonly auditId?: AuditId;
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface PluginInspectorProjection extends JsonObject {
  readonly schemaVersion: string;
  readonly pluginId: PluginId;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly integrity: string;
  readonly lifecycleState: PluginLifecycleState;
  readonly apiLevels: readonly PluginApiLevelUsage[];
  readonly permissions: readonly string[];
  readonly credentialRequirements: readonly ExtensionCredentialRequirement[];
  readonly dependencies: readonly PluginDependencyDescriptor[];
  readonly conflicts: readonly PluginConflictRecord[];
  readonly health?: PluginHealthRecord;
  readonly auditLinks: readonly string[];
  readonly contributions: readonly PluginContributionDescriptor[];
  readonly ownerExecutionRoutes: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly projection: PluginContributionProjection;
  readonly redaction: RedactionMetadata;
  readonly replayFingerprint: string;
}

export interface PluginManifest {
  readonly id: PluginId;
  readonly name: string;
  readonly version: string;
  readonly source: PluginSourceKind;
  readonly integrity: string;
  readonly permissions: readonly string[];
  readonly credentialRequirements?: readonly ExtensionCredentialRequirement[];
  readonly apiLevels?: readonly PluginApiLevelUsage[];
  readonly compatibility?: PluginApiCompatibilityMetadata;
  readonly dependencies?: readonly PluginDependencyDescriptor[];
  readonly optionalDependencies?: readonly PluginDependencyDescriptor[];
  readonly hostRequirements?: readonly PluginHostRequirement[];
  readonly activation?: PluginActivationPolicy;
  readonly contributions: JsonObject;
}

export interface PluginLockfileEntry extends JsonObject {
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

export interface PluginActivationRecord extends JsonObject {
  readonly schemaVersion: string;
  readonly pluginId: PluginId;
  readonly state: PluginLifecycleState;
  readonly registeredContributions: readonly PluginContributionReference[];
  readonly deniedContributions: readonly PluginContributionReference[];
  readonly ownerExecutionRoutes: readonly string[];
  readonly diagnostics: readonly RedactedError[];
  readonly auditId?: AuditId;
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
