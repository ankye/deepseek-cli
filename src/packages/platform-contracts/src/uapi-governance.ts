import type { JsonObject, RedactionMetadata } from "./common.js";

export const PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION = "1.0.0";

export type UapiContractSurfaceKind =
  | "dto"
  | "id"
  | "envelope"
  | "event"
  | "error"
  | "manifest"
  | "service-interface";

export type UapiAudience = "runtime" | "host" | "plugin" | "replay" | "session-store" | "future-server" | "internal";

export type UapiPersistenceClass = "ephemeral" | "persisted" | "replayed" | "external-facing";

export type UapiCompatibilityLabel = "additive-default" | "migration-required" | "fail-closed-versioned" | "internal-only";

export type UapiChangeKind = "additive" | "breaking" | "migration-required" | "replay-affecting" | "redaction-affecting";

export type UapiDiagnosticSeverity = "info" | "warning" | "error";

export interface UapiContractSurface extends JsonObject {
  readonly schemaVersion: string;
  readonly id: string;
  readonly modulePath: string;
  readonly kind: UapiContractSurfaceKind;
  readonly exportedNames: readonly string[];
  readonly audiences: readonly UapiAudience[];
  readonly persistence: UapiPersistenceClass;
  readonly compatibility: UapiCompatibilityLabel;
  readonly ownerPackage: "platform-contracts";
  readonly migrationRule: string;
  readonly redaction: RedactionMetadata;
}

export interface UapiMigrationEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly migrationId?: string;
  readonly versionedReader?: boolean;
  readonly failClosedRejection?: boolean;
  readonly migrationTest?: boolean;
  readonly replayEvidence?: boolean;
  readonly redaction: RedactionMetadata;
}

export interface UapiChangeRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly surfaceId: string;
  readonly changeKind: UapiChangeKind;
  readonly description: string;
  readonly evidence?: UapiMigrationEvidence;
  readonly redaction: RedactionMetadata;
}

export interface UapiCompatibilityDiagnostic extends JsonObject {
  readonly code: string;
  readonly severity: UapiDiagnosticSeverity;
  readonly surfaceId: string;
  readonly message: string;
  readonly requiredEvidence: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface UapiChangeAssessment extends JsonObject {
  readonly schemaVersion: string;
  readonly surfaceId: string;
  readonly changeKind: UapiChangeKind;
  readonly status: "pass" | "fail";
  readonly requiredEvidence: readonly string[];
  readonly diagnostics: readonly UapiCompatibilityDiagnostic[];
  readonly redaction: RedactionMetadata;
}

const internalRedaction: RedactionMetadata = { class: "internal" };

export const UAPI_COMPATIBILITY_LABELS = [
  "additive-default",
  "migration-required",
  "fail-closed-versioned",
  "internal-only"
] as const;

export const UAPI_CONTRACT_SURFACES: readonly UapiContractSurface[] = [
  surface("ids", "src/packages/platform-contracts/src/ids.ts", "id", ["SessionId", "TurnId", "TaskId", "TraceId", "CapabilityId", "AgentId"], ["runtime", "host", "plugin", "replay", "session-store"], "persisted", "migration-required", "Renames or format changes require migration tests or fail-closed reader rejection."),
  surface("common-envelope", "src/packages/platform-contracts/src/common.ts", "envelope", ["VersionedEnvelope", "CompatibilityMetadata", "RedactedError", "ValidationResult"], ["runtime", "host", "replay", "future-server"], "external-facing", "fail-closed-versioned", "Envelope, compatibility, and error changes require versioned readers."),
  surface("protocol-envelope", "src/packages/platform-contracts/src/protocol.ts", "envelope", ["ProtocolEnvelope", "ProtocolMessage", "ProtocolRouter"], ["host", "runtime", "future-server"], "external-facing", "fail-closed-versioned", "Protocol changes require additive metadata or version negotiation."),
  surface("runtime-event", "src/packages/platform-contracts/src/runtime.ts", "event", ["RuntimeEvent", "RuntimeEventKind"], ["runtime", "host", "replay", "session-store"], "replayed", "migration-required", "Persisted event shape changes require golden replay evidence."),
  surface("execution-envelope", "src/packages/platform-contracts/src/runtime.ts", "envelope", ["ExecutionEnvelope", "RuntimeKernelRequest", "RuntimeKernelResult"], ["runtime", "replay", "session-store"], "persisted", "migration-required", "Execution envelope changes require migration evidence or fail-closed rejection."),
  surface("kernel-error", "src/packages/platform-contracts/src/runtime.ts", "error", ["KernelError", "KernelErrorCode"], ["runtime", "host", "replay"], "replayed", "migration-required", "Error code changes require stable diagnostic mapping."),
  surface("agent-management", "src/packages/platform-contracts/src/agent.ts", "service-interface", ["AgentManager", "AgentNamespace", "AgentQuotaLimit", "AgentLineageRecord", "AgentScopeEvaluationResult"], ["runtime", "host", "replay"], "replayed", "migration-required", "Agent namespace, quota, and lineage records require replay evidence."),
  surface("session-event", "src/packages/platform-contracts/src/session.ts", "event", ["SessionEvent", "SessionSnapshot", "SessionForkResult"], ["runtime", "session-store", "replay"], "persisted", "migration-required", "Session records require schema version checks and replay fixtures."),
  surface("capability-manifest", "src/packages/platform-contracts/src/capability.ts", "manifest", ["CapabilityManifest", "CapabilityRegistry"], ["runtime", "plugin", "host"], "external-facing", "fail-closed-versioned", "Capability manifest changes require permission and schema compatibility evidence."),
  surface("plugin-manifest", "src/packages/platform-contracts/src/plugin.ts", "manifest", ["PluginManifest", "PluginLockfile", "PluginContribution", "GovernedModuleManifest", "GovernedModulePolicyEvaluation", "GovernedModuleLifecycleRecord"], ["plugin", "host", "runtime"], "external-facing", "fail-closed-versioned", "Plugin and governed module manifest changes require permission diff, policy handoff, lifecycle, and lockfile fixtures."),
  surface("skill-manifest", "src/packages/platform-contracts/src/skill.ts", "manifest", ["SkillManifest", "SkillActivationRecord", "SkillSystem"], ["plugin", "runtime", "replay"], "replayed", "migration-required", "Skill activation records require schema version and replay evidence."),
  surface("hook-manifest", "src/packages/platform-contracts/src/hook.ts", "manifest", ["HookManifest", "HookInvocationRecord", "HookSystem"], ["plugin", "runtime", "replay"], "replayed", "migration-required", "Hook ordering and invocation records require deterministic replay evidence."),
  surface("mcp-manifest", "src/packages/platform-contracts/src/mcp.ts", "manifest", ["McpServerManifest", "McpGateway", "McpToolDescriptor"], ["plugin", "runtime", "host"], "external-facing", "fail-closed-versioned", "MCP transport and tool descriptors require fail-closed compatibility checks."),
  surface("model-gateway", "src/packages/platform-contracts/src/model.ts", "service-interface", ["ModelGateway", "ModelRequest", "ModelStreamEvent", "ModelProfile"], ["runtime", "host", "replay"], "replayed", "migration-required", "Model request and stream changes require replay evidence and provider-neutral compatibility."),
  surface("context-engine", "src/packages/platform-contracts/src/context.ts", "service-interface", ["ContextEngine", "ContextProjectionResult", "ContextNode"], ["runtime", "replay"], "replayed", "migration-required", "Context projection shape changes require cache/replay compatibility evidence."),
  surface("prompt-assembly", "src/packages/platform-contracts/src/prompt-assembly.ts", "service-interface", ["PromptAssembler", "PromptAssemblyRequest", "PromptAssemblyResult"], ["runtime", "replay"], "replayed", "migration-required", "Prompt assembly records require stable fingerprints and replay evidence."),
  surface("readiness-diagnostics", "src/packages/platform-contracts/src/readiness.ts", "dto", ["ReadinessCheck", "DiagnosticsReleaseReadinessEvidence", "ReleaseVerificationSummary"], ["host", "future-server"], "external-facing", "additive-default", "Diagnostics fields should be additive and redacted by default."),
  surface("observability-record", "src/packages/platform-contracts/src/observability.ts", "event", ["ObservabilityRecord", "DiagnosticBundle", "PrivacySettings"], ["runtime", "host", "replay"], "replayed", "migration-required", "Observability and diagnostic bundles require redaction-stable replay evidence."),
  surface("policy-sandbox", "src/packages/platform-contracts/src/policy.ts", "service-interface", ["PolicyEngine", "SandboxRuntime", "PolicyDecision", "PolicyDecisionRecord", "PolicyGateCoverageRecord"], ["runtime", "host"], "external-facing", "fail-closed-versioned", "Policy and sandbox decision changes require fail-closed behavior.")
];

export function listUapiContractSurfaces(): readonly UapiContractSurface[] {
  return UAPI_CONTRACT_SURFACES;
}

export function getUapiContractSurface(surfaceId: string): UapiContractSurface | undefined {
  return UAPI_CONTRACT_SURFACES.find((surface) => surface.id === surfaceId);
}

export function assessUapiChange(change: UapiChangeRequest): UapiChangeAssessment {
  const surface = getUapiContractSurface(change.surfaceId);
  const requiredEvidence = requiredEvidenceFor(change, surface);
  const diagnostics: UapiCompatibilityDiagnostic[] = [];

  if (!surface) {
    diagnostics.push(diagnostic("UAPI_SURFACE_UNKNOWN", "error", change.surfaceId, "Unknown platform-contracts UAPI surface.", ["registered surface inventory"]));
  }

  const evidence = change.evidence;
  const hasVersionDecision = evidence?.versionedReader === true || evidence?.failClosedRejection === true;

  if (requiredEvidence.includes("versioned-reader-or-fail-closed-rejection") && !hasVersionDecision) {
    diagnostics.push(diagnostic("UAPI_VERSION_DECISION_MISSING", "error", change.surfaceId, "Persisted or external-facing UAPI changes require a versioned reader or fail-closed rejection.", ["versioned reader", "fail-closed rejection"]));
  }

  if (requiredEvidence.includes("migration-test") && evidence?.migrationTest !== true) {
    diagnostics.push(diagnostic("UAPI_MIGRATION_TEST_MISSING", "error", change.surfaceId, "Breaking UAPI changes require migration test evidence.", ["migration test"]));
  }

  if (requiredEvidence.includes("replay-evidence") && evidence?.replayEvidence !== true) {
    diagnostics.push(diagnostic("UAPI_REPLAY_EVIDENCE_MISSING", "error", change.surfaceId, "Replay-affecting UAPI changes require golden or replay fixture evidence.", ["golden replay", "contract replay fixture"]));
  }

  return {
    schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
    surfaceId: change.surfaceId,
    changeKind: change.changeKind,
    status: diagnostics.length === 0 ? "pass" : "fail",
    requiredEvidence,
    diagnostics,
    redaction: internalRedaction
  };
}

function surface(
  id: string,
  modulePath: string,
  kind: UapiContractSurfaceKind,
  exportedNames: readonly string[],
  audiences: readonly UapiAudience[],
  persistence: UapiPersistenceClass,
  compatibility: UapiCompatibilityLabel,
  migrationRule: string
): UapiContractSurface {
  return {
    schemaVersion: PLATFORM_CONTRACTS_UAPI_SCHEMA_VERSION,
    id,
    modulePath,
    kind,
    exportedNames,
    audiences,
    persistence,
    compatibility,
    ownerPackage: "platform-contracts",
    migrationRule,
    redaction: internalRedaction
  };
}

function requiredEvidenceFor(change: UapiChangeRequest, surface: UapiContractSurface | undefined): readonly string[] {
  const required = new Set<string>();
  const persisted = surface?.persistence === "persisted" || surface?.persistence === "replayed" || surface?.persistence === "external-facing";
  const breaking = change.changeKind === "breaking" || change.changeKind === "migration-required" || change.changeKind === "redaction-affecting";
  const replayAffecting = change.changeKind === "replay-affecting" || surface?.audiences.includes("replay") === true || surface?.persistence === "replayed";

  if (persisted) required.add("versioned-reader-or-fail-closed-rejection");
  if (breaking) required.add("migration-test");
  if (breaking || replayAffecting) required.add("replay-evidence");

  return [...required].sort();
}

function diagnostic(
  code: string,
  severity: UapiDiagnosticSeverity,
  surfaceId: string,
  message: string,
  requiredEvidence: readonly string[]
): UapiCompatibilityDiagnostic {
  return {
    code,
    severity,
    surfaceId,
    message,
    requiredEvidence,
    redaction: internalRedaction
  };
}
