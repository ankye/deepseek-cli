import type {
  RedactedError,
  RuntimeEvent,
  SelfRepairConfig,
  SelfRepairOutcomeSummary
} from "@deepseek/platform-contracts";
import { SELF_REPAIR_COMPATIBILITY, SELF_REPAIR_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export const defaultSelfRepairConfig: SelfRepairConfig = {
  enabled: false,
  maxAttempts: 1,
  requireCheckpointForWrites: true,
  verificationMode: "minimal"
};

export function selfRepairConfig(input: Partial<SelfRepairConfig> | undefined, maxAttemptsFromLimits: number): SelfRepairConfig {
  return {
    ...defaultSelfRepairConfig,
    ...(input ?? {}),
    maxAttempts: Math.max(0, input?.maxAttempts ?? maxAttemptsFromLimits)
  };
}

export function emptySelfRepairOutcome(enabled: boolean, stopReason: SelfRepairOutcomeSummary["stopReason"] = enabled ? "disabled" : "disabled"): SelfRepairOutcomeSummary {
  return {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    enabled,
    activated: false,
    attemptCount: 0,
    successCount: 0,
    repeatedNoopCount: 0,
    stopReason,
    classifications: [],
    attempts: [],
    verification: [],
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: { class: "internal", fields: ["classifications.diagnostics", "attempts.diagnostics", "verification.stdoutPreview", "verification.stderrPreview"] }
  };
}

export function outcomeFromState(input: {
  readonly enabled: boolean;
  readonly classifications: readonly import("@deepseek/platform-contracts").SelfRepairFailureClassification[];
  readonly attempts: readonly import("@deepseek/platform-contracts").SelfRepairAttemptRecord[];
  readonly verification: readonly import("@deepseek/platform-contracts").SelfRepairVerificationSummary[];
  readonly stopReason: SelfRepairOutcomeSummary["stopReason"];
}): SelfRepairOutcomeSummary {
  const completed = input.stopReason === "completed" ? input.attempts.filter((attempt) => attempt.status === "completed").length : 0;
  const repeatedNoopCount = input.attempts.filter((attempt) => attempt.materialChangeFingerprint === "noop").length;
  return {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    enabled: input.enabled,
    activated: input.attempts.length > 0,
    attemptCount: input.attempts.length,
    successCount: completed,
    repeatedNoopCount,
    stopReason: input.stopReason,
    classifications: input.classifications,
    attempts: input.attempts,
    verification: input.verification,
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: { class: "internal", fields: ["classifications.diagnostics", "attempts.diagnostics", "verification.stdoutPreview", "verification.stderrPreview"] }
  };
}

export function diagnosticFingerprint(error: RedactedError | undefined, fallback: string): string {
  const source = error ? `${error.code}:${error.message}:${JSON.stringify(error.details ?? {})}` : fallback;
  return `repair:${stableHash(source)}`;
}

export function eventFingerprint(event: RuntimeEvent | undefined, fallback: string): string {
  const source = event ? `${event.kind}:${JSON.stringify(event.data)}:${event.error?.code ?? ""}` : fallback;
  return `repair:${stableHash(source)}`;
}

export function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

export function boundedPreview(value: string, limit = 500): string {
  const safe = value
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/g, "Bearer [REDACTED:token]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s"',;]+/gi, (match) => {
      const [key] = match.split("=");
      return `${key}=[REDACTED:secret]`;
    })
    .trim();
  return safe.length > limit ? `${safe.slice(0, limit)}...` : safe;
}
