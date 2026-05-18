import type { CliTargetRef } from "./cli-composition.js";
import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionClass, RedactionMetadata, TraceContext, ValidationResult } from "./common.js";
import type { PluginId, SessionId, TurnId } from "./ids.js";

export const VISIBLE_REASONING_SCHEMA_VERSION = "1.0.0";
export const VISIBLE_REASONING_COMPATIBILITY: CompatibilityMetadata = {
  schemaVersion: VISIBLE_REASONING_SCHEMA_VERSION,
  minReaderVersion: "0.1.0"
};
export const VISIBLE_REASONING_MAX_SUMMARY_CHARS = 360;
export const VISIBLE_REASONING_MAX_DETAIL_CHARS = 2_000;
export const VISIBLE_REASONING_MAX_RECORDS = 64;
export const VISIBLE_REASONING_SECRET_REDACTION_PIT = "pit.visible-reasoning.secret-redaction";
export const VISIBLE_REASONING_PROVIDER_REASONING_PIT = "pit.visible-reasoning.provider-raw-reasoning";

export type VisibleReasoningActor =
  | "model-summary"
  | "runtime"
  | "host"
  | "prompt-assembly"
  | "plugin"
  | "verifier";

export type VisibleReasoningStepKind =
  | "intent"
  | "assumption"
  | "context-selection"
  | "tool-intent"
  | "edit-decision"
  | "verification"
  | "risk"
  | "outcome"
  | "prompt-assembly"
  | "plugin"
  | "diagnostic";

export type VisibleReasoningStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "skipped"
  | "warning";

export type VisibleReasoningCertainty = "verified" | "inferred" | "assumption" | "unsupported";
export type VisibleReasoningDetailLevel = "compact" | "full" | "debug";
export type VisibleReasoningRenderer = "tui" | "text" | "json" | "jsonl";

export type VisibleReasoningEvidenceKind =
  | "context-node"
  | "tool-evidence"
  | "command-result"
  | "diagnostic"
  | "result-list-item"
  | "diff"
  | "check"
  | "plugin-contribution"
  | "prompt-section"
  | "trace";

export interface VisibleReasoningOrder extends JsonObject {
  readonly sequence: number;
  readonly phase?: string;
  readonly parentRecordId?: string;
}

export interface VisibleReasoningEvidenceLink extends JsonObject {
  readonly kind: VisibleReasoningEvidenceKind;
  readonly target: CliTargetRef;
  readonly label: string;
  readonly fingerprint?: string;
  readonly supports?: boolean;
  readonly redaction: RedactionMetadata;
}

export interface VisibleReasoningRecord extends JsonObject {
  readonly schemaVersion: typeof VISIBLE_REASONING_SCHEMA_VERSION;
  readonly recordId: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly trace: TraceContext;
  readonly createdAt: string;
  readonly actor: VisibleReasoningActor;
  readonly stepKind: VisibleReasoningStepKind;
  readonly status: VisibleReasoningStatus;
  readonly certainty: VisibleReasoningCertainty;
  readonly summary: string;
  readonly detail?: string;
  readonly evidence: readonly VisibleReasoningEvidenceLink[];
  readonly pluginId?: PluginId;
  readonly order: VisibleReasoningOrder;
  readonly metadata: JsonObject;
  readonly diagnostics: readonly RedactedError[];
  readonly privacyClass: RedactionClass;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
  readonly pitFixtureIds: readonly string[];
}

export interface VisibleReasoningProjectionSummary extends JsonObject {
  readonly totalRecords: number;
  readonly visibleRecords: number;
  readonly evidenceLinkCount: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byStatus: Readonly<Record<string, number>>;
  readonly byActor: Readonly<Record<string, number>>;
  readonly unsupportedCount: number;
  readonly assumptionCount: number;
  readonly secretRedactionCount: number;
}

export interface VisibleReasoningProjection extends JsonObject {
  readonly schemaVersion: typeof VISIBLE_REASONING_SCHEMA_VERSION;
  readonly projectionId: string;
  readonly renderer: VisibleReasoningRenderer;
  readonly detailLevel: VisibleReasoningDetailLevel;
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly activeRecordId?: string;
  readonly records: readonly VisibleReasoningRecord[];
  readonly summary: VisibleReasoningProjectionSummary;
  readonly replayFingerprint: string;
  readonly redaction: RedactionMetadata;
  readonly compatibility: CompatibilityMetadata;
}

export interface VisibleReasoningReplayReport extends JsonObject {
  readonly schemaVersion: typeof VISIBLE_REASONING_SCHEMA_VERSION;
  readonly status: "matched" | "drifted";
  readonly capturedFingerprint: string;
  readonly replayedFingerprint: string;
  readonly firstDrift?: {
    readonly kind: "record-order" | "step-kind" | "status" | "evidence-fingerprint" | "redaction" | "projection-fingerprint";
    readonly message: string;
    readonly captured?: JsonObject;
    readonly replayed?: JsonObject;
    readonly redaction: RedactionMetadata;
  };
  readonly redaction: RedactionMetadata;
}

export interface VisibleReasoningRecordInput {
  readonly recordId?: string;
  readonly sessionId: SessionId;
  readonly turnId?: TurnId;
  readonly trace: TraceContext;
  readonly createdAt: string;
  readonly actor: VisibleReasoningActor;
  readonly stepKind: VisibleReasoningStepKind;
  readonly status: VisibleReasoningStatus;
  readonly certainty?: VisibleReasoningCertainty;
  readonly summary: string;
  readonly detail?: string;
  readonly evidence?: readonly VisibleReasoningEvidenceLink[];
  readonly pluginId?: PluginId;
  readonly sequence: number;
  readonly phase?: string;
  readonly parentRecordId?: string;
  readonly metadata?: JsonObject;
  readonly diagnostics?: readonly RedactedError[];
  readonly privacyClass?: RedactionClass;
  readonly redaction?: RedactionMetadata;
}

export interface VisibleReasoningProjectionOptions {
  readonly renderer: VisibleReasoningRenderer;
  readonly detailLevel?: VisibleReasoningDetailLevel;
  readonly activeRecordId?: string;
  readonly maxRecords?: number;
}

export function createVisibleReasoningRecord(input: VisibleReasoningRecordInput): VisibleReasoningRecord {
  const summary = redactVisibleReasoningText(boundText(input.summary, VISIBLE_REASONING_MAX_SUMMARY_CHARS));
  const detail = input.detail ? redactVisibleReasoningText(boundText(input.detail, VISIBLE_REASONING_MAX_DETAIL_CHARS)) : undefined;
  const pitFixtureIds = visibleReasoningPitFixtureIds(input.summary, input.detail, input.metadata);
  const privacyClass = strongestPrivacyClass(input.privacyClass ?? input.redaction?.class ?? "internal", `${input.summary}\n${input.detail ?? ""}\n${JSON.stringify(input.metadata ?? {})}`);
  const evidence = (input.evidence ?? []).map(redactedEvidenceLink);
  return {
    schemaVersion: VISIBLE_REASONING_SCHEMA_VERSION,
    recordId: input.recordId ?? visibleReasoningRecordId(input.sessionId, input.turnId, input.stepKind, input.sequence, summary),
    sessionId: input.sessionId,
    ...(input.turnId ? { turnId: input.turnId } : {}),
    trace: input.trace,
    createdAt: input.createdAt,
    actor: input.actor,
    stepKind: input.stepKind,
    status: input.status,
    certainty: input.certainty ?? certaintyFor(input.stepKind),
    summary,
    ...(detail ? { detail } : {}),
    evidence,
    ...(input.pluginId ? { pluginId: input.pluginId } : {}),
    order: {
      sequence: input.sequence,
      ...(input.phase ? { phase: input.phase } : {}),
      ...(input.parentRecordId ? { parentRecordId: input.parentRecordId } : {})
    },
    metadata: redactVisibleReasoningJson(input.metadata ?? {}),
    diagnostics: input.diagnostics ?? [],
    privacyClass,
    redaction: mergeReasoningRedaction(input.redaction, privacyClass, pitFixtureIds),
    compatibility: VISIBLE_REASONING_COMPATIBILITY,
    pitFixtureIds
  };
}

export function projectVisibleReasoning(
  records: readonly VisibleReasoningRecord[],
  options: VisibleReasoningProjectionOptions
): VisibleReasoningProjection {
  const detailLevel = options.detailLevel ?? (options.renderer === "tui" ? "full" : "compact");
  const visible = [...records]
    .sort(compareVisibleReasoningRecord)
    .slice(0, Math.max(1, options.maxRecords ?? VISIBLE_REASONING_MAX_RECORDS))
    .map((record) => projectRecordDetail(record, detailLevel));
  const replayFingerprint = visibleReasoningFingerprint(visible);
  const first = visible[0];
  const last = visible.at(-1);
  return {
    schemaVersion: VISIBLE_REASONING_SCHEMA_VERSION,
    projectionId: `visible-reasoning:${replayFingerprint}`,
    renderer: options.renderer,
    detailLevel,
    ...(first?.sessionId ? { sessionId: first.sessionId } : {}),
    ...(last?.turnId ? { turnId: last.turnId } : {}),
    ...(options.activeRecordId ? { activeRecordId: options.activeRecordId } : last ? { activeRecordId: last.recordId } : {}),
    records: visible,
    summary: summarizeVisibleReasoning(records, visible),
    replayFingerprint,
    redaction: { class: "internal", fields: ["records.summary", "records.detail", "records.metadata", "records.evidence"] },
    compatibility: VISIBLE_REASONING_COMPATIBILITY
  };
}

export function validateVisibleReasoningRecord(record: VisibleReasoningRecord): ValidationResult {
  const errors: RedactedError[] = [];
  if (record.schemaVersion !== VISIBLE_REASONING_SCHEMA_VERSION) errors.push(reasoningError("VISIBLE_REASONING_SCHEMA_UNSUPPORTED", "Visible reasoning record schema version is unsupported."));
  if (!record.recordId.trim()) errors.push(reasoningError("VISIBLE_REASONING_RECORD_ID_REQUIRED", "Visible reasoning record id is required."));
  if (!record.summary.trim()) errors.push(reasoningError("VISIBLE_REASONING_SUMMARY_REQUIRED", "Visible reasoning summary is required."));
  if (record.summary.length > VISIBLE_REASONING_MAX_SUMMARY_CHARS) errors.push(reasoningError("VISIBLE_REASONING_SUMMARY_TOO_LONG", "Visible reasoning summary exceeds the bounded display limit."));
  if (record.detail && record.detail.length > VISIBLE_REASONING_MAX_DETAIL_CHARS) errors.push(reasoningError("VISIBLE_REASONING_DETAIL_TOO_LONG", "Visible reasoning detail exceeds the bounded display limit."));
  if (containsRawProviderReasoning(record.metadata)) errors.push(reasoningError("VISIBLE_REASONING_RAW_PROVIDER_REASONING_REJECTED", "Raw provider/internal reasoning metadata is not allowed in visible reasoning."));
  if (containsSecretLike(JSON.stringify(record))) errors.push(reasoningError("VISIBLE_REASONING_SECRET_REDACTION_REQUIRED", "Visible reasoning contains raw secret-like material."));
  for (const link of record.evidence) {
    if (!link.target.id.trim()) errors.push(reasoningError("VISIBLE_REASONING_EVIDENCE_TARGET_REQUIRED", "Visible reasoning evidence link target id is required."));
    if (!link.redaction?.class) errors.push(reasoningError("VISIBLE_REASONING_EVIDENCE_REDACTION_REQUIRED", "Visible reasoning evidence link redaction metadata is required."));
  }
  return { ok: errors.length === 0, errors };
}

export function validateVisibleReasoningRecords(records: readonly VisibleReasoningRecord[]): ValidationResult {
  const errors: RedactedError[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.recordId)) errors.push(reasoningError("VISIBLE_REASONING_RECORD_DUPLICATE", `Duplicate visible reasoning record id: ${record.recordId}`));
    seen.add(record.recordId);
    errors.push(...validateVisibleReasoningRecord(record).errors);
  }
  return { ok: errors.length === 0, errors };
}

export function validatePluginVisibleReasoningContribution(
  pluginId: PluginId,
  records: readonly VisibleReasoningRecord[]
): ValidationResult {
  const errors: RedactedError[] = [];
  for (const record of records) {
    if (record.actor !== "plugin") errors.push(reasoningError("VISIBLE_REASONING_PLUGIN_ACTOR_REQUIRED", "Plugin reasoning contributions must use actor=plugin."));
    if (record.pluginId !== pluginId) errors.push(reasoningError("VISIBLE_REASONING_PLUGIN_ID_MISMATCH", "Plugin reasoning contribution plugin id does not match manifest id."));
    errors.push(...validateVisibleReasoningRecord(record).errors);
  }
  return { ok: errors.length === 0, errors };
}

export function replayVisibleReasoningProjection(
  captured: Pick<VisibleReasoningProjection, "replayFingerprint" | "records">,
  replayed: Pick<VisibleReasoningProjection, "replayFingerprint" | "records">
): VisibleReasoningReplayReport {
  if (captured.replayFingerprint === replayed.replayFingerprint) {
    return {
      schemaVersion: VISIBLE_REASONING_SCHEMA_VERSION,
      status: "matched",
      capturedFingerprint: captured.replayFingerprint,
      replayedFingerprint: replayed.replayFingerprint,
      redaction: { class: "internal" }
    };
  }
  return {
    schemaVersion: VISIBLE_REASONING_SCHEMA_VERSION,
    status: "drifted",
    capturedFingerprint: captured.replayFingerprint,
    replayedFingerprint: replayed.replayFingerprint,
    firstDrift: firstVisibleReasoningDrift(captured.records, replayed.records, captured.replayFingerprint, replayed.replayFingerprint),
    redaction: { class: "internal" }
  };
}

export function visibleReasoningFingerprint(records: readonly VisibleReasoningRecord[]): string {
  return `visible:${stableHash(records.map((record) => [
    record.recordId,
    record.stepKind,
    record.status,
    record.certainty,
    record.order.sequence,
    record.evidence.map((link) => link.fingerprint ?? `${link.kind}:${link.target.id}`).join(","),
    record.redaction.class
  ].join(":")).join("|"))}`;
}

export function redactVisibleReasoningText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/g, "Bearer [REDACTED:token]")
    .replace(/\b(?:sk|ds)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*(?!\[REDACTED)[^\s'"`]+/g, (match) => `${match.split("=")[0]}=[REDACTED:secret]`)
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED:private-key]")
    .replace(/\b(raw provider reasoning|hidden chain[- ]of[- ]thought|internal chain[- ]of[- ]thought)\b/gi, "[REDACTED:provider-reasoning]");
}

export function redactVisibleReasoningJson(value: JsonObject): JsonObject {
  return redactJson(value) as JsonObject;
}

function redactedEvidenceLink(link: VisibleReasoningEvidenceLink): VisibleReasoningEvidenceLink {
  return {
    ...link,
    label: redactVisibleReasoningText(boundText(link.label, VISIBLE_REASONING_MAX_SUMMARY_CHARS)),
    target: redactTarget(link.target),
    redaction: link.redaction ?? { class: "internal" }
  };
}

function redactTarget(target: CliTargetRef): CliTargetRef {
  return {
    ...target,
    ...(target.label ? { label: redactVisibleReasoningText(target.label) } : {}),
    ...(target.metadata ? { metadata: redactVisibleReasoningJson(target.metadata) } : {})
  };
}

function redactJson(value: unknown): unknown {
  if (typeof value === "string") return redactVisibleReasoningText(value);
  if (Array.isArray(value)) return value.map(redactJson);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        output[key] = "[REDACTED:secret]";
        continue;
      }
      if (isRawProviderReasoningKey(key)) {
        output[key] = "[REDACTED:provider-reasoning]";
        continue;
      }
      output[key] = redactJson(nested);
    }
    return output;
  }
  return value;
}

function projectRecordDetail(record: VisibleReasoningRecord, detailLevel: VisibleReasoningDetailLevel): VisibleReasoningRecord {
  if (detailLevel !== "compact") return record;
  const { detail: _detail, metadata: _metadata, ...compact } = record;
  return { ...compact, metadata: {} };
}

function summarizeVisibleReasoning(
  original: readonly VisibleReasoningRecord[],
  visible: readonly VisibleReasoningRecord[]
): VisibleReasoningProjectionSummary {
  return {
    totalRecords: original.length,
    visibleRecords: visible.length,
    evidenceLinkCount: visible.reduce((total, record) => total + record.evidence.length, 0),
    byKind: countBy(visible, (record) => record.stepKind),
    byStatus: countBy(visible, (record) => record.status),
    byActor: countBy(visible, (record) => record.actor),
    unsupportedCount: visible.filter((record) => record.certainty === "unsupported").length,
    assumptionCount: visible.filter((record) => record.certainty === "assumption").length,
    secretRedactionCount: visible.filter((record) => record.pitFixtureIds.includes(VISIBLE_REASONING_SECRET_REDACTION_PIT)).length
  };
}

function compareVisibleReasoningRecord(a: VisibleReasoningRecord, b: VisibleReasoningRecord): number {
  if (a.order.sequence !== b.order.sequence) return a.order.sequence - b.order.sequence;
  return a.recordId.localeCompare(b.recordId, "en");
}

function countBy<T extends VisibleReasoningRecord>(records: readonly T[], key: (record: T) => string): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    const value = key(record);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function visibleReasoningRecordId(sessionId: SessionId, turnId: TurnId | undefined, kind: VisibleReasoningStepKind, sequence: number, summary: string): string {
  return `visible-reasoning:${kind}:${sequence}:${stableHash(`${sessionId}:${turnId ?? ""}:${summary}`)}`;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function boundText(value: string, limit: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3))}...` : normalized;
}

function certaintyFor(kind: VisibleReasoningStepKind): VisibleReasoningCertainty {
  if (kind === "assumption" || kind === "risk") return "assumption";
  if (kind === "diagnostic") return "unsupported";
  if (kind === "context-selection" || kind === "verification" || kind === "outcome") return "verified";
  return "inferred";
}

function mergeReasoningRedaction(input: RedactionMetadata | undefined, privacyClass: RedactionClass, pitFixtureIds: readonly string[]): RedactionMetadata {
  const fields = new Set<string>(input?.fields ?? []);
  fields.add("summary");
  fields.add("detail");
  fields.add("metadata");
  if (pitFixtureIds.length > 0) fields.add("pitFixtureIds");
  return { class: strongestRedactionClass(input?.class ?? privacyClass, privacyClass), fields: [...fields].sort() };
}

function strongestPrivacyClass(input: RedactionClass, raw: string): RedactionClass {
  if (containsSecretLike(raw)) return "secret";
  return input;
}

function strongestRedactionClass(a: RedactionClass, b: RedactionClass): RedactionClass {
  const order: readonly RedactionClass[] = ["public", "internal", "sensitive", "secret"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? "internal";
}

function visibleReasoningPitFixtureIds(summary: string, detail: string | undefined, metadata: JsonObject | undefined): readonly string[] {
  const serialized = `${summary}\n${detail ?? ""}\n${JSON.stringify(metadata ?? {})}`;
  const pits: string[] = [];
  if (containsSecretLike(serialized)) pits.push(VISIBLE_REASONING_SECRET_REDACTION_PIT);
  if (containsRawProviderReasoning(metadata) || /\b(raw provider reasoning|hidden chain[- ]of[- ]thought|internal chain[- ]of[- ]thought)\b/i.test(serialized)) pits.push(VISIBLE_REASONING_PROVIDER_REASONING_PIT);
  return pits;
}

function containsSecretLike(value: string): boolean {
  return /Bearer\s+[A-Za-z0-9._~+/-]+=*/.test(value) ||
    /\b(?:sk|ds)-[A-Za-z0-9_-]{12,}\b/.test(value) ||
    /\b[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*(?!\[REDACTED)/.test(value) ||
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(value);
}

function containsRawProviderReasoning(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.keys(value).some(isRawProviderReasoningKey);
}

function isSensitiveKey(key: string): boolean {
  return /(?:api[_-]?key|authorization|bearer|token|secret|password|credential|private[_-]?key)/i.test(key);
}

function isRawProviderReasoningKey(key: string): boolean {
  return /(?:raw[_-]?reasoning|provider[_-]?reasoning|hidden[_-]?chain|chain[_-]?of[_-]?thought|reasoning[_-]?payload)/i.test(key);
}

function reasoningError(code: string, message: string): RedactedError {
  return { code, message, retryable: false, redaction: { class: "public" } };
}

function firstVisibleReasoningDrift(
  captured: readonly VisibleReasoningRecord[],
  replayed: readonly VisibleReasoningRecord[],
  capturedFingerprint: string,
  replayedFingerprint: string
): NonNullable<VisibleReasoningReplayReport["firstDrift"]> {
  const max = Math.max(captured.length, replayed.length);
  for (let index = 0; index < max; index += 1) {
    const left = captured[index];
    const right = replayed[index];
    if (!left || !right || left.recordId !== right.recordId) {
      return drift("record-order", "Visible reasoning record order changed", recordDriftValue(left), recordDriftValue(right));
    }
    if (left.stepKind !== right.stepKind) return drift("step-kind", "Visible reasoning step kind changed", recordDriftValue(left), recordDriftValue(right));
    if (left.status !== right.status) return drift("status", "Visible reasoning status changed", recordDriftValue(left), recordDriftValue(right));
    if (left.redaction.class !== right.redaction.class) return drift("redaction", "Visible reasoning redaction class changed", recordDriftValue(left), recordDriftValue(right));
    const leftEvidence = left.evidence.map((link) => link.fingerprint ?? link.target.id).join("|");
    const rightEvidence = right.evidence.map((link) => link.fingerprint ?? link.target.id).join("|");
    if (leftEvidence !== rightEvidence) return drift("evidence-fingerprint", "Visible reasoning evidence fingerprints changed", { evidence: leftEvidence }, { evidence: rightEvidence });
  }
  return drift("projection-fingerprint", "Visible reasoning projection fingerprint changed", { fingerprint: capturedFingerprint }, { fingerprint: replayedFingerprint });
}

function recordDriftValue(record: VisibleReasoningRecord | undefined): JsonObject {
  if (!record) return {};
  return {
    recordId: record.recordId,
    stepKind: record.stepKind,
    status: record.status,
    sequence: record.order.sequence
  };
}

function drift(
  kind: NonNullable<VisibleReasoningReplayReport["firstDrift"]>["kind"],
  message: string,
  captured: JsonObject,
  replayed: JsonObject
): NonNullable<VisibleReasoningReplayReport["firstDrift"]> {
  return { kind, message, captured, replayed, redaction: { class: "internal" } };
}
