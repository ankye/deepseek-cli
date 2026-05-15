import type {
  CapabilityExecutorBinding,
  CapabilityManifest,
  CodeIntelligenceService,
  JsonObject,
  SerializableResult,
  ToolFamilyId,
  ToolFamilyOperationProfile,
  ToolFamilyRiskClass
} from "@deepseek/platform-contracts";
import { TOOL_FAMILY_CATALOG_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { analyzeResourceScope, createSandboxAuditEvidence, createSandboxRequirement, createSecretRedactionDecision } from "@deepseek/policy-sandbox";

const deterministicTime = "1970-01-01T00:00:00.000Z";
const catalogVersion = "v1";

export interface CodeIntelligenceFamilyCapabilityOptions {
  readonly root?: string;
  readonly maxItems?: number;
}

export function createCodeIntelligenceFamilyCapabilities(
  service: CodeIntelligenceService,
  options: CodeIntelligenceFamilyCapabilityOptions = {}
): readonly CapabilityExecutorBinding[] {
  const maxItems = clampLimit(options.maxItems ?? 25, 1, 50);
  return [
    {
      manifest: manifest("code-intelligence.search-symbol", "search.symbol", "Search symbols", ["read"]),
      execute: async (input) => searchSymbol(service, input, options.root ?? "", maxItems)
    },
    {
      manifest: manifest("code-intelligence.diagnostics-lsp", "code.diagnostics-lsp", "Project diagnostics", ["read"]),
      execute: async (input) => diagnosticsLsp(service, input, options.root ?? "", maxItems)
    }
  ];
}

async function searchSymbol(
  service: CodeIntelligenceService,
  input: JsonObject,
  fallbackRoot: string,
  maxItems: number
): Promise<SerializableResult> {
  const root = stringValue(input.root) ?? fallbackRoot;
  const query = stringValue(input.query) ?? stringValue(input.symbol) ?? "";
  const mode = stringValue(input.mode) ?? "symbols";
  const limit = clampLimit(numberValue(input.limit) ?? maxItems, 1, maxItems);
  if (root) await service.index(root);
  const entries = mode === "definitions"
    ? await service.definitions(query)
    : mode === "references"
      ? await service.references(query)
      : await service.symbols(query);
  const bounded = entries.slice(0, limit).map((entry) => ({
    name: entry.name,
    kind: entry.kind ?? "unknown",
    source: entry.source ?? "definition",
    path: entry.path,
    line: entry.line ?? 1,
    range: entry.range,
    provenance: entry.provenance,
    redaction: entry.redaction
  }));
  return ok({
    familyId: "search.symbol",
    mode,
    query,
    symbols: bounded,
    count: bounded.length,
    truncated: entries.length > bounded.length,
    outputBounds: { maxItems },
    evidence: evidence("search.symbol", "code-intelligence.search-symbol")
  });
}

async function diagnosticsLsp(
  service: CodeIntelligenceService,
  input: JsonObject,
  fallbackRoot: string,
  maxItems: number
): Promise<SerializableResult> {
  const root = stringValue(input.root) ?? fallbackRoot;
  const limit = clampLimit(numberValue(input.limit) ?? maxItems, 1, maxItems);
  const diagnostics = await service.diagnostics(root);
  const bounded = diagnostics.slice(0, limit).map((entry) => ({
    path: entry.path,
    severity: entry.severity,
    code: entry.code ?? "CODE_DIAGNOSTIC",
    message: entry.message,
    line: entry.line ?? 1,
    range: entry.range,
    source: entry.source,
    provenance: entry.provenance,
    redaction: entry.redaction
  }));
  return ok({
    familyId: "code.diagnostics-lsp",
    diagnostics: bounded,
    count: bounded.length,
    truncated: diagnostics.length > bounded.length,
    outputBounds: { maxItems },
    evidence: evidence("code.diagnostics-lsp", "code-intelligence.diagnostics-lsp")
  });
}

function manifest(
  id: string,
  familyId: "search.symbol" | "code.diagnostics-lsp",
  name: string,
  operationProfiles: readonly ToolFamilyOperationProfile[]
): CapabilityManifest {
  const riskClass: ToolFamilyRiskClass = "read";
  const resourceScope = analyzeResourceScope({}, "read");
  const sandboxRequirements = createSandboxRequirement({ sideEffect: "read", resourceScope, timeoutMs: 1_000, permissions: ["workspace:read", "code-intelligence:read"] });
  return {
    id: asId<"capability">(id),
    name,
    description: `${familyId} deterministic code-intelligence capability`,
    source: "@deepseek/code-intelligence",
    version: "0.1.0",
    trust: "trusted",
    sideEffect: "read",
    permissions: ["workspace:read", "code-intelligence:read"],
    inputSchema: { type: "object", additionalProperties: true },
    outputSchema: { type: "object", additionalProperties: true },
    enabled: true,
    timeoutMs: 1_000,
    projection: {
      modelVisible: true,
      outputBounded: true,
      connectorTrust: "trusted",
      providerSupport: "connector",
      policyTags: ["workspace-read", "fake-first"],
      agentScopeIds: ["default"]
    },
    toolFamily: {
      schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
      catalogVersion,
      domainId: "search-code-intelligence",
      familyId,
      toolId: familyId,
      implementationState: "implemented",
      maturity: "baseline",
      riskClass,
      operationProfiles,
      hostRequirements: ["workspace"],
      connectorProfile: "built-in",
      scorecardRubricId: `rubric.${familyId}.baseline`,
      redaction: { class: "public" }
    },
    secretExposure: createSecretRedactionDecision("", { class: "public" }),
    resourceScope,
    ["sandboxRequirements"]: sandboxRequirements,
    audit: createSandboxAuditEvidence({
      decision: "manifest",
      reasonCode: "manifest.code-intelligence",
      subject: "@deepseek/code-intelligence",
      resource: id,
      ["sandboxProfile"]: sandboxRequirements.profile
    }),
    security: { modelVisible: true, outputRedaction: "internal", preflight: "workspace-read" }
  };
}

function evidence(familyId: ToolFamilyId, capabilityId: string): JsonObject {
  return {
    mode: "fake",
    providerNativeSupport: "not_applicable",
    capabilityId,
    familyId,
    replayRef: `replay:${capabilityId}`,
    createdAt: deterministicTime,
    redaction: { class: "public" }
  };
}

function ok(value: JsonObject): SerializableResult {
  return { ok: true, value };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function clampLimit(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}
