import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, TraceContext } from "./common.js";
import type { ContextGraphNode } from "./context.js";
import type { SessionId, SkillId } from "./ids.js";
import type { TrustStatus } from "./capability.js";

export const SKILL_SCHEMA_VERSION = "1.0.0";

export type SkillSourceKind = "built-in" | "user" | "workspace" | "extension" | "catalog";
export type SkillExecutionMode = "context" | "tool" | "workflow" | "sandboxed-executor";
export type SkillLoadingState = "summary-only" | "loaded" | "inert" | "rejected";
export type SkillActivationTrigger = "explicit" | "profile" | "workflow" | "model-routed" | "context-relevance";

export interface SkillActivationRule extends JsonObject {
  readonly triggers: readonly string[];
  readonly match: "name" | "keyword" | "profile" | "explicit";
}

export interface SkillContextConfig extends JsonObject {
  readonly maxSegments: number;
  readonly maxSegmentChars: number;
  readonly preferredKinds: readonly string[];
}

export interface SkillManifest extends JsonObject {
  readonly schemaVersion?: string;
  readonly id: SkillId;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly trust: TrustStatus;
  readonly activation: readonly string[];
  readonly executionModes: readonly string[];
  readonly permissions: readonly string[];
  readonly description?: string;
  readonly enabled?: boolean;
  readonly compatibility?: CompatibilityMetadata;
  readonly activationRules?: readonly SkillActivationRule[];
  readonly context?: SkillContextConfig;
  readonly redaction?: RedactionMetadata;
  readonly metadata?: JsonObject;
}

export interface SkillContentResource extends JsonObject {
  readonly uri: string;
  readonly label: string;
  readonly content: string;
  readonly mimeType?: string;
}

export interface SkillContent extends JsonObject {
  readonly schemaVersion: string;
  readonly skillId: SkillId;
  readonly instructions: readonly string[];
  readonly examples: readonly string[];
  readonly resources: readonly SkillContentResource[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface SkillSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly id: SkillId;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly trust: TrustStatus;
  readonly enabled: boolean;
  readonly description: string;
  readonly activation: readonly string[];
  readonly executionModes: readonly string[];
  readonly permissions: readonly string[];
  readonly loadingState: SkillLoadingState;
  readonly compatibility: CompatibilityMetadata;
  readonly redaction: RedactionMetadata;
}

export interface SkillValidationResult extends JsonObject {
  readonly schemaVersion: string;
  readonly ok: boolean;
  readonly diagnostics: readonly RedactedError[];
  readonly normalized?: SkillManifest;
  readonly redaction: RedactionMetadata;
}

export interface SkillActivationRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly name: string;
  readonly trigger: SkillActivationTrigger;
  readonly context: JsonObject;
  readonly sessionId?: SessionId;
  readonly trace?: TraceContext;
}

export interface SkillContextSegment extends JsonObject {
  readonly schemaVersion: string;
  readonly skillId: SkillId;
  readonly segmentId: string;
  readonly kind: "instruction" | "example" | "resource";
  readonly content: string;
  readonly priority: number;
  readonly estimatedTokens: number;
  readonly provenance: JsonObject;
  readonly dependencyFingerprints: readonly string[];
  readonly compatibility: CompatibilityMetadata;
  readonly redaction: RedactionMetadata;
}

export interface SkillActivationResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "activated" | "inert" | "rejected" | "not-found";
  readonly manifest?: SkillManifest;
  readonly summary?: SkillSummary;
  readonly contentLoaded: boolean;
  readonly loadingState: SkillLoadingState;
  readonly contextSegments: readonly SkillContextSegment[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export interface SkillContextProjectionRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly name: string;
  readonly sessionId: SessionId;
  readonly trigger: SkillActivationTrigger;
  readonly maxSegments?: number;
  readonly maxSegmentChars?: number;
  readonly trace?: TraceContext;
}

export interface SkillContextProjectionResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: "projected" | "inert" | "rejected" | "not-found";
  readonly summary?: SkillSummary;
  readonly nodes: readonly ContextGraphNode[];
  readonly diagnostics: readonly RedactedError[];
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export interface SkillSystem {
  validateManifest(manifest: SkillManifest): Promise<SkillValidationResult>;
  registerSkill(manifest: SkillManifest): Promise<SkillSummary>;
  listSummaries(): Promise<readonly SkillSummary[]>;
  loadSkill(name: string): Promise<SkillActivationResult>;
  activateSkill(request: SkillActivationRequest): Promise<SkillActivationResult>;
  projectContext(request: SkillContextProjectionRequest): Promise<SkillContextProjectionResult>;
}
