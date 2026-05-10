import type {
  CapabilityExecutionContext,
  CapabilityManifest,
  CoreCodingToolName,
  CoreToolDiagnostic,
  CoreToolEvidence,
  CoreToolResult,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import {
  analyzeResourceScope,
  createSandboxAuditEvidence,
  createSandboxRequirement,
  createSecretRedactionDecision,
  redactJsonSecrets,
  redactSecretText
} from "@deepseek/policy-sandbox";

export interface ToolDefinition {
  readonly toolName: CoreCodingToolName;
  readonly manifest: CapabilityManifest;
  readonly execute: (input: JsonObject, context: CapabilityExecutionContext) => Promise<SerializableResult<CoreToolResult>>;
}

export function defineToolManifest(
  toolName: CoreCodingToolName,
  id: CapabilityManifest["id"],
  name: string,
  sideEffect: CapabilityManifest["sideEffect"],
  permissions: readonly string[],
  inputSchema: JsonObject,
  outputSchema: JsonObject,
  execute: (input: JsonObject, context: CapabilityExecutionContext) => Promise<SerializableResult<CoreToolResult>>
): ToolDefinition {
  const resourceScope = analyzeResourceScope({}, sideEffect);
  const sandboxRequirements = createSandboxRequirement({
    sideEffect,
    resourceScope,
    timeoutMs: sideEffect === "process" ? 30_000 : 10_000,
    permissions
  });
  return {
    toolName,
    manifest: {
      id,
      name,
      description: `Built-in governed ${toolName} coding tool.`,
      source: "builtin",
      version: "1.0.0",
      trust: "trusted" as const,
      sideEffect,
      permissions,
      inputSchema,
      outputSchema,
      enabled: true,
      timeoutMs: sideEffect === "process" ? 30_000 : 10_000,
      replayPolicy: { replayable: true, snapshot: "core-tool-evidence", deterministic: true },
      projection: {
        modelVisible: true,
        hostVisible: true,
        executorVisible: false
      },
      compatibility: {
        schemaVersion: "1.0.0",
        requiresPlatform: true
      },
      secretExposure: createSecretRedactionDecision("", { class: "public" }),
      resourceScope,
      sandboxRequirements,
      audit: createSandboxAuditEvidence({
        decision: "manifest",
        reasonCode: `manifest.${toolName}`,
        subject: "core-coding-tools",
        resource: String(id),
        sandboxProfile: sandboxRequirements.profile
      }),
      security: {
        modelVisible: true,
        hostVisible: true,
        executorVisible: false,
        outputRedaction: "secret-aware"
      }
    },
    execute
  };
}

export function success(tool: CoreCodingToolName, affectedPaths: readonly string[], options: {
  readonly preview?: ReturnType<typeof boundedText>;
  readonly provider?: CoreToolEvidence["provider"];
  readonly metadata?: JsonObject;
  readonly replay?: JsonObject;
  readonly status?: CoreToolEvidence["status"];
}): SerializableResult<CoreToolResult> {
  return {
    ok: true,
    value: {
      evidence: {
        tool,
        status: options.status ?? "completed",
        affectedPaths: affectedPaths.map(redactSecretText),
        ...(options.preview ? { preview: options.preview } : {}),
        ...(options.provider ? { provider: options.provider } : {}),
        diagnostics: [],
        metadata: redactJsonSecrets(options.metadata ?? {}) as JsonObject,
        replay: options.replay ?? {},
        redaction: { class: "internal", fields: ["preview.text", "affectedPaths"] }
      }
    }
  };
}

export function failure(tool: CoreCodingToolName, code: string, message: string, affectedPaths: readonly string[], metadata: JsonObject = {}): SerializableResult<CoreToolResult> {
  const diagnostic = diag(code, redactSecretText(message));
  return {
    ok: false,
    error: diagnostic,
    value: {
      evidence: {
        tool,
        status: "rejected",
        affectedPaths: affectedPaths.map(redactSecretText),
        diagnostics: [diagnostic],
        metadata: redactJsonSecrets(metadata) as JsonObject,
        replay: {},
        redaction: { class: "internal", fields: ["affectedPaths"] }
      }
    }
  };
}

export function boundedText(text: string, limitBytes = 8_000) {
  const safeText = redactSecretText(text);
  const truncated = Buffer.byteLength(safeText, "utf8") > limitBytes;
  const limited = truncated ? safeText.slice(0, limitBytes) : safeText;
  return {
    text: limited,
    byteLength: Buffer.byteLength(safeText, "utf8"),
    lineCount: safeText.length === 0 ? 0 : safeText.split(/\r?\n/).length,
    truncated,
    limitBytes,
    redaction: { class: "internal" as const }
  };
}

export function diag(code: string, message: string): CoreToolDiagnostic {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal" }
  };
}

export function undefinedError(error: unknown, code: string): CoreToolDiagnostic {
  return diag(code, error instanceof Error ? error.message : "Operation failed.");
}

export function isDiagnostic(value: unknown): value is CoreToolDiagnostic {
  return typeof value === "object" && value !== null && "code" in value && "message" in value;
}

export function replay(context: CapabilityExecutionContext): JsonObject {
  return {
    envelopeId: context.envelope.invocationId,
    traceId: context.trace.traceId,
    snapshot: "core-tool-evidence"
  };
}

export function objectSchema(required: readonly string[], properties: JsonObject): JsonObject {
  return {
    type: "object",
    additionalProperties: false,
    required,
    properties
  };
}

export function evidenceSchema(): JsonObject {
  return objectSchema(["evidence"], { evidence: { type: "object" } });
}
