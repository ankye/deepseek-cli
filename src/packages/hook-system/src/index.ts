import type {
  HookExecutionRecord,
  HookFailurePolicy,
  HookHandler,
  HookInvocationRequest,
  HookInvocationResult,
  HookLifecyclePoint,
  HookManifest,
  HookOrderProjectionRequest,
  HookOrderProjectionResult,
  HookOutputRecord,
  HookSummary,
  HookSystem,
  HookValidationResult,
  JsonObject,
  RedactedError,
  SerializableResult
} from "@deepseek/platform-contracts";
import { HOOK_SCHEMA_VERSION } from "@deepseek/platform-contracts";
export { createHookSystemFamilyCapabilities } from "./capabilities.js";

interface StoredHook {
  readonly manifest: HookManifest;
  readonly handler: HookHandler | undefined;
  readonly diagnostics: readonly RedactedError[];
  disabled: boolean;
}

type TerminalStatus = HookInvocationResult["status"];

export class InMemoryHookSystem implements HookSystem {
  private readonly hooks = new Map<string, StoredHook>();

  async validateManifest(manifest: HookManifest): Promise<HookValidationResult> {
    const diagnostics: RedactedError[] = [];
    if (!manifest || typeof manifest !== "object") {
      return validationResult(false, diagnostics.concat(diagnostic("HOOK_MANIFEST_INVALID", "Hook manifest must be an object.")));
    }
    if (!manifest.id) diagnostics.push(diagnostic("HOOK_ID_REQUIRED", "Hook id is required."));
    if (!manifest.name) diagnostics.push(diagnostic("HOOK_NAME_REQUIRED", "Hook name is required."));
    if (!manifest.version) diagnostics.push(diagnostic("HOOK_VERSION_REQUIRED", "Hook version is required."));
    if (!manifest.point) diagnostics.push(diagnostic("HOOK_POINT_REQUIRED", "Hook lifecycle point is required."));
    if (!manifest.source) diagnostics.push(diagnostic("HOOK_SOURCE_REQUIRED", "Hook source is required."));
    if (!manifest.trust) diagnostics.push(diagnostic("HOOK_TRUST_REQUIRED", "Hook trust is required."));
    if (!manifest.ordering || typeof manifest.ordering.priority !== "number") diagnostics.push(diagnostic("HOOK_ORDERING_REQUIRED", "Hook ordering priority is required."));
    if (!Number.isFinite(manifest.timeoutMs) || manifest.timeoutMs <= 0) diagnostics.push(diagnostic("HOOK_TIMEOUT_INVALID", "Hook timeoutMs must be a positive number."));
    if (!isFailurePolicy(manifest.failurePolicy)) diagnostics.push(diagnostic("HOOK_FAILURE_POLICY_INVALID", "Hook failurePolicy is invalid."));
    if (!manifest.isolation) diagnostics.push(diagnostic("HOOK_ISOLATION_REQUIRED", "Hook isolation mode is required."));
    if (!Array.isArray(manifest.permissions)) diagnostics.push(diagnostic("HOOK_PERMISSIONS_REQUIRED", "Hook permissions must be declared."));
    if (!manifest.inputSchema || typeof manifest.inputSchema !== "object") diagnostics.push(diagnostic("HOOK_INPUT_SCHEMA_REQUIRED", "Hook input schema is required."));
    if (!manifest.outputSchema || typeof manifest.outputSchema !== "object") diagnostics.push(diagnostic("HOOK_OUTPUT_SCHEMA_REQUIRED", "Hook output schema is required."));
    if (manifest.schemaVersion && manifest.schemaVersion !== HOOK_SCHEMA_VERSION) {
      diagnostics.push(diagnostic("HOOK_SCHEMA_VERSION_UNSUPPORTED", "Unsupported hook schema version."));
    }

    if (diagnostics.length > 0) {
      return validationResult(false, diagnostics);
    }

    const normalized: HookManifest = {
      ...manifest,
      schemaVersion: HOOK_SCHEMA_VERSION,
      enabled: manifest.enabled ?? true,
      description: manifest.description ?? manifest.name,
      compatibility: manifest.compatibility ?? { schemaVersion: HOOK_SCHEMA_VERSION },
      redaction: manifest.redaction ?? { class: "internal", fields: ["metadata", "input", "outputs.payload"] },
      ordering: {
        priority: manifest.ordering.priority,
        after: manifest.ordering.after ?? [],
        before: manifest.ordering.before ?? []
      },
      metadata: redactHookMetadata(manifest.metadata ?? {})
    };
    return validationResult(true, diagnostics, normalized);
  }

  async registerHook(manifest: HookManifest, handler?: HookHandler): Promise<HookSummary> {
    const validation = await this.validateManifest(manifest);
    if (!validation.ok || !validation.normalized) {
      throw new Error(validation.diagnostics.map((item) => item.code).join(",") || "HOOK_MANIFEST_INVALID");
    }
    if (this.hooks.has(validation.normalized.id)) {
      throw new Error(`HOOK_DUPLICATE: ${validation.normalized.id}`);
    }
    this.hooks.set(validation.normalized.id, {
      manifest: deepFreeze(cloneJson(validation.normalized)),
      handler,
      diagnostics: validation.diagnostics,
      disabled: validation.normalized.enabled === false
    });
    const stored = this.hooks.get(validation.normalized.id);
    if (!stored) throw new Error("HOOK_REGISTRATION_FAILED");
    return summaryFor(stored);
  }

  async listHooks(point?: HookLifecyclePoint): Promise<readonly HookSummary[]> {
    return this.orderedHooks(point, true).map(summaryFor);
  }

  async projectOrder(request: HookOrderProjectionRequest): Promise<HookOrderProjectionResult> {
    if (request.schemaVersion !== HOOK_SCHEMA_VERSION) {
      return orderProjectionResult(request.point, [], [diagnostic("HOOK_SCHEMA_VERSION_UNSUPPORTED", "Unsupported hook order projection schema version.")]);
    }
    const ordered = this.orderedHooks(request.point, request.includeInert === true).map(summaryFor);
    return orderProjectionResult(request.point, ordered, []);
  }

  async invokeHooks(request: HookInvocationRequest): Promise<HookInvocationResult> {
    if (request.schemaVersion !== HOOK_SCHEMA_VERSION) {
      return invocationResult(request.point, "rejected", [], [], [diagnostic("HOOK_SCHEMA_VERSION_UNSUPPORTED", "Unsupported hook invocation schema version.")]);
    }

    const ordered = this.orderedHooks(request.point, false);
    const orderedHookIds = ordered.map((stored) => stored.manifest.id);
    const executions: HookExecutionRecord[] = [];
    const diagnostics: RedactedError[] = [];
    let terminal: TerminalStatus = ordered.length === 0 ? "skipped" : "completed";

    for (const stored of ordered) {
      const execution = await this.invokeOne(stored, request);
      executions.push(execution);
      diagnostics.push(...execution.diagnostics);

      if (execution.status === "failed" || execution.status === "timed-out") {
        const policy = stored.manifest.failurePolicy;
        if (policy === "disable") {
          stored.disabled = true;
          terminal = "failed";
          continue;
        }
        if (policy === "block") {
          terminal = "blocked";
          break;
        }
        if (policy === "rollback-requested") {
          terminal = "rollback-requested";
          break;
        }
        terminal = terminal === "completed" ? "completed" : terminal;
      }
    }

    return invocationResult(request.point, terminal, orderedHookIds, executions, diagnostics);
  }

  private orderedHooks(point: HookLifecyclePoint | undefined, includeInert: boolean): StoredHook[] {
    return [...this.hooks.values()]
      .filter((stored) => (point ? stored.manifest.point === point : true))
      .filter((stored) => includeInert || isRunnable(stored))
      .sort(compareHooks);
  }

  private async invokeOne(stored: StoredHook, request: HookInvocationRequest): Promise<HookExecutionRecord> {
    const startedAt = "1970-01-01T00:00:00.000Z";
    if (stored.manifest.trust === "untrusted" || stored.disabled || stored.manifest.enabled === false) {
      return executionRecord(stored, "inert", startedAt, [], [diagnostic("HOOK_INERT", `Hook is inert: ${stored.manifest.name}`)]);
    }
    if (!stored.handler) {
      return executionRecord(stored, "skipped", startedAt, [], [diagnostic("HOOK_HANDLER_MISSING", `Hook handler is missing: ${stored.manifest.name}`)]);
    }

    try {
      const context = {
        manifest: stored.manifest,
        request,
        ...(request.trace ? { trace: request.trace } : {})
      };
      const result = await withTimeout(stored.handler(request.input, context), request.timeoutMs ?? stored.manifest.timeoutMs);
      if (!result.ok) {
        return executionRecord(stored, result.error?.code === "HOOK_TIMEOUT" ? "timed-out" : "failed", startedAt, [], [result.error ?? diagnostic("HOOK_FAILED", `Hook failed: ${stored.manifest.name}`)]);
      }
      const outputs = normalizeOutputs(stored, result.value);
      return executionRecord(stored, "completed", startedAt, outputs, stored.diagnostics);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hook failed.";
      const code = message === "HOOK_TIMEOUT" ? "HOOK_TIMEOUT" : "HOOK_HANDLER_FAILED";
      return executionRecord(stored, code === "HOOK_TIMEOUT" ? "timed-out" : "failed", startedAt, [], [diagnostic(code, message)]);
    }
  }
}

export function createHookOutput(hookId: HookManifest["id"], kind: HookOutputRecord["kind"], payload: JsonObject): HookOutputRecord {
  const redactedPayload = redactValue(payload) as JsonObject;
  return deepFreeze({
    schemaVersion: HOOK_SCHEMA_VERSION,
    hookId,
    kind,
    payload: redactedPayload,
    redaction: { class: containsSecretMarker(JSON.stringify(redactedPayload)) ? "secret" : "internal", fields: ["payload"] },
    provenance: { source: "hook-system", hookId, kind },
    replayFingerprint: stableHash(JSON.stringify({ hookId, kind, payload: redactedPayload }))
  });
}

function isRunnable(stored: StoredHook): boolean {
  return stored.manifest.trust !== "untrusted" && stored.manifest.enabled !== false && !stored.disabled;
}

function compareHooks(left: StoredHook, right: StoredHook): number {
  return (
    left.manifest.ordering.priority - right.manifest.ordering.priority ||
    trustRank(left.manifest.trust) - trustRank(right.manifest.trust) ||
    sourceRank(left.manifest.source) - sourceRank(right.manifest.source) ||
    left.manifest.name.localeCompare(right.manifest.name) ||
    left.manifest.id.localeCompare(right.manifest.id)
  );
}

function trustRank(value: string): number {
  if (value === "trusted") return 0;
  if (value === "workspace") return 1;
  if (value === "quarantined") return 2;
  return 3;
}

function sourceRank(value: string): number {
  if (value === "built-in") return 0;
  if (value === "extension") return 1;
  if (value === "plugin") return 2;
  if (value === "user") return 3;
  if (value === "workspace") return 4;
  return 5;
}

function validationResult(ok: boolean, diagnostics: readonly RedactedError[], normalized?: HookManifest): HookValidationResult {
  return {
    schemaVersion: HOOK_SCHEMA_VERSION,
    ok,
    diagnostics,
    ...(normalized ? { normalized } : {}),
    redaction: { class: "internal", fields: ["diagnostics", "normalized.metadata"] }
  };
}

function orderProjectionResult(point: HookLifecyclePoint, ordered: readonly HookSummary[], diagnostics: readonly RedactedError[]): HookOrderProjectionResult {
  return deepFreeze({
    schemaVersion: HOOK_SCHEMA_VERSION,
    point,
    ordered,
    diagnostics,
    redaction: { class: "internal", fields: ["diagnostics"] },
    compatibility: { schemaVersion: HOOK_SCHEMA_VERSION },
    replayFingerprint: stableHash(JSON.stringify({ point, ordered: ordered.map((hook) => hook.id), diagnostics: diagnostics.map((item) => item.code) }))
  });
}

function invocationResult(
  point: HookLifecyclePoint,
  status: TerminalStatus,
  orderedHookIds: readonly HookManifest["id"][],
  executions: readonly HookExecutionRecord[],
  diagnostics: readonly RedactedError[]
): HookInvocationResult {
  return deepFreeze({
    schemaVersion: HOOK_SCHEMA_VERSION,
    point,
    status,
    orderedHookIds,
    executions,
    diagnostics,
    redaction: { class: "internal", fields: ["diagnostics", "executions.outputs.payload"] },
    compatibility: { schemaVersion: HOOK_SCHEMA_VERSION },
    replayFingerprint: stableHash(JSON.stringify({
      point,
      status,
      orderedHookIds,
      executions: executions.map((item) => item.replayFingerprint),
      diagnostics: diagnostics.map((item) => item.code)
    }))
  });
}

function executionRecord(
  stored: StoredHook,
  status: HookExecutionRecord["status"],
  startedAt: string,
  outputs: readonly HookOutputRecord[],
  diagnostics: readonly RedactedError[]
): HookExecutionRecord {
  const completedAt = status === "timed-out" ? new Date(Date.parse(startedAt) + stored.manifest.timeoutMs).toISOString() : startedAt;
  const durationMs = status === "timed-out" ? stored.manifest.timeoutMs : 0;
  return deepFreeze({
    schemaVersion: HOOK_SCHEMA_VERSION,
    hookId: stored.manifest.id,
    name: stored.manifest.name,
    point: stored.manifest.point,
    status,
    startedAt,
    completedAt,
    durationMs,
    outputs,
    diagnostics,
    failurePolicy: stored.manifest.failurePolicy,
    redaction: { class: "internal", fields: ["outputs.payload", "diagnostics"] },
    replayFingerprint: stableHash(JSON.stringify({
      hookId: stored.manifest.id,
      status,
      outputs: outputs.map((item) => item.replayFingerprint),
      diagnostics: diagnostics.map((item) => item.code)
    }))
  });
}

function summaryFor(stored: StoredHook): HookSummary {
  const manifest = stored.manifest;
  return deepFreeze({
    schemaVersion: HOOK_SCHEMA_VERSION,
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    point: manifest.point,
    source: manifest.source,
    trust: manifest.trust,
    enabled: manifest.enabled !== false && !stored.disabled,
    ordering: manifest.ordering,
    timeoutMs: manifest.timeoutMs,
    failurePolicy: manifest.failurePolicy,
    isolation: manifest.isolation,
    permissions: manifest.permissions,
    compatibility: manifest.compatibility ?? { schemaVersion: HOOK_SCHEMA_VERSION },
    redaction: manifest.redaction ?? { class: "internal" }
  });
}

function normalizeOutputs(stored: StoredHook, value: SerializableResult<HookOutputRecord | readonly HookOutputRecord[]>["value"]): readonly HookOutputRecord[] {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => normalizeOutput(stored, item));
}

function normalizeOutput(stored: StoredHook, item: HookOutputRecord): HookOutputRecord {
  const normalized = createHookOutput(stored.manifest.id, item.kind, item.payload);
  return {
    ...normalized,
    redaction: containsSecretMarker(JSON.stringify(normalized.payload))
      ? { class: "secret", fields: ["payload"] }
      : item.redaction.class === "secret"
        ? item.redaction
        : normalized.redaction
  };
}

function isFailurePolicy(value: unknown): value is HookFailurePolicy {
  return value === "continue" || value === "block" || value === "disable" || value === "rollback-requested";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("HOOK_TIMEOUT")), Math.max(0, timeoutMs));
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message: redactSecretText(message),
    retryable: false,
    redaction: { class: "public" }
  };
}

function redactHookMetadata(metadata: JsonObject): JsonObject {
  return cloneJson(redactValue(metadata)) as JsonObject;
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactSecretText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = isSecretKey(key) ? "[REDACTED:secret]" : redactValue(nested);
    }
    return output;
  }
  return value;
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

function containsSecretMarker(value: string): boolean {
  return value.includes("[REDACTED:");
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function cloneJson<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}
