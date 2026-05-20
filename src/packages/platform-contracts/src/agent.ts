import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata } from "./common.js";
import type { AgentModeBinding, AgentModeName, AgentProductRole } from "./agent-mode.js";
import type { AgentId, AgentInstanceId, ModelProfileId, SessionId } from "./ids.js";
import type { PolicyDecisionRecord } from "./policy.js";

export const AGENT_SCHEMA_VERSION = "1.0.0";
export const AGENT_NAMESPACE_SCHEMA_VERSION = "1.0.0";

export type AgentSource = "built-in" | "user" | "workspace" | "extension" | "plugin";
export type AgentInstanceStatus = "idle" | "running" | "interrupted" | "stopped" | "completed" | "failed" | "disposed";
export type AgentLifecycleState = "spawned" | "running" | "continued" | "stopped" | "resumed" | "completed" | "failed" | "disposed";
export type AgentLifecycleTransitionKind = "spawn" | "continue" | "stop" | "resume" | "complete" | "fail" | "dispose";
export type AgentNamespacePathAccess = "read" | "write" | "execute";
export type AgentNamespaceToolAccess = "allow" | "deny";
export type AgentNamespaceMemoryAccess = "none" | "read" | "write" | "read-write";
export type AgentNamespaceNetworkAccess = "none" | "scoped" | "any";
export type AgentQuotaKind = "tokens" | "tool-calls" | "wall-clock-ms" | "retries" | "file-mutations";
export type AgentLineageAuthority = "root" | "inherited" | "narrowed" | "policy-expanded";
export type AgentScopeDiagnosticSeverity = "info" | "warning" | "error" | "release-blocking";
export type AgentScopeDiagnosticCategory = "namespace" | "quota" | "lineage" | "policy" | "cancellation";
export type AgentScopeOperation = "file.read" | "file.write" | "tool.call" | "quota.consume" | "namespace.expand" | "lifecycle.cancel";
export type AgentScopeEvaluationStatus = "allowed" | "denied" | "requires-policy" | "quota-exhausted" | "orphaned" | "cancelled";

export interface AgentNamespacePathRule extends JsonObject {
  readonly path: string;
  readonly access: readonly AgentNamespacePathAccess[];
  readonly recursive: boolean;
}

export interface AgentNamespaceToolRule extends JsonObject {
  readonly tool: string;
  readonly access: AgentNamespaceToolAccess;
}

export interface AgentNamespaceMemoryRule extends JsonObject {
  readonly scope: string;
  readonly access: AgentNamespaceMemoryAccess;
}

export interface AgentNamespaceScratchpadRule extends JsonObject {
  readonly scopeId: string;
  readonly maxBytes: number;
  readonly persistence: "ephemeral" | "session" | "checkpointed";
}

export interface AgentNamespaceCheckpointRule extends JsonObject {
  readonly policy: "none" | "read" | "create" | "restore";
  readonly maxCheckpoints: number;
}

export interface AgentNamespaceEnvironmentRule extends JsonObject {
  readonly cwd: string;
  readonly allowedEnvKeys: readonly string[];
  readonly redactedEnvKeys: readonly string[];
  readonly network: AgentNamespaceNetworkAccess;
}

export interface AgentQuotaLimit extends JsonObject {
  readonly kind: AgentQuotaKind;
  readonly limit: number;
  readonly consumed: number;
  readonly remaining: number;
}

export interface AgentLineageRecord extends JsonObject {
  readonly schemaVersion: typeof AGENT_NAMESPACE_SCHEMA_VERSION;
  readonly lineageId: string;
  readonly ownerAgentId?: AgentId;
  readonly parentAgentId?: AgentId;
  readonly parentAgentInstanceId?: AgentInstanceId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly workOrderId?: string;
  readonly delegatedScopeHash: string;
  readonly outputOwnerAgentId?: AgentId;
  readonly mergeResponsibility: "parent" | "coordinator" | "manual";
  readonly authority: AgentLineageAuthority;
  readonly policyDecisionId?: string;
  readonly repairAuthority: "none" | "diagnose-only" | "bounded-write";
  readonly verifierAuthority: "none" | "read-only" | "test-runner";
  readonly redaction: RedactionMetadata;
}

export interface AgentScopeDiagnostic extends JsonObject {
  readonly code: string;
  readonly severity: AgentScopeDiagnosticSeverity;
  readonly category: AgentScopeDiagnosticCategory;
  readonly message: string;
  readonly namespaceId?: string;
  readonly quotaKind?: AgentQuotaKind;
  readonly releaseBlocking: boolean;
  readonly redaction: RedactionMetadata;
}

export interface AgentNamespace extends JsonObject {
  readonly schemaVersion: typeof AGENT_NAMESPACE_SCHEMA_VERSION;
  readonly namespaceId: string;
  readonly mode: AgentModeName;
  readonly paths: readonly AgentNamespacePathRule[];
  readonly tools: readonly AgentNamespaceToolRule[];
  readonly memory: readonly AgentNamespaceMemoryRule[];
  readonly scratchpad: AgentNamespaceScratchpadRule;
  readonly checkpoints: AgentNamespaceCheckpointRule;
  readonly environment: AgentNamespaceEnvironmentRule;
  readonly quotas: readonly AgentQuotaLimit[];
  readonly lineage: AgentLineageRecord;
  readonly diagnostics: readonly AgentScopeDiagnostic[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentNamespaceProjectionOptions extends JsonObject {
  readonly parentAgentId?: AgentId;
  readonly parentAgentInstanceId?: AgentInstanceId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly workOrderId?: string;
  readonly delegatedPaths?: readonly string[];
  readonly delegatedTools?: readonly string[];
  readonly quotas?: readonly AgentQuotaLimit[];
  readonly outputOwnerAgentId?: AgentId;
  readonly mergeResponsibility?: AgentLineageRecord["mergeResponsibility"];
  readonly policyDecision?: PolicyDecisionRecord;
}

export interface AgentScopeEvaluationRequest extends JsonObject {
  readonly namespace: AgentNamespace;
  readonly operation: AgentScopeOperation;
  readonly path?: string;
  readonly tool?: string;
  readonly quotaKind?: AgentQuotaKind;
  readonly requested?: number;
  readonly consumed?: number;
  readonly requestedNamespace?: AgentNamespace;
  readonly parentNamespace?: AgentNamespace;
  readonly policyDecision?: PolicyDecisionRecord;
  readonly reason?: string;
}

export interface AgentScopeEvaluationResult extends JsonObject {
  readonly schemaVersion: typeof AGENT_NAMESPACE_SCHEMA_VERSION;
  readonly status: AgentScopeEvaluationStatus;
  readonly namespaceId: string;
  readonly operation: AgentScopeOperation;
  readonly allowed: boolean;
  readonly policyRequired: boolean;
  readonly diagnostics: readonly AgentScopeDiagnostic[];
  readonly policyDecision?: PolicyDecisionRecord;
  readonly redaction: RedactionMetadata;
}

export interface AgentScopeGovernanceFixture extends JsonObject {
  readonly schemaVersion: typeof AGENT_NAMESPACE_SCHEMA_VERSION;
  readonly fixtureId: string;
  readonly scenario: "allowed-write" | "denied-write" | "quota-exhaustion" | "cancellation" | "repair-scope";
  readonly namespace: AgentNamespace;
  readonly operation: AgentScopeEvaluationRequest;
  readonly result: AgentScopeEvaluationResult;
  readonly redaction: RedactionMetadata;
}

export interface AgentScopes extends JsonObject {
  readonly capabilities: readonly string[];
  readonly context: readonly string[];
  readonly memory: readonly string[];
  readonly policy: readonly string[];
  readonly skills: readonly string[];
  readonly commands: readonly string[];
  readonly hooks: readonly string[];
  readonly mcp?: readonly string[];
  readonly modelProfiles?: readonly string[];
  readonly hostCapabilities?: readonly string[];
}

export interface AgentDelegationMetadata extends JsonObject {
  readonly canDelegate: boolean;
  readonly acceptsDelegation: boolean;
  readonly maxWorkers?: number;
  readonly allowedChildModes: readonly AgentModeName[];
  readonly requiredWorkOrderFields: readonly string[];
  readonly resultRouting: "structured-event" | "direct";
}

export interface AgentCompatibilityMetadata extends JsonObject {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly supportedAgentModes: readonly AgentModeName[];
  readonly defaultAgentMode: AgentModeName;
  readonly modeContractVersion: string;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentDefinition {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly id: AgentId;
  readonly name: string;
  readonly version: string;
  readonly source: AgentSource;
  readonly modelProfileId: ModelProfileId;
  readonly promptProfile: string;
  readonly productRole: AgentProductRole;
  readonly defaultAgentMode: AgentModeName;
  readonly supportedAgentModes: readonly AgentModeName[];
  readonly scopes: AgentScopes;
  readonly delegation?: AgentDelegationMetadata;
  readonly metadata?: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: AgentCompatibilityMetadata;
}

export interface AgentCreateInstanceOptions extends JsonObject {
  readonly mode?: AgentModeName;
  readonly productRole?: AgentProductRole;
  readonly parentAgentId?: AgentId;
  readonly parentAgentInstanceId?: AgentInstanceId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly workOrderId?: string;
  readonly delegationDecisionId?: string;
  readonly continuationOf?: AgentInstanceId;
  readonly scopeProjection?: AgentScopes;
  readonly namespace?: AgentNamespace;
  readonly lifecycleState?: AgentLifecycleState;
  readonly metadata?: JsonObject;
}

export interface AgentLifecycleRecord extends JsonObject {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly lifecycleEventId: string;
  readonly instanceId: AgentInstanceId;
  readonly transition: AgentLifecycleTransitionKind;
  readonly previousStatus: AgentInstanceStatus;
  readonly nextStatus: AgentInstanceStatus;
  readonly previousLifecycleState: AgentLifecycleState;
  readonly nextLifecycleState: AgentLifecycleState;
  readonly workOrderId?: string;
  readonly reason?: string;
  readonly at: string;
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentLifecycleTransitionRequest extends JsonObject {
  readonly transition: AgentLifecycleTransitionKind;
  readonly workOrderId?: string;
  readonly reason?: string;
  readonly at?: string;
  readonly metadata?: JsonObject;
}

export interface AgentInstance {
  readonly schemaVersion: typeof AGENT_SCHEMA_VERSION;
  readonly id: AgentInstanceId;
  readonly definition: AgentDefinition;
  readonly sessionId: SessionId;
  readonly status: AgentInstanceStatus;
  readonly lifecycleState: AgentLifecycleState;
  readonly mode: AgentModeName;
  readonly productRole: AgentProductRole;
  readonly modeBinding: AgentModeBinding;
  readonly parentAgentId?: AgentId;
  readonly parentAgentInstanceId?: AgentInstanceId;
  readonly parentSessionId?: SessionId;
  readonly childSessionId?: SessionId;
  readonly workOrderId?: string;
  readonly delegationDecisionId?: string;
  readonly continuationOf?: AgentInstanceId;
  readonly scopes: AgentScopes;
  readonly namespace?: AgentNamespace;
  readonly lifecycleEvents: readonly AgentLifecycleRecord[];
  readonly metadata?: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface AgentManager {
  register(definition: AgentDefinition): Promise<void>;
  getDefault(): Promise<AgentDefinition>;
  createInstance(definitionId: AgentId, sessionId: SessionId, options?: AgentCreateInstanceOptions): Promise<AgentInstance>;
  getInstance(instanceId: AgentInstanceId): Promise<AgentInstance | undefined>;
  listDefinitions(): Promise<readonly AgentDefinition[]>;
  validateDefinition(definition: AgentDefinition): Promise<readonly RedactedError[]>;
  projectScopes(definitionId: AgentId, mode: AgentModeName): Promise<AgentScopes>;
  projectNamespace(definitionId: AgentId, mode: AgentModeName, options?: AgentNamespaceProjectionOptions): Promise<AgentNamespace>;
  evaluateScope(request: AgentScopeEvaluationRequest): Promise<AgentScopeEvaluationResult>;
  transitionInstance(instanceId: AgentInstanceId, request: AgentLifecycleTransitionRequest): Promise<AgentInstance>;
}

export const AGENT_COMPATIBILITY: CompatibilityMetadata = {
  schemaVersion: AGENT_SCHEMA_VERSION,
  minReaderVersion: "1.0.0"
};
