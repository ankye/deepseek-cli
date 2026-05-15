import type {
  CapabilityExecutorBinding,
  CapabilityManifest,
  JsonObject,
  JsonValue,
  SerializableResult,
  ToolFamilyArtifactKind,
  ToolFamilyId,
  ToolFamilyOperationProfile,
  ToolFamilyRiskClass
} from "@deepseek/platform-contracts";
import { TOOL_FAMILY_CATALOG_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";

const deterministicTime = "1970-01-01T00:00:00.000Z";
const catalogVersion = "v1";
const maxPreviewChars = 1_000;
const maxImageBytes = 2_000_000;

interface BytesDecodeResult {
  readonly ok: boolean;
  readonly value?: Uint8Array;
  readonly error?: SerializableResult["error"];
}

export interface ModelGatewayFamilyCapabilityOptions {
  readonly data?: Readonly<Record<string, JsonObject>>;
  readonly maxItems?: number;
}

export function createModelGatewayFamilyCapabilities(options: ModelGatewayFamilyCapabilityOptions = {}): readonly CapabilityExecutorBinding[] {
  const maxItems = clampLimit(options.maxItems ?? 10, 1, 25);
  return [
    binding("model-gateway.web-extract", "web.extract", "Extract web page content", "web-public-data", "network", ["network", "read"], "network", (input) => webExtract(input, maxItems)),
    binding("model-gateway.web-data-lookup", "web.data-lookup", "Lookup structured public data", "web-public-data", "network", ["network", "read"], "network", (input) => dataLookup(input, options.data ?? defaultData, maxItems)),
    binding("model-gateway.image-generate", "image.generate", "Generate image artifact", "media-images", "media", ["media", "artifact"], "read", (input) => imageGenerate(input)),
    binding("model-gateway.image-edit", "image.edit", "Edit image artifact", "media-images", "media", ["media", "artifact"], "read", (input) => imageEdit(input)),
    binding("model-gateway.image-search-stock", "image.search-stock", "Search stock images", "media-images", "media", ["media", "read"], "read", (input) => stockSearch(input, maxItems)),
    binding("model-gateway.image-inspect", "image.inspect", "Inspect image metadata", "media-images", "media", ["media", "read"], "read", (input) => imageInspect(input))
  ];
}

function webExtract(input: JsonObject, maxItems: number): SerializableResult {
  const html = stringValue(input.html) ?? "";
  const textLimit = clampLimit(numberValue(input.maxTextChars) ?? maxPreviewChars, 1, maxPreviewChars);
  const links = extractLinks(html).slice(0, maxItems);
  const title = redactSecretText(stripTags(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? ""));
  const text = redactSecretText(stripTags(html).replace(/\s+/g, " ").trim()).slice(0, textLimit);
  return ok({
    familyId: "web.extract",
    url: stringValue(input.url) ?? "about:blank",
    title,
    text,
    links,
    truncated: stripTags(html).length > text.length || extractLinks(html).length > links.length,
    outputBounds: { maxTextChars: textLimit, maxLinks: maxItems },
    evidence: evidence("web.extract", "model-gateway.web-extract")
  });
}

function dataLookup(input: JsonObject, data: Readonly<Record<string, JsonObject>>, maxItems: number): SerializableResult {
  const provider = (stringValue(input.provider) ?? "fake").toLowerCase();
  const query = (stringValue(input.query) ?? stringValue(input.key) ?? "").toLowerCase();
  const namespace = (stringValue(input.namespace) ?? "general").toLowerCase();
  const exactKey = `${namespace}:${query}`;
  const rows = Object.entries(data)
    .filter(([key]) => key === exactKey || key.includes(query))
    .slice(0, maxItems)
    .map(([key, value]) => ({ key, value: redactValue(value) as JsonObject }));
  return ok({
    familyId: "web.data-lookup",
    provider,
    namespace,
    query,
    rows,
    count: rows.length,
    truncated: Object.keys(data).filter((key) => key.includes(query)).length > rows.length,
    noNetwork: true,
    evidence: evidence("web.data-lookup", "model-gateway.web-data-lookup")
  });
}

function imageGenerate(input: JsonObject): SerializableResult {
  const prompt = redactSecretText((stringValue(input.prompt) ?? "image").slice(0, 400));
  const width = clampLimit(numberValue(input.width) ?? 512, 1, 4096);
  const height = clampLimit(numberValue(input.height) ?? 512, 1, 4096);
  const generatedArtifact = makeArtifact("image.generate", "image", stableHash(`${prompt}:${width}:${height}`), {
    mimeType: "image/png",
    byteLength: Math.min(width * height * 4, maxImageBytes),
    preview: `fake image ${width}x${height}: ${prompt}`.slice(0, 160)
  });
  return ok({
    familyId: "image.generate",
    artifact: generatedArtifact,
    artifacts: [generatedArtifact],
    providerNativeSupport: "unsupported",
    evidence: evidence("image.generate", "model-gateway.image-generate")
  });
}

function imageEdit(input: JsonObject): SerializableResult {
  const inputArtifactId = stringValue(input.inputArtifactId) ?? "artifact:input-image";
  const instruction = redactSecretText((stringValue(input.instruction) ?? "edit").slice(0, 400));
  const editedArtifact = makeArtifact("image.edit", "image", stableHash(`${inputArtifactId}:${instruction}`), {
    mimeType: "image/png",
    byteLength: 2048,
    preview: `fake edit ${inputArtifactId}: ${instruction}`.slice(0, 160)
  });
  return ok({
    familyId: "image.edit",
    inputArtifactId,
    artifact: editedArtifact,
    artifacts: [editedArtifact],
    providerNativeSupport: "unsupported",
    evidence: evidence("image.edit", "model-gateway.image-edit")
  });
}

function stockSearch(input: JsonObject, maxItems: number): SerializableResult {
  const query = redactSecretText((stringValue(input.query) ?? "workspace").slice(0, 120));
  const limit = clampLimit(numberValue(input.limit) ?? 3, 1, maxItems);
  const results = Array.from({ length: limit }, (_, index) => {
    const id = stableHash(`${query}:${index}`);
    return {
      title: `${query} stock ${index + 1}`,
      source: "fake-stock",
      license: "fixture",
      artifact: makeArtifact("image.search-stock", "image", id, {
        mimeType: "image/jpeg",
        byteLength: 4096 + index,
        preview: `fake stock result ${index + 1} for ${query}`
      })
    };
  });
  return ok({
    familyId: "image.search-stock",
    query,
    results,
    count: results.length,
    truncated: false,
    providerNativeSupport: "unsupported",
    evidence: evidence("image.search-stock", "model-gateway.image-search-stock")
  });
}

function imageInspect(input: JsonObject): SerializableResult {
  const bytes = decodeBase64Image(stringValue(input.bytesBase64) ?? stringValue(input.dataUri) ?? "");
  if (!bytes.ok) return { ok: false, error: bytes.error ?? { code: "IMAGE_INPUT_INVALID", message: "Image bytes must be base64 encoded.", retryable: false, redaction: { class: "public" } } };
  const value = bytes.value ?? new Uint8Array();
  if (value.byteLength > maxImageBytes) {
    return fail("IMAGE_INPUT_TOO_LARGE", "Image input exceeds the bounded inspection limit.");
  }
  const metadata = inspectImageBytes(value);
  if (!metadata) return fail("IMAGE_FORMAT_UNSUPPORTED", "Only deterministic PNG, JPEG, and GIF header inspection is supported.");
  return ok({
    familyId: "image.inspect",
    metadata,
    truncated: false,
    outputBounds: { maxImageBytes },
    evidence: evidence("image.inspect", "model-gateway.image-inspect")
  });
}

function binding(
  id: string,
  familyId: ToolFamilyId,
  name: string,
  domainId: "web-public-data" | "media-images",
  riskClass: ToolFamilyRiskClass,
  operationProfiles: readonly ToolFamilyOperationProfile[],
  sideEffect: CapabilityManifest["sideEffect"],
  execute: (input: JsonObject) => SerializableResult | Promise<SerializableResult>
): CapabilityExecutorBinding {
  return {
    manifest: {
      id: asId<"capability">(id),
      name,
      description: `${familyId} fake-first provider capability`,
      source: "@deepseek/model-gateway",
      version: "0.1.0",
      trust: "trusted",
      sideEffect,
      permissions: domainId === "web-public-data" ? ["network:fake", "web:read"] : ["media:fake", "artifact:write"],
      inputSchema: { type: "object", additionalProperties: true },
      outputSchema: { type: "object", additionalProperties: true },
      enabled: true,
      timeoutMs: 1_000,
      projection: {
        modelVisible: true,
        outputBounded: true,
        connectorTrust: "fake",
        providerSupport: "fake",
        policyTags: ["fake-first", domainId],
        agentScopeIds: ["default"]
      },
      toolFamily: {
        schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
        catalogVersion,
        domainId,
        familyId,
        toolId: familyId,
        implementationState: "implemented",
        maturity: "baseline",
        riskClass,
        operationProfiles,
        hostRequirements: ["fake-provider"],
        connectorProfile: "provider",
        scorecardRubricId: `rubric.${familyId}.baseline`,
        redaction: { class: "public" }
      },
      secretExposure: noSecretExposure(),
      resourceScope: resourceScope(domainId === "web-public-data" ? "network" : "native"),
      sandboxRequirements: sandbox(domainId, domainId === "web-public-data" ? ["network-access"] : ["native-access"]),
      audit: audit(id, domainId),
      security: { modelVisible: true, outputRedaction: "internal", preflight: "fake-provider" }
    },
    execute: async (input) => execute(input)
  };
}

const defaultData: Readonly<Record<string, JsonObject>> = {
  "weather:seattle": { temperatureC: 14, condition: "rain", observedAt: deterministicTime },
  "finance:deepseek": { symbol: "DEEP", price: 42, currency: "USD", observedAt: deterministicTime },
  "general:deepseek": { name: "DeepSeek", category: "ai", observedAt: deterministicTime }
};

function makeArtifact(familyId: ToolFamilyId, kind: ToolFamilyArtifactKind, key: string, details: { readonly mimeType: string; readonly byteLength: number; readonly preview: string }): JsonObject {
  return {
    artifactId: `artifact:${familyId}:${key}`,
    familyId,
    kind,
    uri: `artifact://fake/${familyId}/${key}`,
    mimeType: details.mimeType,
    byteLength: Math.min(details.byteLength, maxImageBytes),
    sha256: stableHash(`${familyId}:${key}:${details.preview}`),
    preview: redactSecretText(details.preview).slice(0, 200),
    truncated: details.preview.length > 200,
    createdAt: deterministicTime,
    redaction: { class: "internal" }
  };
}

function evidence(familyId: ToolFamilyId, capabilityId: string): JsonObject {
  return {
    mode: "fake",
    providerNativeSupport: "unsupported",
    capabilityId,
    familyId,
    replayRef: `replay:${capabilityId}`,
    createdAt: deterministicTime,
    redaction: { class: "public" }
  };
}

function extractLinks(html: string): readonly JsonObject[] {
  const links: JsonObject[] = [];
  const pattern = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    links.push({ href: redactSecretText(match[1] ?? ""), text: redactSecretText(stripTags(match[2] ?? "")).slice(0, 160) });
  }
  return links;
}

function firstMatch(value: string, pattern: RegExp): string | undefined {
  return pattern.exec(value)?.[1];
}

function stripTags(value: string): string {
  return value.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function decodeBase64Image(value: string): BytesDecodeResult {
  const base64 = value.startsWith("data:") ? value.replace(/^data:[^,]+,/, "") : value;
  try {
    return { ok: true, value: Buffer.from(base64, "base64") };
  } catch {
    return { ok: false, error: { code: "IMAGE_INPUT_INVALID", message: "Image bytes must be base64 encoded.", retryable: false, redaction: { class: "public" } } };
  }
}

function inspectImageBytes(bytes: Uint8Array): JsonObject | undefined {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { format: "png", width: readUInt32BE(bytes, 16), height: readUInt32BE(bytes, 20), byteLength: bytes.byteLength };
  }
  if (bytes.length >= 10 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { format: "gif", width: readUInt16LE(bytes, 6), height: readUInt16LE(bytes, 8), byteLength: bytes.byteLength };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return { format: "jpeg", width: 0, height: 0, byteLength: bytes.byteLength, dimensionsTruncated: true };
  }
  return undefined;
}

function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) * 0x1000000) + (((bytes[offset + 1] ?? 0) << 16) | ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0));
}

function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function ok(value: JsonObject): SerializableResult {
  return { ok: true, value };
}

function fail(code: string, message: string): SerializableResult {
  return { ok: false, error: { code, message, retryable: false, redaction: { class: "public" } } };
}

function noSecretExposure() {
  return {
    schemaVersion: "1.0.0",
    action: "redact" as const,
    reasonCode: "FAKE_PROVIDER_REDACTION",
    classification: {
      schemaVersion: "1.0.0",
      detected: false,
      kind: "none" as const,
      exposure: "none" as const,
      reasonCode: "FAKE_PROVIDER_REDACTION",
      occurrences: 0,
      redactionClass: "public" as const,
      evidence: {}
    },
    redaction: { class: "public" as const }
  };
}

function resourceScope(kind: "network" | "native") {
  return {
    schemaVersion: "1.0.0",
    kind,
    paths: [],
    environment: "none" as const,
    networkHosts: kind === "network" ? ["fake://provider"] : [],
    nativeCapabilities: kind === "native" ? ["fake-media-provider"] : [],
    rollbackAvailable: false,
    redaction: { class: "internal" as const }
  };
}

function sandbox(profile: string, capabilities: readonly ("network-access" | "native-access")[]) {
  return {
    schemaVersion: "1.0.0",
    profile,
    capabilities,
    resourceScope: resourceScope(capabilities.includes("network-access") ? "network" : "native"),
    timeoutMs: 1_000,
    environment: "none" as const,
    outputRedaction: { class: "internal" as const },
    requireEnforcement: true
  };
}

function audit(subject: string, resource: string) {
  return {
    schemaVersion: "1.0.0",
    decision: "allow",
    reasonCode: "FAKE_FIRST_PROVIDER_CAPABILITY",
    subject,
    resource,
    redactedSubject: subject,
    redactedResource: resource,
    sandboxProfile: resource,
    metadata: {},
    redaction: { class: "internal" as const }
  };
}

function redactValue(value: JsonValue): JsonValue {
  if (typeof value === "string") return redactSecretText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    const output: Record<string, JsonValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = /token|secret|password|api[_-]?key/i.test(key) ? "[REDACTED:secret]" : redactValue(nested as JsonValue);
    }
    return output;
  }
  return value;
}

function redactSecretText(value: string): string {
  return value
    .replace(/\b(?:sk|ds)-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s"',;]+/gi, (match) => `${match.split("=")[0]}=[REDACTED:secret]`);
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

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
