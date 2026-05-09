import type { CompatibilityMetadata, JsonObject, RedactionMetadata, TraceContext } from "./common.js";

export const OBSERVABILITY_SCHEMA_VERSION = "1.0.0";

export type ObservabilityEventKind = "log" | "metric" | "trace" | "audit" | "usage" | "bus" | "task";
export type ObservabilityDataPrivacyClass = "none" | "local" | "sensitive" | "secret" | "regulated";
export type ObservabilityPersistenceScope = "none" | "memory" | "local-diagnostics" | "diagnostic-bundle";
export type ObservabilityExportTarget = "local-bundle" | "external-telemetry" | "support-upload";
export type ObservabilityPrivacyDecisionAction = "allow-local" | "allow-export" | "deny-export" | "drop";

export interface ObservabilityEvent extends JsonObject {
  readonly kind: ObservabilityEventKind;
  readonly at: string;
  readonly name: string;
  readonly fields: JsonObject;
  readonly trace?: TraceContext;
  readonly dataPrivacyClass?: ObservabilityDataPrivacyClass;
  readonly redaction?: RedactionMetadata;
  readonly persistence?: ObservabilityPersistencePolicy;
  readonly compatibility?: CompatibilityMetadata;
}

export interface ObservabilityPersistencePolicy extends JsonObject {
  readonly scope: ObservabilityPersistenceScope;
  readonly retainLocal: boolean;
  readonly allowExport: boolean;
  readonly ttlMs?: number;
}

export interface PrivacySettings extends JsonObject {
  readonly schemaVersion: string;
  readonly localDiagnosticsEnabled: boolean;
  readonly telemetryEnabled: boolean;
  readonly allowExternalExport: boolean;
  readonly maxLocalRecords: number;
  readonly redaction: RedactionMetadata;
}

export interface ObservabilityExportPolicy extends JsonObject {
  readonly target: ObservabilityExportTarget;
  readonly allowSensitive: boolean;
  readonly allowSecret: boolean;
  readonly requireTelemetryEnabled: boolean;
  readonly requireExplicitExternalExport: boolean;
}

export interface ObservabilityPrivacyDecision extends JsonObject {
  readonly schemaVersion: string;
  readonly action: ObservabilityPrivacyDecisionAction;
  readonly target: ObservabilityExportTarget;
  readonly reasonCode: string;
  readonly localDiagnosticsRetained: boolean;
  readonly exportAllowed: boolean;
  readonly redaction: RedactionMetadata;
}

export interface ObservabilityRedactionSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly redactedFields: readonly string[];
  readonly secretLikeFields: readonly string[];
  readonly redactedValueCount: number;
  readonly highestPrivacyClass: ObservabilityDataPrivacyClass;
  readonly redaction: RedactionMetadata;
}

export interface ObservabilityRecord extends ObservabilityEvent {
  readonly schemaVersion: string;
  readonly recordId: string;
  readonly dataPrivacyClass: ObservabilityDataPrivacyClass;
  readonly redaction: RedactionMetadata;
  readonly persistence: ObservabilityPersistencePolicy;
  readonly compatibility: CompatibilityMetadata;
  readonly privacyDecision: ObservabilityPrivacyDecision;
  readonly redactionSummary: ObservabilityRedactionSummary;
}

export interface DiagnosticBundleRequest extends JsonObject {
  readonly target: ObservabilityExportTarget;
  readonly reason: string;
  readonly maxRecords?: number;
  readonly exportPolicy?: ObservabilityExportPolicy;
}

export interface DiagnosticBundle extends JsonObject {
  readonly schemaVersion: string;
  readonly bundleId: string;
  readonly generatedAt: string;
  readonly target: ObservabilityExportTarget;
  readonly reason: string;
  readonly records: readonly ObservabilityRecord[];
  readonly selectedRecordCount: number;
  readonly totalRecordCount: number;
  readonly truncated: boolean;
  readonly privacyDecision: ObservabilityPrivacyDecision;
  readonly redactionSummary: ObservabilityRedactionSummary;
  readonly compatibility: CompatibilityMetadata;
  readonly redaction: RedactionMetadata;
}

export interface ObservabilitySink extends DiagnosticBundleExporter {
  emit(event: ObservabilityEvent): Promise<void>;
  drain(): Promise<readonly ObservabilityRecord[]>;
}

export interface DiagnosticBundleExporter {
  createDiagnosticBundle(request: DiagnosticBundleRequest): Promise<DiagnosticBundle>;
  decideExport(target: ObservabilityExportTarget, policy?: ObservabilityExportPolicy): ObservabilityPrivacyDecision;
}
