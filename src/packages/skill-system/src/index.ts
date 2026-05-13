import type {
  ContextGraphNode,
  JsonObject,
  RedactedError,
  RedactionMetadata,
  SessionId,
  SkillActivationRequest,
  SkillActivationResult,
  SkillContextProjectionRequest,
  SkillContextProjectionResult,
  SkillContextSegment,
  SkillContent,
  SkillContentResource,
  SkillManifest,
  SkillSummary,
  SkillSystem,
  SkillValidationResult
} from "@deepseek/platform-contracts";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, SKILL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";

interface StoredSkill {
  readonly manifest: SkillManifest;
  readonly content: SkillContent;
  readonly diagnostics: readonly RedactedError[];
  loaded: boolean;
  rejected: boolean;
}

export class InMemorySkillSystem implements SkillSystem {
  private readonly skills = new Map<string, StoredSkill>();

  async validateManifest(manifest: SkillManifest): Promise<SkillValidationResult> {
    const diagnostics: RedactedError[] = [];
    if (!manifest || typeof manifest !== "object") {
      return validationResult(false, diagnostics.concat(diagnostic("SKILL_MANIFEST_INVALID", "Skill manifest must be an object.")));
    }
    if (!manifest.id) diagnostics.push(diagnostic("SKILL_ID_REQUIRED", "Skill id is required."));
    if (!manifest.name) diagnostics.push(diagnostic("SKILL_NAME_REQUIRED", "Skill name is required."));
    if (!manifest.version) diagnostics.push(diagnostic("SKILL_VERSION_REQUIRED", "Skill version is required."));
    if (!manifest.source) diagnostics.push(diagnostic("SKILL_SOURCE_REQUIRED", "Skill source is required."));
    if (!manifest.trust) diagnostics.push(diagnostic("SKILL_TRUST_REQUIRED", "Skill trust is required."));
    if (!Array.isArray(manifest.activation) || manifest.activation.length === 0) diagnostics.push(diagnostic("SKILL_ACTIVATION_REQUIRED", "Skill activation metadata is required."));
    if (!Array.isArray(manifest.executionModes) || manifest.executionModes.length === 0) diagnostics.push(diagnostic("SKILL_EXECUTION_MODE_REQUIRED", "Skill execution mode is required."));
    if (!Array.isArray(manifest.permissions)) diagnostics.push(diagnostic("SKILL_PERMISSIONS_REQUIRED", "Skill permissions must be declared."));
    if (manifest.schemaVersion && manifest.schemaVersion !== SKILL_SCHEMA_VERSION) {
      diagnostics.push(diagnostic("SKILL_SCHEMA_VERSION_UNSUPPORTED", "Unsupported skill schema version."));
    }

    if (diagnostics.length > 0) {
      return validationResult(false, diagnostics);
    }

    const normalized: SkillManifest = {
      ...manifest,
      schemaVersion: SKILL_SCHEMA_VERSION,
      enabled: manifest.enabled ?? true,
      description: manifest.description ?? manifest.name,
      compatibility: manifest.compatibility ?? { schemaVersion: SKILL_SCHEMA_VERSION },
      activationRules: manifest.activationRules ?? [{ triggers: manifest.activation, match: "keyword" }],
      context: manifest.context ?? { maxSegments: 4, maxSegmentChars: 1200, preferredKinds: ["instruction", "example", "resource"] },
      redaction: manifest.redaction ?? { class: "internal", fields: ["metadata", "content"] },
      metadata: redactSkillMetadata(manifest.metadata ?? {})
    };
    return validationResult(true, diagnostics, normalized);
  }

  async registerSkill(manifest: SkillManifest): Promise<SkillSummary> {
    const validation = await this.validateManifest(manifest);
    if (!validation.ok || !validation.normalized) {
      throw new Error(validation.diagnostics.map((item) => item.code).join(",") || "SKILL_MANIFEST_INVALID");
    }
    if (this.skills.has(validation.normalized.id)) {
      throw new Error(`SKILL_DUPLICATE: ${validation.normalized.id}`);
    }
    const content = normalizeContent(validation.normalized);
    this.skills.set(validation.normalized.id, {
      manifest: deepFreeze(cloneJson(validation.normalized)),
      content,
      diagnostics: validation.diagnostics,
      loaded: false,
      rejected: false
    });
    const stored = this.skills.get(validation.normalized.id);
    if (!stored) throw new Error("SKILL_REGISTRATION_FAILED");
    return summaryFor(stored);
  }

  async listSummaries(): Promise<readonly SkillSummary[]> {
    return [...this.skills.values()]
      .map((stored) => summaryFor(stored))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  async loadSkill(name: string): Promise<SkillActivationResult> {
    return this.activateSkill({
      schemaVersion: SKILL_SCHEMA_VERSION,
      name,
      trigger: "explicit",
      context: {}
    });
  }

  async activateSkill(request: SkillActivationRequest): Promise<SkillActivationResult> {
    if (request.schemaVersion !== SKILL_SCHEMA_VERSION) {
      return activationResult("rejected", undefined, false, "rejected", [], [diagnostic("SKILL_SCHEMA_VERSION_UNSUPPORTED", "Unsupported skill activation schema version.")]);
    }
    const stored = this.findByName(request.name);
    if (!stored) {
      return activationResult("not-found", undefined, false, "rejected", [], [diagnostic("SKILL_NOT_FOUND", `Skill not found: ${request.name}`)]);
    }
    if (stored.manifest.trust === "untrusted" || stored.manifest.enabled === false) {
      return activationResult("inert", stored, false, "inert", [], [diagnostic("SKILL_INERT", `Skill is inert: ${stored.manifest.name}`)]);
    }

    stored.loaded = true;
    const segments = contextSegmentsFor(stored, undefined, undefined);
    return activationResult("activated", stored, true, "loaded", segments, stored.diagnostics);
  }

  async projectContext(request: SkillContextProjectionRequest): Promise<SkillContextProjectionResult> {
    if (request.schemaVersion !== SKILL_SCHEMA_VERSION) {
      return contextProjectionResult("rejected", undefined, [], [diagnostic("SKILL_SCHEMA_VERSION_UNSUPPORTED", "Unsupported skill context projection schema version.")]);
    }
    const stored = this.findByName(request.name);
    if (!stored) {
      return contextProjectionResult("not-found", undefined, [], [diagnostic("SKILL_NOT_FOUND", `Skill not found: ${request.name}`)]);
    }
    if (stored.manifest.trust === "untrusted" || stored.manifest.enabled === false) {
      return contextProjectionResult("inert", stored, [], [diagnostic("SKILL_INERT", `Skill is inert: ${stored.manifest.name}`)]);
    }
    stored.loaded = true;
    const segments = contextSegmentsFor(stored, request.maxSegments, request.maxSegmentChars);
    const nodes = segments.map((segment) => segmentToContextNode(request.sessionId, stored, segment));
    return contextProjectionResult("projected", stored, nodes, stored.diagnostics);
  }

  private findByName(name: string): StoredSkill | undefined {
    return [...this.skills.values()].find((stored) => stored.manifest.name === name || stored.manifest.activation.includes(name));
  }
}

function normalizeContent(manifest: SkillManifest): SkillContent {
  const metadata = manifest.metadata ?? {};
  const instructions = stringArray(metadata.instructions, [`Use ${manifest.name} guidance when relevant.`]);
  const examples = stringArray(metadata.examples, []);
  const resources = Array.isArray(metadata.resources)
    ? metadata.resources.filter(isResource).map((resource) => ({
        ...resource,
        content: redactSecretText(resource.content)
      }))
    : [];
  return deepFreeze({
    schemaVersion: SKILL_SCHEMA_VERSION,
    skillId: manifest.id,
    instructions: instructions.map(redactSecretText),
    examples: examples.map(redactSecretText),
    resources,
    redaction: { class: "internal", fields: ["instructions", "examples", "resources.content"] },
    compatibility: { schemaVersion: SKILL_SCHEMA_VERSION }
  });
}

function contextSegmentsFor(stored: StoredSkill, requestedMaxSegments?: number, requestedMaxChars?: number): readonly SkillContextSegment[] {
  const maxSegments = requestedMaxSegments ?? stored.manifest.context?.maxSegments ?? 4;
  const maxChars = requestedMaxChars ?? stored.manifest.context?.maxSegmentChars ?? 1200;
  const segments: SkillContextSegment[] = [];
  for (const [index, instruction] of stored.content.instructions.entries()) {
    segments.push(segment(stored, "instruction", index, instruction, 900, maxChars));
  }
  for (const [index, example] of stored.content.examples.entries()) {
    segments.push(segment(stored, "example", index, example, 700, maxChars));
  }
  for (const [index, resource] of stored.content.resources.entries()) {
    segments.push(segment(stored, "resource", index, `${resource.label}\n${resource.content}`, 500, maxChars));
  }
  return segments.slice(0, Math.max(0, maxSegments));
}

function segment(stored: StoredSkill, kind: SkillContextSegment["kind"], index: number, content: string, priority: number, maxChars: number): SkillContextSegment {
  const bounded = redactSecretText(content).slice(0, Math.max(0, maxChars));
  return deepFreeze({
    schemaVersion: SKILL_SCHEMA_VERSION,
    skillId: stored.manifest.id,
    segmentId: `${stored.manifest.id}:${kind}:${index}`,
    kind,
    content: bounded,
    priority,
    estimatedTokens: countTokens(bounded),
    provenance: { source: "skill-system", skillId: stored.manifest.id, skillName: stored.manifest.name, kind },
    dependencyFingerprints: [`skill:${stored.manifest.id}:${stored.manifest.version}:${kind}:${index}:${stableHash(bounded)}`],
    compatibility: { schemaVersion: SKILL_SCHEMA_VERSION },
    redaction: { class: containsSecretMarker(bounded) ? "secret" : "internal", fields: ["content"] }
  });
}

function segmentToContextNode(sessionId: SessionId, stored: StoredSkill, segmentValue: SkillContextSegment): ContextGraphNode {
  return {
    schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
    id: asId<"contextNode">(`skill-${stableHash(segmentValue.segmentId)}`),
    kind: segmentValue.kind === "instruction" ? "rule" : "summary",
    source: "skill-system",
    lifecycle: "session",
    scope: { sessionId },
    priority: segmentValue.priority,
    content: segmentValue.content,
    estimatedTokens: segmentValue.estimatedTokens,
    redaction: segmentValue.redaction,
    provenance: segmentValue.provenance,
    dependencyFingerprints: segmentValue.dependencyFingerprints,
    compatibility: { schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION, migrationId: `skill:${stored.manifest.version}` },
    createdAt: "1970-01-01T00:00:00.000Z"
  };
}

function summaryFor(stored: StoredSkill): SkillSummary {
  const manifest = stored.manifest;
  return deepFreeze({
    schemaVersion: SKILL_SCHEMA_VERSION,
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    source: manifest.source,
    trust: manifest.trust,
    enabled: manifest.enabled ?? true,
    description: manifest.description ?? manifest.name,
    activation: manifest.activation,
    executionModes: manifest.executionModes,
    permissions: manifest.permissions,
    loadingState: manifest.trust === "untrusted" || manifest.enabled === false ? "inert" : stored.loaded ? "loaded" : "summary-only",
    compatibility: manifest.compatibility ?? { schemaVersion: SKILL_SCHEMA_VERSION },
    redaction: manifest.redaction ?? { class: "internal" }
  });
}

function validationResult(ok: boolean, diagnostics: readonly RedactedError[], normalized?: SkillManifest): SkillValidationResult {
  return {
    schemaVersion: SKILL_SCHEMA_VERSION,
    ok,
    diagnostics,
    ...(normalized ? { normalized } : {}),
    redaction: { class: "internal", fields: ["diagnostics", "normalized.metadata"] }
  };
}

function activationResult(
  status: SkillActivationResult["status"],
  stored: StoredSkill | undefined,
  contentLoaded: boolean,
  loadingState: SkillActivationResult["loadingState"],
  contextSegments: readonly SkillContextSegment[],
  diagnostics: readonly RedactedError[]
): SkillActivationResult {
  return deepFreeze({
    schemaVersion: SKILL_SCHEMA_VERSION,
    status,
    ...(stored ? { manifest: cloneJson(stored.manifest), summary: summaryFor(stored) } : {}),
    contentLoaded,
    loadingState,
    contextSegments,
    diagnostics,
    redaction: { class: "internal", fields: ["manifest.metadata", "contextSegments.content"] },
    compatibility: { schemaVersion: SKILL_SCHEMA_VERSION },
    replayFingerprint: stableHash(JSON.stringify({
      status,
      skillId: stored?.manifest.id ?? "",
      loaded: contentLoaded,
      segments: contextSegments.map((item) => item.dependencyFingerprints)
    }))
  });
}

function contextProjectionResult(
  status: SkillContextProjectionResult["status"],
  stored: StoredSkill | undefined,
  nodes: readonly ContextGraphNode[],
  diagnostics: readonly RedactedError[]
): SkillContextProjectionResult {
  return deepFreeze({
    schemaVersion: SKILL_SCHEMA_VERSION,
    status,
    ...(stored ? { summary: summaryFor(stored) } : {}),
    nodes,
    diagnostics,
    redaction: { class: "internal", fields: ["nodes.content", "diagnostics"] },
    compatibility: { schemaVersion: SKILL_SCHEMA_VERSION },
    replayFingerprint: stableHash(JSON.stringify({
      status,
      skillId: stored?.manifest.id ?? "",
      nodes: nodes.map((node) => node.dependencyFingerprints)
    }))
  });
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message: redactSecretText(message),
    retryable: false,
    redaction: { class: "public" }
  };
}

function redactSkillMetadata(metadata: JsonObject): JsonObject {
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

function stringArray(value: unknown, fallback: readonly string[]): readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : fallback;
}

function isResource(value: unknown): value is SkillContentResource {
  return !!value && typeof value === "object" && typeof (value as SkillContentResource).uri === "string" && typeof (value as SkillContentResource).label === "string" && typeof (value as SkillContentResource).content === "string";
}

function countTokens(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
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
