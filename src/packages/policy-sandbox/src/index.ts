import type {
  ApprovalBroker,
  ApprovalDecision,
  ApprovalRequest,
  JsonObject,
  PolicyAction,
  PolicyDecision,
  PolicyEngine,
  PolicyRequest,
  RedactedError,
  RedactionMetadata,
  ResourceScope,
  SandboxAuditEvidence,
  SandboxCapabilityMatrix,
  SandboxCapabilityName,
  SandboxDecision,
  SandboxEvent,
  SandboxRequirement,
  SandboxRequest,
  SandboxRuntime,
  SecretClassification,
  SecretKind,
  SecretRedactionDecision,
  SideEffectLevel
} from "@deepseek/platform-contracts";
import { SECRET_SANDBOX_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export const SECRET_REDACTION_TOKEN = "[REDACTED:secret]";

const credentialKeyPattern = /(api[_-]?key|secret|token|password|credential|auth)/i;

const secretPatterns: readonly {
  readonly kind: Exclude<SecretKind, "none" | "redaction-class">;
  readonly pattern: RegExp;
  readonly replacement: string;
  readonly reasonCode: string;
  readonly exposure: SecretClassification["exposure"];
}[] = [
  {
    kind: "private-key",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    replacement: "[REDACTED:private-key]",
    reasonCode: "secret.private-key",
    exposure: "raw"
  },
  {
    kind: "bearer-token",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g,
    replacement: "[REDACTED:bearer-token]",
    reasonCode: "secret.bearer-token",
    exposure: "raw"
  },
  {
    kind: "env-credential",
    pattern: /\b[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)[A-Z0-9_]*\s*=\s*["']?[^"'\s]+/gi,
    replacement: "[REDACTED:env-credential]",
    reasonCode: "secret.env-credential",
    exposure: "raw"
  },
  {
    kind: "credential-ref",
    pattern: /\b(?:credentialRef|credential_ref|credential):[A-Za-z0-9._:/@-]+|\bcredentialRef\s*=\s*["']?[A-Za-z0-9._:/@-]+/gi,
    replacement: "[REDACTED:credential-ref]",
    reasonCode: "secret.credential-ref",
    exposure: "reference"
  },
  {
    kind: "api-key",
    pattern: /\b(?:sk|ds|deepseek)-[A-Za-z0-9_-]{8,}\b/g,
    replacement: "[REDACTED:api-key]",
    reasonCode: "secret.api-key",
    exposure: "raw"
  }
];

export function classifySecretText(text: string, redaction: RedactionMetadata = { class: "public" }): SecretClassification {
  if (redaction.class === "secret") {
    return secretClassification("redaction-class", "unsafe", "secret.redaction-class", 1, stableFingerprint(text), redaction.class);
  }
  for (const candidate of secretPatterns) {
    const matches = [...text.matchAll(new RegExp(candidate.pattern.source, candidate.pattern.flags))];
    if (matches.length === 0) continue;
    return secretClassification(candidate.kind, candidate.exposure, candidate.reasonCode, matches.length, stableFingerprint(matches[0]?.[0] ?? text), "secret");
  }
  if (/\b(?:api[_-]?key|password|credential)\b/i.test(text)) {
    return secretClassification("generic-secret", "unsafe", "secret.keyword", 1, stableFingerprint(text), "secret");
  }
  return secretClassification("none", "none", "secret.none", 0, undefined, redaction.class);
}

export function createSecretRedactionDecision(value: unknown, redaction: RedactionMetadata = { class: "public" }): SecretRedactionDecision {
  const text = stringifyForClassification(value);
  const classification = classifySecretText(text, redaction);
  if (!classification.detected) {
    return {
      schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
      action: "allow",
      reasonCode: "secret.none",
      classification,
      redaction: { class: redaction.class }
    };
  }
  if (classification.kind === "credential-ref" && classification.exposure === "reference") {
    return {
      schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
      action: "allow",
      reasonCode: classification.reasonCode,
      classification,
      redactedText: redactSecretText(text),
      redaction: { class: "sensitive", fields: ["redactedText"] }
    };
  }
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    action: classification.exposure === "raw" ? "rewrite" : "deny",
    reasonCode: classification.reasonCode,
    classification,
    redactedText: redactSecretText(text),
    redaction: { class: "secret", fields: ["redactedText", "classification.evidence"] }
  };
}

export function redactSecretText(text: string): string {
  let redacted = text;
  for (const candidate of secretPatterns) {
    redacted = redacted.replace(new RegExp(candidate.pattern.source, candidate.pattern.flags), candidate.replacement);
  }
  redacted = redacted.replace(/\b([A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)[A-Z0-9_]*)\b/gi, "$1");
  return redacted;
}

export function redactJsonSecrets<T>(value: T): T {
  return redactUnknown(value, "") as T;
}

export function analyzeResourceScope(input: JsonObject, sideEffect: SideEffectLevel): ResourceScope {
  const path = typeof input.path === "string" ? input.path : undefined;
  const workspaceRoot = typeof input.workspaceRoot === "string" ? input.workspaceRoot : undefined;
  const cwd = typeof input.cwd === "string" ? input.cwd : workspaceRoot;
  const command = typeof input.command === "string" ? input.command : undefined;
  const args = Array.isArray(input.args) ? input.args.map(String) : undefined;
  const access: "read" | "write" | "execute" = sideEffect === "write" ? "write" : sideEffect === "process" ? "execute" : "read";
  const paths = path || workspaceRoot || cwd
    ? [{
        path: path ?? cwd ?? workspaceRoot ?? ".",
        ...(workspaceRoot ? { workspaceRoot } : {}),
        traversal: path && (path.includes("..") || path.startsWith("~") || path.includes("\0")) ? "rejected" as const : "unknown" as const,
        access
      }]
    : [];
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    kind: sideEffect === "write" ? "filesystem" : sideEffect === "process" ? "process" : sideEffect === "network" ? "network" : sideEffect === "read" ? "workspace" : "none",
    paths,
    ...(cwd ? { cwd } : {}),
    ...(command ? { command } : {}),
    ...(args ? { args } : {}),
    environment: sideEffect === "process" ? "scoped" : "none",
    networkHosts: typeof input.host === "string" ? [input.host] : [],
    nativeCapabilities: typeof input.nativeCapability === "string" ? [input.nativeCapability] : [],
    rollbackAvailable: sideEffect === "write",
    redaction: { class: "internal", fields: ["paths.path", "paths.workspaceRoot", "cwd"] }
  };
}

export function createSandboxRequirement(input: {
  readonly sideEffect: SideEffectLevel;
  readonly resourceScope: ResourceScope;
  readonly timeoutMs: number;
  readonly permissions?: readonly string[];
  readonly profile?: string;
  readonly requireEnforcement?: boolean;
}): SandboxRequirement {
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    profile: input.profile ?? defaultSandboxProfile(input.sideEffect, input.permissions ?? []),
    capabilities: requiredCapabilities(input.sideEffect, input.resourceScope, input.permissions ?? []),
    resourceScope: input.resourceScope,
    timeoutMs: input.timeoutMs,
    environment: input.resourceScope.environment,
    outputRedaction: { class: "internal", fields: ["stdout", "stderr", "preview"] },
    requireEnforcement: input.requireEnforcement ?? input.sideEffect !== "none"
  };
}

export function createSandboxAuditEvidence(input: {
  readonly decision: string;
  readonly reasonCode: string;
  readonly subject: string;
  readonly resource: string;
  readonly sandboxProfile: string;
  readonly metadata?: JsonObject;
  readonly trace?: SandboxAuditEvidence["trace"];
}): SandboxAuditEvidence {
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    decision: input.decision,
    reasonCode: input.reasonCode,
    subject: redactSecretText(input.subject),
    resource: redactSecretText(input.resource),
    redactedSubject: redactSecretText(input.subject),
    redactedResource: redactSecretText(input.resource),
    sandboxProfile: input.sandboxProfile,
    ...(input.trace ? { trace: input.trace } : {}),
    metadata: redactJsonSecrets(input.metadata ?? {}) as JsonObject,
    redaction: { class: "internal", fields: ["subject", "resource", "metadata"] }
  };
}

export function selectSandboxDecision(request: PolicyRequest): SandboxDecision {
  const sideEffect = sideEffectFrom(request.metadata);
  const capabilities = request.platform?.sandboxCapabilities ?? request.platform?.descriptor.sandbox ?? fallbackCapabilities(request.platform?.descriptor.degradedReasons ?? []);
  const resourceScope = request.resourceScope ?? resourceScopeFromMetadata(request.metadata, sideEffect);
  const requirements = request.sandbox ?? sandboxRequirementFromMetadata(request.metadata, sideEffect, resourceScope);
  const reasonCodes = sandboxReasonCodes(request, sideEffect, requirements, capabilities);
  const denied = reasonCodes.some((reason) => reason.endsWith(".unavailable") || reason.endsWith(".missing") || reason.endsWith(".rejected") || reason.endsWith(".read-only") || reason === "secret.raw-exposure" || reason === "secret.unsafe-exposure" || reason === "timeout.invalid");
  const requireSandbox = request.metadata.requireSandbox === true;
  const action: PolicyAction = denied
    ? reasonCodes.some((reason) => reason.startsWith("secret.")) ? "rewrite" : "deny"
    : requireSandbox
      ? "require-sandbox"
      : "allow";
  const profile = denied ? "platform-denied" : requireSandbox ? "enforced-required" : defaultSandboxProfile(sideEffect, permissionsFrom(request.metadata));
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    action,
    profile,
    reasonCodes: reasonCodes.length > 0 ? reasonCodes : ["sandbox.allow"],
    requirements: { ...requirements, profile },
    capabilities,
    degraded: capabilities.degraded,
    redaction: { class: "internal", fields: ["requirements.resourceScope", "capabilities.degradedReasons"] }
  };
}

export class DefaultPolicyEngine implements PolicyEngine {
  async decide(request: PolicyRequest): Promise<PolicyDecision> {
    const secret = request.secret ?? secretDecisionFromMetadata(request.metadata);
    const sandbox = selectSandboxDecision({
      ...request,
      secret,
      resourceScope: request.resourceScope ?? resourceScopeFromMetadata(request.metadata, sideEffectFrom(request.metadata)),
      sandbox: request.sandbox ?? sandboxRequirementFromMetadata(request.metadata, sideEffectFrom(request.metadata), request.resourceScope ?? resourceScopeFromMetadata(request.metadata, sideEffectFrom(request.metadata)))
    });
    const auditEvidence = createSandboxAuditEvidence({
      decision: sandbox.action,
      reasonCode: sandbox.reasonCodes[0] ?? "sandbox.allow",
      subject: request.subject,
      resource: request.resource,
      sandboxProfile: sandbox.profile,
      metadata: {
        policy: "deterministic-development",
        secret,
        sandbox,
        platform: request.platform?.descriptor
      }
    });

    if (secret.action === "deny" || secret.action === "rewrite" || secret.action === "exclude") {
      return {
        action: secret.action === "rewrite" ? "rewrite" : "deny",
        reason: `Secret exposure rejected by policy: ${secret.reasonCode}`,
        rewritten: { redacted: secret.redactedText ?? SECRET_REDACTION_TOKEN },
        audit: auditEvidence,
        sandboxProfile: sandbox.profile,
        secret,
        sandbox,
        auditEvidence
      };
    }

    if (sandbox.action === "deny" || sandbox.action === "rewrite" || sandbox.action === "require-sandbox") {
      return {
        action: sandbox.action,
        reason: `Sandbox policy ${sandbox.action}: ${sandbox.reasonCodes.join(", ")}`,
        audit: auditEvidence,
        sandboxProfile: sandbox.profile,
        secret,
        sandbox,
        auditEvidence
      };
    }

    const sideEffect = sideEffectFrom(request.metadata);
    const permissions = permissionsFrom(request.metadata);
    if (sideEffect === "process" && permissions.includes("process:test")) {
      return {
        action: "allow",
        reason: "Deterministic policy allows declared test execution",
        audit: auditEvidence,
        sandboxProfile: "development-test",
        secret,
        sandbox: { ...sandbox, profile: "development-test" },
        auditEvidence: { ...auditEvidence, sandboxProfile: "development-test" }
      };
    }
    if (sideEffect === "write" || sideEffect === "network" || sideEffect === "process") {
      return {
        action: "deny",
        reason: `Side effect ${String(sideEffect)} is not allowed by deterministic policy`,
        audit: auditEvidence,
        sandboxProfile: "development-denied",
        secret,
        sandbox: { ...sandbox, action: "deny", profile: "development-denied", reasonCodes: [...sandbox.reasonCodes, "policy.side-effect.denied"] },
        auditEvidence: { ...auditEvidence, decision: "deny", reasonCode: "policy.side-effect.denied", sandboxProfile: "development-denied" }
      };
    }
    if (request.action.includes("delete") || request.action.includes("secret")) {
      return {
        action: "ask",
        reason: "Potentially sensitive action requires approval",
        audit: auditEvidence,
        sandboxProfile: "development",
        secret,
        sandbox: { ...sandbox, action: "ask" },
        auditEvidence
      };
    }
    if (request.resource.includes("untrusted")) {
      return {
        action: "quarantine",
        reason: "Untrusted resource",
        audit: auditEvidence,
        sandboxProfile: "development-quarantine",
        secret,
        sandbox: { ...sandbox, action: "quarantine", profile: "development-quarantine" },
        auditEvidence
      };
    }
    return {
      action: "allow",
      reason: "Default development policy",
      audit: auditEvidence,
      sandboxProfile: sandbox.profile,
      secret,
      sandbox,
      auditEvidence
    };
  }
}

export class HeadlessApprovalBroker implements ApprovalBroker {
  constructor(private readonly defaultApproved = false) {}

  async requestApproval(request: ApprovalRequest): Promise<ApprovalDecision> {
    return {
      approved: this.defaultApproved,
      reason: this.defaultApproved ? `Approved: ${request.prompt}` : `Denied by headless default: ${request.prompt}`
    };
  }
}

export class DevelopmentSandboxRuntime implements SandboxRuntime {
  async *run(request: SandboxRequest): AsyncIterable<SandboxEvent> {
    yield {
      kind: "recorded",
      mode: "development",
      metadata: redactJsonSecrets({
        command: request.command,
        args: request.args,
        controls: request.controls,
        enforcement: "not-production"
      }) as JsonObject
    };
  }
}

function sandboxReasonCodes(
  request: PolicyRequest,
  sideEffect: SideEffectLevel,
  requirements: SandboxRequirement,
  capabilities: SandboxCapabilityMatrix
): readonly string[] {
  const reasons: string[] = [];
  const secret = request.secret ?? secretDecisionFromMetadata(request.metadata);
  if (secret.classification.exposure === "raw") reasons.push("secret.raw-exposure");
  if (secret.classification.exposure === "unsafe") reasons.push("secret.unsafe-exposure");
  if (!Number.isFinite(requirements.timeoutMs) || requirements.timeoutMs <= 0 || requirements.timeoutMs > 600_000) reasons.push("timeout.invalid");
  if (sideEffect === "write" && !capabilities.filesystem.write) reasons.push(capabilities.filesystem.readOnly ? "filesystem.read-only" : "filesystem.write.unavailable");
  if (sideEffect === "write" && requirements.resourceScope.paths.length === 0) reasons.push("filesystem.path-scope.missing");
  if (requirements.resourceScope.paths.some((path) => path.traversal === "rejected")) reasons.push("filesystem.path-scope.rejected");
  if (sideEffect === "process" && !capabilities.processExecution.execute) reasons.push("process.unavailable");
  if (sideEffect === "process" && !capabilities.shell.execute && (requirements.capabilities.includes("shell-execute") || typeof request.metadata.shellProfile === "string")) reasons.push("shell.unavailable");
  if (sideEffect === "process" && !requirements.resourceScope.cwd) reasons.push("process.cwd.missing");
  if (sideEffect === "network" && !capabilities.network.access) reasons.push("network.unavailable");
  if (requirements.capabilities.includes("secure-storage") && capabilities.secureStorage.status === "unavailable") reasons.push("secure-storage.unavailable");
  if (requirements.capabilities.includes("native-access") && !capabilities.native.access) reasons.push("native.unavailable");
  return reasons;
}

function secretDecisionFromMetadata(metadata: JsonObject): SecretRedactionDecision {
  const existing = metadata.secretExposure;
  if (isJsonObject(existing) && typeof existing.action === "string" && isJsonObject(existing.classification)) {
    return existing as unknown as SecretRedactionDecision;
  }
  return createSecretRedactionDecision(metadata);
}

function resourceScopeFromMetadata(metadata: JsonObject, sideEffect: SideEffectLevel): ResourceScope {
  const existing = metadata.resourceScope;
  if (isJsonObject(existing) && typeof existing.schemaVersion === "string" && Array.isArray(existing.paths)) {
    return existing as unknown as ResourceScope;
  }
  return analyzeResourceScope(metadata, sideEffect);
}

function sandboxRequirementFromMetadata(metadata: JsonObject, sideEffect: SideEffectLevel, resourceScope: ResourceScope): SandboxRequirement {
  const existing = metadata.sandboxRequirements;
  if (isJsonObject(existing) && typeof existing.schemaVersion === "string" && Array.isArray(existing.capabilities)) {
    return existing as unknown as SandboxRequirement;
  }
  const timeoutMs = typeof metadata.timeoutMs === "number" ? metadata.timeoutMs : 30_000;
  return createSandboxRequirement({
    sideEffect,
    resourceScope,
    timeoutMs,
    permissions: permissionsFrom(metadata)
  });
}

function permissionsFrom(metadata: JsonObject): readonly string[] {
  return Array.isArray(metadata.permissions) ? metadata.permissions.map(String) : [];
}

function sideEffectFrom(metadata: JsonObject): SideEffectLevel {
  const sideEffect = String(metadata.sideEffect ?? "none");
  return sideEffect === "read" || sideEffect === "write" || sideEffect === "network" || sideEffect === "process" ? sideEffect : "none";
}

function requiredCapabilities(sideEffect: SideEffectLevel, scope: ResourceScope, permissions: readonly string[]): readonly SandboxCapabilityName[] {
  const capabilities = new Set<SandboxCapabilityName>();
  if (sideEffect === "read") capabilities.add("filesystem-read");
  if (sideEffect === "write") {
    capabilities.add("filesystem-read");
    capabilities.add("filesystem-write");
  }
  if (sideEffect === "process") {
    capabilities.add("process-execute");
    capabilities.add("environment-read");
  }
  if (sideEffect === "network") capabilities.add("network-access");
  if (scope.nativeCapabilities.length > 0 || permissions.some((permission) => permission.startsWith("native:"))) capabilities.add("native-access");
  if (permissions.some((permission) => permission.includes("credential") || permission.includes("secret"))) capabilities.add("secure-storage");
  return [...capabilities].sort();
}

function defaultSandboxProfile(sideEffect: SideEffectLevel, permissions: readonly string[]): string {
  if (sideEffect === "none") return "none";
  if (sideEffect === "read") return "read-only";
  if (sideEffect === "process" && permissions.includes("process:test")) return "development-test";
  return `development-${sideEffect}`;
}

function fallbackCapabilities(degradedReasons: readonly string[] = []): SandboxCapabilityMatrix {
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    filesystem: { read: true, write: true, readOnly: false, traversalPolicy: "workspace-root", rollback: true },
    processExecution: { execute: true, providerStatus: "available" },
    shell: { execute: true, profile: "unknown", providerStatus: "available" },
    network: { access: true, providerStatus: "available", hostScopes: [] },
    environment: { access: "scoped" },
    native: { access: false, providerStatuses: {} },
    secureStorage: { status: "degraded", scopedReferences: true },
    degraded: degradedReasons.length > 0,
    degradedReasons,
    redaction: { class: "internal" }
  };
}

function secretClassification(
  kind: SecretKind,
  exposure: SecretClassification["exposure"],
  reasonCode: string,
  occurrences: number,
  fingerprint: string | undefined,
  redactionClass: SecretClassification["redactionClass"]
): SecretClassification {
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    detected: kind !== "none",
    kind,
    exposure,
    reasonCode,
    occurrences,
    ...(fingerprint ? { fingerprint } : {}),
    redactionClass,
    evidence: {
      detected: kind !== "none",
      kind,
      fingerprint: fingerprint ?? "",
      redaction: { class: redactionClass === "secret" ? "secret" : "internal" }
    }
  };
}

function redactUnknown(value: unknown, key: string): unknown {
  if (typeof value === "string") {
    if (credentialKeyPattern.test(key) && value.length > 0) return SECRET_REDACTION_TOKEN;
    return redactSecretText(value);
  }
  if (Array.isArray(value)) return value.map((item) => redactUnknown(item, key));
  if (isJsonObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      result[entryKey] = credentialKeyPattern.test(entryKey) && typeof entryValue === "string"
        ? SECRET_REDACTION_TOKEN
        : redactUnknown(entryValue, entryKey);
    }
    return result;
  }
  return value;
}

function stringifyForClassification(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? String(nested) : nested) ?? "";
}

function stableFingerprint(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `secret:${(hash >>> 0).toString(16)}`;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function policyError(code: string, message: string, details: JsonObject = {}): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal", fields: ["details"] },
    details: redactJsonSecrets(details) as JsonObject
  };
}
