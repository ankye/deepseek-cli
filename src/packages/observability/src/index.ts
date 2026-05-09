import type {
  DiagnosticBundle,
  DiagnosticBundleExporter,
  DiagnosticBundleRequest,
  JsonObject,
  ObservabilityDataPrivacyClass,
  ObservabilityEvent,
  ObservabilityExportPolicy,
  ObservabilityExportTarget,
  ObservabilityPersistencePolicy,
  ObservabilityPrivacyDecision,
  ObservabilityRecord,
  ObservabilityRedactionSummary,
  ObservabilitySink,
  PrivacySettings,
  RedactionMetadata
} from "@deepseek/platform-contracts";
import { OBSERVABILITY_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export const defaultPrivacySettings: PrivacySettings = {
  schemaVersion: OBSERVABILITY_SCHEMA_VERSION,
  localDiagnosticsEnabled: true,
  telemetryEnabled: false,
  allowExternalExport: false,
  maxLocalRecords: 1000,
  redaction: { class: "internal", fields: ["fields", "trace"] }
};

const localBundlePolicy: ObservabilityExportPolicy = {
  target: "local-bundle",
  allowSensitive: true,
  allowSecret: false,
  requireTelemetryEnabled: false,
  requireExplicitExternalExport: false
};

const externalTelemetryPolicy: ObservabilityExportPolicy = {
  target: "external-telemetry",
  allowSensitive: false,
  allowSecret: false,
  requireTelemetryEnabled: true,
  requireExplicitExternalExport: true
};

export class InMemoryObservabilitySink implements ObservabilitySink, DiagnosticBundleExporter {
  private readonly records: ObservabilityRecord[] = [];
  private nextRecord = 1;

  constructor(private readonly settings: PrivacySettings = defaultPrivacySettings) {}

  async emit(event: ObservabilityEvent): Promise<void> {
    if (!this.settings.localDiagnosticsEnabled) return;
    if (this.records.length >= this.settings.maxLocalRecords) {
      this.records.shift();
    }
    this.records.push(this.toRecord(event));
  }

  async drain(): Promise<readonly ObservabilityRecord[]> {
    return [...this.records];
  }

  async createDiagnosticBundle(request: DiagnosticBundleRequest): Promise<DiagnosticBundle> {
    const target = request.target;
    const policy = request.exportPolicy ?? policyFor(target);
    const decision = this.decideExport(target, policy);
    const maxRecords = Math.max(0, request.maxRecords ?? this.records.length);
    const selected = target === "local-bundle" || decision.exportAllowed ? this.records.slice(-maxRecords) : [];
    const redactionSummary = summarizeRecords(selected);
    return {
      schemaVersion: OBSERVABILITY_SCHEMA_VERSION,
      bundleId: `diagnostic-bundle-${stableHash(`${target}:${request.reason}:${this.records.length}:${maxRecords}`)}`,
      generatedAt: new Date(0).toISOString(),
      target,
      reason: redactSecretText(request.reason),
      records: selected,
      selectedRecordCount: selected.length,
      totalRecordCount: this.records.length,
      truncated: selected.length < this.records.length,
      privacyDecision: decision,
      redactionSummary,
      compatibility: { schemaVersion: OBSERVABILITY_SCHEMA_VERSION },
      redaction: { class: redactionClassForSummary(redactionSummary), fields: ["records", "reason"] }
    };
  }

  decideExport(target: ObservabilityExportTarget, policy: ObservabilityExportPolicy = policyFor(target)): ObservabilityPrivacyDecision {
    if (target === "local-bundle") {
      return privacyDecision("allow-local", target, "privacy.local-diagnostics", true, false);
    }
    if (policy.requireTelemetryEnabled && !this.settings.telemetryEnabled) {
      return privacyDecision("deny-export", target, "privacy.telemetry-disabled", this.settings.localDiagnosticsEnabled, false);
    }
    if (policy.requireExplicitExternalExport && !this.settings.allowExternalExport) {
      return privacyDecision("deny-export", target, "privacy.external-export-disabled", this.settings.localDiagnosticsEnabled, false);
    }
    return privacyDecision("allow-export", target, "privacy.export-allowed", this.settings.localDiagnosticsEnabled, true);
  }

  private toRecord(event: ObservabilityEvent): ObservabilityRecord {
    const redactedFields = redactJson(event.fields);
    const summary = summarizeRedactedJson(redactedFields);
    const declaredPrivacyClass = event.dataPrivacyClass ?? privacyClassFromSummary(summary);
    const redaction = event.redaction ?? redactionFor(declaredPrivacyClass, summary);
    const persistence = event.persistence ?? persistenceFor(declaredPrivacyClass, this.settings);
    const privacyDecisionForRecord = persistence.retainLocal
      ? privacyDecision("allow-local", "local-bundle", "privacy.local-record-retained", true, false)
      : privacyDecision("drop", "local-bundle", "privacy.local-diagnostics-disabled", false, false);
    return {
      ...event,
      schemaVersion: OBSERVABILITY_SCHEMA_VERSION,
      recordId: `observability-record-${this.nextRecord++}`,
      fields: redactedFields.value,
      dataPrivacyClass: declaredPrivacyClass,
      redaction,
      persistence,
      compatibility: event.compatibility ?? { schemaVersion: OBSERVABILITY_SCHEMA_VERSION },
      privacyDecision: privacyDecisionForRecord,
      redactionSummary: summary
    };
  }
}

export function redactObservabilityArtifact<T>(value: T): T {
  return redactJson(value).value as T;
}

function policyFor(target: ObservabilityExportTarget): ObservabilityExportPolicy {
  return target === "local-bundle" ? localBundlePolicy : externalTelemetryPolicy;
}

function persistenceFor(dataPrivacyClass: ObservabilityDataPrivacyClass, settings: PrivacySettings): ObservabilityPersistencePolicy {
  return {
    scope: settings.localDiagnosticsEnabled ? "local-diagnostics" : "none",
    retainLocal: settings.localDiagnosticsEnabled,
    allowExport: settings.telemetryEnabled && settings.allowExternalExport && dataPrivacyClass !== "secret"
  };
}

function privacyDecision(
  action: ObservabilityPrivacyDecision["action"],
  target: ObservabilityExportTarget,
  reasonCode: string,
  localDiagnosticsRetained: boolean,
  exportAllowed: boolean
): ObservabilityPrivacyDecision {
  return {
    schemaVersion: OBSERVABILITY_SCHEMA_VERSION,
    action,
    target,
    reasonCode,
    localDiagnosticsRetained,
    exportAllowed,
    redaction: { class: "internal", fields: ["reasonCode"] }
  };
}

function redactionFor(dataPrivacyClass: ObservabilityDataPrivacyClass, summary: ObservabilityRedactionSummary): RedactionMetadata {
  if (dataPrivacyClass === "secret" || summary.highestPrivacyClass === "secret") return { class: "secret", fields: summary.redactedFields };
  if (dataPrivacyClass === "sensitive" || dataPrivacyClass === "regulated") return { class: "sensitive", fields: summary.redactedFields };
  if (dataPrivacyClass === "local") return { class: "internal", fields: summary.redactedFields };
  return { class: "public", fields: summary.redactedFields };
}

function privacyClassFromSummary(summary: ObservabilityRedactionSummary): ObservabilityDataPrivacyClass {
  return summary.highestPrivacyClass === "secret" ? "secret" : summary.redactedValueCount > 0 ? "sensitive" : "local";
}

function redactionClassForSummary(summary: ObservabilityRedactionSummary): RedactionMetadata["class"] {
  if (summary.highestPrivacyClass === "secret") return "secret";
  return summary.redactedValueCount > 0 ? "sensitive" : "internal";
}

function summarizeRecords(records: readonly ObservabilityRecord[]): ObservabilityRedactionSummary {
  const fields = new Set<string>();
  const secretFields = new Set<string>();
  let redactedValueCount = 0;
  let highestPrivacyClass: ObservabilityDataPrivacyClass = "none";
  for (const record of records) {
    for (const field of record.redactionSummary.redactedFields) fields.add(field);
    for (const field of record.redactionSummary.secretLikeFields) secretFields.add(field);
    redactedValueCount += record.redactionSummary.redactedValueCount;
    highestPrivacyClass = maxPrivacyClass(highestPrivacyClass, record.redactionSummary.highestPrivacyClass);
  }
  return {
    schemaVersion: OBSERVABILITY_SCHEMA_VERSION,
    redactedFields: [...fields].sort(),
    secretLikeFields: [...secretFields].sort(),
    redactedValueCount,
    highestPrivacyClass,
    redaction: { class: redactionClassForPrivacy(highestPrivacyClass), fields: [...fields].sort() }
  };
}

interface RedactedJsonResult {
  readonly value: JsonObject;
  readonly redactedFields: readonly string[];
  readonly secretLikeFields: readonly string[];
  readonly redactedValueCount: number;
}

function redactJson(value: unknown, path = "fields"): RedactedJsonResult {
  const redactedFields: string[] = [];
  const secretLikeFields: string[] = [];
  let redactedValueCount = 0;

  const visit = (input: unknown, currentPath: string): unknown => {
    if (typeof input === "string") {
      const redacted = redactSecretText(input);
      if (redacted !== input) {
        redactedFields.push(currentPath);
        secretLikeFields.push(currentPath);
        redactedValueCount += 1;
      }
      return redacted;
    }
    if (Array.isArray(input)) {
      return input.map((item, index) => visit(item, `${currentPath}[${index}]`));
    }
    if (input && typeof input === "object") {
      const output: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(input)) {
        const childPath = `${currentPath}.${key}`;
        if (isSecretKey(key)) {
          output[key] = "[REDACTED:secret]";
          redactedFields.push(childPath);
          secretLikeFields.push(childPath);
          redactedValueCount += 1;
        } else {
          output[key] = visit(item, childPath);
        }
      }
      return output;
    }
    return input;
  };

  return {
    value: visit(value, path) as JsonObject,
    redactedFields,
    secretLikeFields,
    redactedValueCount
  };
}

function summarizeRedactedJson(redacted: RedactedJsonResult): ObservabilityRedactionSummary {
  const highestPrivacyClass: ObservabilityDataPrivacyClass = redacted.redactedValueCount > 0 ? "secret" : "local";
  return {
    schemaVersion: OBSERVABILITY_SCHEMA_VERSION,
    redactedFields: redacted.redactedFields,
    secretLikeFields: redacted.secretLikeFields,
    redactedValueCount: redacted.redactedValueCount,
    highestPrivacyClass,
    redaction: { class: redactionClassForPrivacy(highestPrivacyClass), fields: redacted.redactedFields }
  };
}

function redactSecretText(value: string): string {
  return value
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED:private-key]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/g, "Bearer [REDACTED:token]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s"',;]+/gi, (match) => {
      const [key] = match.split("=");
      return `${key}=[REDACTED:secret]`;
    });
}

function isSecretKey(key: string): boolean {
  return /api[_-]?key|token|secret|password|credential/i.test(key);
}

function redactionClassForPrivacy(dataPrivacyClass: ObservabilityDataPrivacyClass): RedactionMetadata["class"] {
  if (dataPrivacyClass === "secret") return "secret";
  if (dataPrivacyClass === "sensitive" || dataPrivacyClass === "regulated") return "sensitive";
  if (dataPrivacyClass === "local") return "internal";
  return "public";
}

function maxPrivacyClass(left: ObservabilityDataPrivacyClass, right: ObservabilityDataPrivacyClass): ObservabilityDataPrivacyClass {
  return privacyRank(right) > privacyRank(left) ? right : left;
}

function privacyRank(value: ObservabilityDataPrivacyClass): number {
  return ["none", "local", "sensitive", "secret", "regulated"].indexOf(value);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
