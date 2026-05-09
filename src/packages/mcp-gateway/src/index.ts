import type {
  JsonObject,
  McpGateway,
  McpHealthStatus,
  McpListRequest,
  McpOperationStatus,
  McpPromptSummary,
  McpResourceDeclaration,
  McpResourceReadRequest,
  McpResourceReadResult,
  McpResourceSummary,
  McpServerAdapter,
  McpServerManifest,
  McpServerSummary,
  McpTransportDeclaration,
  McpToolCallRequest,
  McpToolCallResult,
  McpToolDeclaration,
  McpToolSummary,
  McpValidationResult,
  RedactedError,
  SerializableResult,
  TrustStatus
} from "@deepseek/platform-contracts";
import { MCP_SCHEMA_VERSION } from "@deepseek/platform-contracts";

interface StoredServer {
  readonly manifest: McpServerManifest;
  readonly adapter: McpServerAdapter | undefined;
  readonly diagnostics: readonly RedactedError[];
  health: McpHealthStatus;
}

export class InMemoryMcpGateway implements McpGateway {
  private readonly servers = new Map<string, StoredServer>();
  private readonly namespaces = new Map<string, string>();

  async validateManifest(manifest: McpServerManifest): Promise<McpValidationResult> {
    const diagnostics: RedactedError[] = [];
    if (!manifest || typeof manifest !== "object") {
      return validationResult(false, diagnostics.concat(diagnostic("MCP_MANIFEST_INVALID", "MCP server manifest must be an object.")));
    }
    if (!manifest.id) diagnostics.push(diagnostic("MCP_SERVER_ID_REQUIRED", "MCP server id is required."));
    if (!manifest.name) diagnostics.push(diagnostic("MCP_SERVER_NAME_REQUIRED", "MCP server name is required."));
    if (!manifest.version) diagnostics.push(diagnostic("MCP_SERVER_VERSION_REQUIRED", "MCP server version is required."));
    if (!manifest.source) diagnostics.push(diagnostic("MCP_SERVER_SOURCE_REQUIRED", "MCP server source is required."));
    if (!manifest.trust) diagnostics.push(diagnostic("MCP_SERVER_TRUST_REQUIRED", "MCP server trust is required."));
    if (!manifest.namespace || !isValidNamespace(manifest.namespace)) diagnostics.push(diagnostic("MCP_NAMESPACE_INVALID", "MCP namespace must use lowercase letters, numbers, dots, or dashes."));
    if (!manifest.transport || !isTransportKind(manifest.transport.kind)) diagnostics.push(diagnostic("MCP_TRANSPORT_INVALID", "MCP transport kind is invalid."));
    if (!Array.isArray(manifest.permissions)) diagnostics.push(diagnostic("MCP_PERMISSIONS_REQUIRED", "MCP permissions must be declared."));
    if (!Number.isFinite(manifest.timeoutMs) || manifest.timeoutMs <= 0) diagnostics.push(diagnostic("MCP_TIMEOUT_INVALID", "MCP timeoutMs must be a positive number."));
    if (manifest.schemaVersion && manifest.schemaVersion !== MCP_SCHEMA_VERSION) {
      diagnostics.push(diagnostic("MCP_SCHEMA_VERSION_UNSUPPORTED", "Unsupported MCP schema version."));
    }

    validateTools(manifest.tools ?? [], diagnostics);
    validateResources(manifest.resources ?? [], diagnostics);
    validatePrompts(manifest.prompts ?? [], diagnostics);

    if (diagnostics.length > 0) {
      return validationResult(false, diagnostics);
    }

    const normalized: McpServerManifest = {
      ...manifest,
      schemaVersion: MCP_SCHEMA_VERSION,
      enabled: manifest.enabled ?? true,
      tools: (manifest.tools ?? []).map(normalizeTool),
      resources: (manifest.resources ?? []).map(normalizeResource),
      prompts: (manifest.prompts ?? []).map((prompt) => ({
        ...prompt,
        description: prompt.description ?? prompt.name,
        argumentsSchema: prompt.argumentsSchema ?? {},
        redaction: prompt.redaction ?? { class: "internal", fields: ["metadata"] },
        metadata: redactMcpMetadata(prompt.metadata ?? {})
      })),
      compatibility: manifest.compatibility ?? { schemaVersion: MCP_SCHEMA_VERSION },
      redaction: manifest.redaction ?? { class: "internal", fields: ["metadata", "tools.metadata", "resources.metadata", "prompts.metadata"] },
      metadata: redactMcpMetadata(manifest.metadata ?? {})
    };
    return validationResult(true, diagnostics, normalized);
  }

  async connectServer(manifest: McpServerManifest, adapter?: McpServerAdapter): Promise<McpServerSummary> {
    const validation = await this.validateManifest(manifest);
    if (!validation.ok || !validation.normalized) {
      throw new Error(validation.diagnostics.map((item) => item.code).join(",") || "MCP_MANIFEST_INVALID");
    }
    if (this.servers.has(validation.normalized.id)) {
      throw new Error(`MCP_SERVER_DUPLICATE: ${validation.normalized.id}`);
    }
    const existingNamespaceOwner = this.namespaces.get(validation.normalized.namespace);
    if (existingNamespaceOwner) {
      throw new Error(`MCP_NAMESPACE_COLLISION: ${validation.normalized.namespace}`);
    }

    const health = initialHealth(validation.normalized, adapter);
    this.servers.set(validation.normalized.id, {
      manifest: deepFreeze(cloneJson(validation.normalized)),
      adapter,
      diagnostics: validation.diagnostics.concat(transportDiagnostic(validation.normalized, adapter)),
      health
    });
    this.namespaces.set(validation.normalized.namespace, validation.normalized.id);

    const stored = this.servers.get(validation.normalized.id);
    if (!stored) throw new Error("MCP_SERVER_REGISTRATION_FAILED");
    return summaryFor(stored);
  }

  async listServers(request?: McpListRequest): Promise<readonly McpServerSummary[]> {
    if (request && request.schemaVersion !== MCP_SCHEMA_VERSION) return [];
    return this.visibleServers(request).map(summaryFor);
  }

  async listTools(request: McpListRequest): Promise<readonly McpToolSummary[]> {
    if (request.schemaVersion !== MCP_SCHEMA_VERSION) return [];
    return this.visibleServers(request).flatMap((stored) => stored.manifest.tools?.map((tool) => toolSummary(stored, tool)) ?? []);
  }

  async listResources(request: McpListRequest): Promise<readonly McpResourceSummary[]> {
    if (request.schemaVersion !== MCP_SCHEMA_VERSION) return [];
    return this.visibleServers(request).flatMap((stored) => stored.manifest.resources?.map((resource) => resourceSummary(stored, resource)) ?? []);
  }

  async listPrompts(request: McpListRequest): Promise<readonly McpPromptSummary[]> {
    if (request.schemaVersion !== MCP_SCHEMA_VERSION) return [];
    return this.visibleServers(request).flatMap((stored) =>
      (stored.manifest.prompts ?? []).map((prompt) => deepFreeze({
        schemaVersion: MCP_SCHEMA_VERSION,
        serverId: stored.manifest.id,
        namespace: stored.manifest.namespace,
        name: prompt.name,
        qualifiedName: `${stored.manifest.namespace}.${prompt.name}`,
        description: prompt.description ?? prompt.name,
        argumentsSchema: prompt.argumentsSchema ?? {},
        trust: stored.manifest.trust,
        redaction: prompt.redaction ?? { class: "internal", fields: ["metadata"] },
        provenance: { source: "mcp-gateway", serverId: stored.manifest.id, namespace: stored.manifest.namespace },
        compatibility: { schemaVersion: MCP_SCHEMA_VERSION }
      }))
    );
  }

  async callTool(request: McpToolCallRequest): Promise<McpToolCallResult> {
    const startedAt = "1970-01-01T00:00:00.000Z";
    const requestValidation = validateCallRequest(request);
    const stored = this.servers.get(request.serverId);
    if (!stored || requestValidation.length > 0) {
      return toolCallResult(request, stored, undefined, "rejected", startedAt, undefined, requestValidation.concat(stored ? [] : [diagnostic("MCP_SERVER_NOT_FOUND", `MCP server not found: ${request.serverId}`)]));
    }
    const tool = stored.manifest.tools?.find((item) => item.name === request.name);
    const preflight = preflightServer(stored, "tool", request.name).concat(tool ? [] : [diagnostic("MCP_TOOL_NOT_FOUND", `MCP tool not found: ${request.name}`)]);
    if (!tool || preflight.length > 0) {
      return toolCallResult(request, stored, tool, preflightStatus(stored), startedAt, undefined, preflight);
    }
    const handler = stored.adapter?.toolHandlers?.[tool.name];
    if (!handler) {
      return toolCallResult(request, stored, tool, "unavailable", startedAt, undefined, [diagnostic("MCP_TOOL_HANDLER_UNAVAILABLE", `MCP tool handler unavailable: ${tool.name}`)]);
    }

    const timeoutMs = request.timeoutMs ?? tool.timeoutMs ?? stored.manifest.timeoutMs;
    try {
      const result = await withTimeout(handler(redactMcpMetadata(request.input), { manifest: stored.manifest, ...(request.trace ? { trace: request.trace } : {}) }), timeoutMs, "MCP_TOOL_TIMEOUT");
      if (!result.ok) {
        return toolCallResult(request, stored, tool, result.error?.code === "MCP_TOOL_TIMEOUT" ? "timed-out" : "failed", startedAt, undefined, [result.error ?? diagnostic("MCP_TOOL_FAILED", `MCP tool failed: ${tool.name}`)]);
      }
      return toolCallResult(request, stored, tool, "completed", startedAt, redactMcpMetadata(result.value ?? {}), stored.diagnostics.filter((item) => item.code === "MCP_TRANSPORT_UNAVAILABLE"));
    } catch (error) {
      const code = error instanceof Error && error.message === "MCP_TOOL_TIMEOUT" ? "MCP_TOOL_TIMEOUT" : "MCP_TOOL_FAILED";
      return toolCallResult(request, stored, tool, code === "MCP_TOOL_TIMEOUT" ? "timed-out" : "failed", startedAt, undefined, [diagnostic(code, error instanceof Error ? error.message : "MCP tool failed.")]);
    }
  }

  async readResource(request: McpResourceReadRequest): Promise<McpResourceReadResult> {
    const startedAt = "1970-01-01T00:00:00.000Z";
    const requestValidation = validateResourceReadRequest(request);
    const stored = this.servers.get(request.serverId);
    if (!stored || requestValidation.length > 0) {
      return resourceReadResult(request, stored, undefined, "rejected", startedAt, undefined, requestValidation.concat(stored ? [] : [diagnostic("MCP_SERVER_NOT_FOUND", `MCP server not found: ${request.serverId}`)]));
    }
    const resource = stored.manifest.resources?.find((item) => item.uri === request.uri);
    const preflight = preflightServer(stored, "resource", request.uri).concat(resource ? [] : [diagnostic("MCP_RESOURCE_NOT_FOUND", `MCP resource not found: ${request.uri}`)]);
    if (!resource || preflight.length > 0) {
      return resourceReadResult(request, stored, resource, preflightStatus(stored), startedAt, undefined, preflight);
    }
    const handler = stored.adapter?.resourceHandlers?.[resource.uri];
    if (!handler) {
      return resourceReadResult(request, stored, resource, "unavailable", startedAt, undefined, [diagnostic("MCP_RESOURCE_HANDLER_UNAVAILABLE", `MCP resource handler unavailable: ${resource.uri}`)]);
    }

    const timeoutMs = request.timeoutMs ?? stored.manifest.timeoutMs;
    try {
      const result = await withTimeout(handler({ manifest: stored.manifest, ...(request.trace ? { trace: request.trace } : {}) }), timeoutMs, "MCP_RESOURCE_TIMEOUT");
      if (!result.ok) {
        return resourceReadResult(request, stored, resource, result.error?.code === "MCP_RESOURCE_TIMEOUT" ? "timed-out" : "failed", startedAt, undefined, [result.error ?? diagnostic("MCP_RESOURCE_FAILED", `MCP resource failed: ${resource.uri}`)]);
      }
      return resourceReadResult(request, stored, resource, "completed", startedAt, result.value?.content ?? "", stored.diagnostics.filter((item) => item.code === "MCP_TRANSPORT_UNAVAILABLE"), result.value?.mimeType);
    } catch (error) {
      const code = error instanceof Error && error.message === "MCP_RESOURCE_TIMEOUT" ? "MCP_RESOURCE_TIMEOUT" : "MCP_RESOURCE_FAILED";
      return resourceReadResult(request, stored, resource, code === "MCP_RESOURCE_TIMEOUT" ? "timed-out" : "failed", startedAt, undefined, [diagnostic(code, error instanceof Error ? error.message : "MCP resource failed.")]);
    }
  }

  private visibleServers(request: McpListRequest | undefined): readonly StoredServer[] {
    return [...this.servers.values()]
      .filter((stored) => (request?.namespace ? stored.manifest.namespace === request.namespace : true))
      .filter((stored) => request?.includeInert === true || isVisible(stored))
      .sort(compareServers);
  }
}

export class FakeMcpGateway extends InMemoryMcpGateway {}

export function createMcpToolOutput(payload: JsonObject): JsonObject {
  return deepFreeze(redactMcpMetadata(payload));
}

function validateTools(tools: readonly McpToolDeclaration[], diagnostics: RedactedError[]): void {
  const names = new Set<string>();
  for (const tool of tools) {
    if (!tool.name || !isValidLocalName(tool.name)) diagnostics.push(diagnostic("MCP_TOOL_NAME_INVALID", "MCP tool name is invalid."));
    if (names.has(tool.name)) diagnostics.push(diagnostic("MCP_TOOL_DUPLICATE", `MCP tool is duplicated: ${tool.name}`));
    names.add(tool.name);
    if (!Array.isArray(tool.permissions)) diagnostics.push(diagnostic("MCP_TOOL_PERMISSIONS_REQUIRED", `MCP tool permissions are required: ${tool.name}`));
    if (!tool.inputSchema || typeof tool.inputSchema !== "object") diagnostics.push(diagnostic("MCP_TOOL_INPUT_SCHEMA_REQUIRED", `MCP tool input schema is required: ${tool.name}`));
    if (tool.timeoutMs !== undefined && (!Number.isFinite(tool.timeoutMs) || tool.timeoutMs <= 0)) diagnostics.push(diagnostic("MCP_TOOL_TIMEOUT_INVALID", `MCP tool timeoutMs is invalid: ${tool.name}`));
  }
}

function validateResources(resources: readonly McpResourceDeclaration[], diagnostics: RedactedError[]): void {
  const uris = new Set<string>();
  for (const resource of resources) {
    if (!resource.uri || !isSafeResourceUri(resource.uri)) diagnostics.push(diagnostic("MCP_RESOURCE_URI_INVALID", "MCP resource uri is invalid."));
    if (!resource.name) diagnostics.push(diagnostic("MCP_RESOURCE_NAME_REQUIRED", `MCP resource name is required: ${resource.uri}`));
    if (uris.has(resource.uri)) diagnostics.push(diagnostic("MCP_RESOURCE_DUPLICATE", `MCP resource is duplicated: ${resource.uri}`));
    uris.add(resource.uri);
    if (!Array.isArray(resource.permissions)) diagnostics.push(diagnostic("MCP_RESOURCE_PERMISSIONS_REQUIRED", `MCP resource permissions are required: ${resource.uri}`));
    if (!isCachePolicy(resource.cachePolicy)) diagnostics.push(diagnostic("MCP_RESOURCE_CACHE_POLICY_INVALID", `MCP resource cache policy is invalid: ${resource.uri}`));
  }
}

function validatePrompts(prompts: readonly { readonly name: string }[], diagnostics: RedactedError[]): void {
  const names = new Set<string>();
  for (const prompt of prompts) {
    if (!prompt.name || !isValidLocalName(prompt.name)) diagnostics.push(diagnostic("MCP_PROMPT_NAME_INVALID", "MCP prompt name is invalid."));
    if (names.has(prompt.name)) diagnostics.push(diagnostic("MCP_PROMPT_DUPLICATE", `MCP prompt is duplicated: ${prompt.name}`));
    names.add(prompt.name);
  }
}

function normalizeTool(tool: McpToolDeclaration): McpToolDeclaration {
  return {
    ...tool,
    description: tool.description ?? tool.name,
    outputSchema: tool.outputSchema ?? {},
    redaction: tool.redaction ?? { class: "internal", fields: ["metadata"] },
    metadata: redactMcpMetadata(tool.metadata ?? {})
  };
}

function normalizeResource(resource: McpResourceDeclaration): McpResourceDeclaration {
  return {
    ...resource,
    description: resource.description ?? resource.name,
    mimeType: resource.mimeType ?? "text/plain",
    redaction: resource.redaction ?? { class: "internal", fields: ["metadata", "content"] },
    metadata: redactMcpMetadata(resource.metadata ?? {})
  };
}

function initialHealth(manifest: McpServerManifest, adapter: McpServerAdapter | undefined): McpHealthStatus {
  if (manifest.enabled === false) return "disabled";
  if (manifest.trust === "untrusted") return "rejected";
  if (manifest.transport.kind !== "fake" && manifest.transport.kind !== "in-process" && !adapter) return "unavailable";
  return "connected";
}

function transportDiagnostic(manifest: McpServerManifest, adapter: McpServerAdapter | undefined): readonly RedactedError[] {
  if (manifest.transport.kind !== "fake" && manifest.transport.kind !== "in-process" && !adapter) {
    return [diagnostic("MCP_TRANSPORT_UNAVAILABLE", `MCP transport is unavailable in v1: ${manifest.transport.kind}`)];
  }
  return [];
}

function isVisible(stored: StoredServer): boolean {
  return stored.manifest.enabled !== false && stored.manifest.trust !== "untrusted" && stored.health === "connected";
}

function preflightServer(stored: StoredServer, targetKind: "tool" | "resource", target: string): readonly RedactedError[] {
  const diagnostics: RedactedError[] = [];
  if (stored.manifest.enabled === false) diagnostics.push(diagnostic("MCP_SERVER_DISABLED", `MCP server is disabled: ${stored.manifest.name}`));
  if (stored.manifest.trust === "untrusted") diagnostics.push(diagnostic("MCP_SERVER_UNTRUSTED", `MCP server is untrusted: ${stored.manifest.name}`));
  if (stored.health !== "connected") diagnostics.push(diagnostic(stored.health === "unavailable" ? "MCP_TRANSPORT_UNAVAILABLE" : "MCP_SERVER_UNHEALTHY", `MCP server cannot serve ${targetKind}: ${target}`));
  return diagnostics;
}

function preflightStatus(stored: StoredServer): McpOperationStatus {
  if (stored.health === "unavailable") return "unavailable";
  if (stored.health === "disabled" || stored.health === "rejected" || stored.manifest.enabled === false || stored.manifest.trust === "untrusted") return "inert";
  return "rejected";
}

function summaryFor(stored: StoredServer): McpServerSummary {
  const manifest = stored.manifest;
  return deepFreeze({
    schemaVersion: MCP_SCHEMA_VERSION,
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    namespace: manifest.namespace,
    source: manifest.source,
    trust: manifest.trust,
    transport: manifest.transport,
    permissions: manifest.permissions,
    timeoutMs: manifest.timeoutMs,
    enabled: manifest.enabled ?? true,
    health: stored.health,
    toolCount: manifest.tools?.length ?? 0,
    resourceCount: manifest.resources?.length ?? 0,
    promptCount: manifest.prompts?.length ?? 0,
    compatibility: manifest.compatibility ?? { schemaVersion: MCP_SCHEMA_VERSION },
    redaction: manifest.redaction ?? { class: "internal" }
  });
}

function toolSummary(stored: StoredServer, tool: McpToolDeclaration): McpToolSummary {
  return deepFreeze({
    schemaVersion: MCP_SCHEMA_VERSION,
    serverId: stored.manifest.id,
    namespace: stored.manifest.namespace,
    name: tool.name,
    qualifiedName: `${stored.manifest.namespace}.${tool.name}`,
    description: tool.description ?? tool.name,
    transport: stored.manifest.transport,
    trust: stored.manifest.trust,
    permissions: [...stored.manifest.permissions, ...tool.permissions],
    timeoutMs: tool.timeoutMs ?? stored.manifest.timeoutMs,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema ?? {},
    redaction: tool.redaction ?? { class: "internal" },
    provenance: { source: "mcp-gateway", serverId: stored.manifest.id, namespace: stored.manifest.namespace },
    compatibility: { schemaVersion: MCP_SCHEMA_VERSION }
  });
}

function resourceSummary(stored: StoredServer, resource: McpResourceDeclaration): McpResourceSummary {
  return deepFreeze({
    schemaVersion: MCP_SCHEMA_VERSION,
    serverId: stored.manifest.id,
    namespace: stored.manifest.namespace,
    uri: resource.uri,
    name: resource.name,
    description: resource.description ?? resource.name,
    mimeType: resource.mimeType ?? "text/plain",
    transport: stored.manifest.transport,
    trust: stored.manifest.trust,
    permissions: [...stored.manifest.permissions, ...resource.permissions],
    cachePolicy: resource.cachePolicy,
    redaction: resource.redaction ?? { class: "internal" },
    provenance: { source: "mcp-gateway", serverId: stored.manifest.id, namespace: stored.manifest.namespace, uri: resource.uri },
    compatibility: { schemaVersion: MCP_SCHEMA_VERSION }
  });
}

function toolCallResult(
  request: McpToolCallRequest,
  stored: StoredServer | undefined,
  tool: McpToolDeclaration | undefined,
  status: McpOperationStatus,
  startedAt: string,
  output: JsonObject | undefined,
  diagnostics: readonly RedactedError[]
): McpToolCallResult {
  const manifest = stored?.manifest;
  const timeoutMs = request.timeoutMs ?? tool?.timeoutMs ?? manifest?.timeoutMs ?? 0;
  const completedAt = status === "timed-out" ? new Date(Date.parse(startedAt) + timeoutMs).toISOString() : startedAt;
  const redactedOutput = output ? redactMcpMetadata(output) : undefined;
  const redactionClass = containsSecretMarker(JSON.stringify(redactedOutput ?? {})) ? "secret" as const : "internal" as const;
  const result = {
    schemaVersion: MCP_SCHEMA_VERSION,
    status,
    serverId: request.serverId,
    namespace: manifest?.namespace ?? "",
    name: request.name,
    qualifiedName: manifest ? `${manifest.namespace}.${request.name}` : request.name,
    caller: request.caller,
    startedAt,
    completedAt,
    durationMs: status === "timed-out" ? timeoutMs : 0,
    ...(redactedOutput ? { output: redactedOutput } : {}),
    diagnostics,
    trust: manifest?.trust ?? "untrusted" as TrustStatus,
    transport: manifest?.transport ?? ({ kind: "fake" } satisfies McpTransportDeclaration),
    permissions: manifest && tool ? [...manifest.permissions, ...tool.permissions] : [],
    timeoutMs,
    redaction: { class: redactionClass, fields: ["output", "diagnostics"] },
    audit: { source: "mcp-gateway", serverId: request.serverId, target: request.name, caller: request.caller },
    compatibility: { schemaVersion: MCP_SCHEMA_VERSION },
    replayFingerprint: ""
  };
  return deepFreeze({
    ...result,
    replayFingerprint: stableHash(JSON.stringify({
      status: result.status,
      serverId: result.serverId,
      name: result.name,
      caller: result.caller,
      output: result.output,
      diagnostics: result.diagnostics.map((item) => item.code)
    }))
  });
}

function resourceReadResult(
  request: McpResourceReadRequest,
  stored: StoredServer | undefined,
  resource: McpResourceDeclaration | undefined,
  status: McpOperationStatus,
  startedAt: string,
  content: string | undefined,
  diagnostics: readonly RedactedError[],
  mimeType?: string
): McpResourceReadResult {
  const manifest = stored?.manifest;
  const timeoutMs = request.timeoutMs ?? manifest?.timeoutMs ?? 0;
  const completedAt = status === "timed-out" ? new Date(Date.parse(startedAt) + timeoutMs).toISOString() : startedAt;
  const redactedContent = content === undefined ? undefined : redactSecretText(content);
  const redactionClass = containsSecretMarker(redactedContent ?? "") ? "secret" as const : resource?.redaction?.class ?? "internal" as const;
  const result = {
    schemaVersion: MCP_SCHEMA_VERSION,
    status,
    serverId: request.serverId,
    namespace: manifest?.namespace ?? "",
    uri: request.uri,
    caller: request.caller,
    startedAt,
    completedAt,
    durationMs: status === "timed-out" ? timeoutMs : 0,
    ...(redactedContent !== undefined ? { content: redactedContent } : {}),
    mimeType: mimeType ?? resource?.mimeType ?? "text/plain",
    cachePolicy: resource?.cachePolicy ?? "no-store",
    diagnostics,
    trust: manifest?.trust ?? "untrusted" as TrustStatus,
    transport: manifest?.transport ?? ({ kind: "fake" } satisfies McpTransportDeclaration),
    permissions: manifest && resource ? [...manifest.permissions, ...resource.permissions] : [],
    timeoutMs,
    redaction: { class: redactionClass, fields: ["content", "diagnostics"] },
    provenance: { source: "mcp-gateway", serverId: request.serverId, uri: request.uri },
    audit: { source: "mcp-gateway", serverId: request.serverId, target: request.uri, caller: request.caller },
    compatibility: { schemaVersion: MCP_SCHEMA_VERSION },
    replayFingerprint: ""
  };
  return deepFreeze({
    ...result,
    replayFingerprint: stableHash(JSON.stringify({
      status: result.status,
      serverId: result.serverId,
      uri: result.uri,
      caller: result.caller,
      content: result.content,
      diagnostics: result.diagnostics.map((item) => item.code)
    }))
  });
}

function validateCallRequest(request: McpToolCallRequest): readonly RedactedError[] {
  const diagnostics: RedactedError[] = [];
  if (request.schemaVersion !== MCP_SCHEMA_VERSION) diagnostics.push(diagnostic("MCP_SCHEMA_VERSION_UNSUPPORTED", "Unsupported MCP tool call schema version."));
  if (!request.serverId) diagnostics.push(diagnostic("MCP_SERVER_ID_REQUIRED", "MCP server id is required."));
  if (!request.name) diagnostics.push(diagnostic("MCP_TOOL_NAME_REQUIRED", "MCP tool name is required."));
  if (!request.caller) diagnostics.push(diagnostic("MCP_CALLER_REQUIRED", "MCP caller is required."));
  if (!request.input || typeof request.input !== "object") diagnostics.push(diagnostic("MCP_TOOL_INPUT_REQUIRED", "MCP tool input is required."));
  if (request.timeoutMs !== undefined && (!Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0)) diagnostics.push(diagnostic("MCP_TIMEOUT_INVALID", "MCP timeoutMs is invalid."));
  return diagnostics;
}

function validateResourceReadRequest(request: McpResourceReadRequest): readonly RedactedError[] {
  const diagnostics: RedactedError[] = [];
  if (request.schemaVersion !== MCP_SCHEMA_VERSION) diagnostics.push(diagnostic("MCP_SCHEMA_VERSION_UNSUPPORTED", "Unsupported MCP resource read schema version."));
  if (!request.serverId) diagnostics.push(diagnostic("MCP_SERVER_ID_REQUIRED", "MCP server id is required."));
  if (!request.uri) diagnostics.push(diagnostic("MCP_RESOURCE_URI_REQUIRED", "MCP resource uri is required."));
  if (!request.caller) diagnostics.push(diagnostic("MCP_CALLER_REQUIRED", "MCP caller is required."));
  if (request.timeoutMs !== undefined && (!Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0)) diagnostics.push(diagnostic("MCP_TIMEOUT_INVALID", "MCP timeoutMs is invalid."));
  return diagnostics;
}

function validationResult(ok: boolean, diagnostics: readonly RedactedError[], normalized?: McpServerManifest): McpValidationResult {
  return {
    schemaVersion: MCP_SCHEMA_VERSION,
    ok,
    diagnostics,
    ...(normalized ? { normalized } : {}),
    redaction: { class: "internal", fields: ["diagnostics", "normalized.metadata"] }
  };
}

function compareServers(left: StoredServer, right: StoredServer): number {
  return (
    trustRank(left.manifest.trust) - trustRank(right.manifest.trust) ||
    sourceRank(left.manifest.source) - sourceRank(right.manifest.source) ||
    left.manifest.namespace.localeCompare(right.manifest.namespace) ||
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(code)), Math.max(0, timeoutMs));
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

function redactMcpMetadata(metadata: JsonObject): JsonObject {
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

function isValidNamespace(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value);
}

function isValidLocalName(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_.-]*$/.test(value);
}

function isSafeResourceUri(value: string): boolean {
  return /^(mcp|file|https?):[^\s]+$/.test(value) && !value.includes("..");
}

function isTransportKind(value: unknown): boolean {
  return value === "stdio" || value === "http" || value === "websocket" || value === "in-process" || value === "ide" || value === "fake";
}

function isCachePolicy(value: unknown): boolean {
  return value === "no-store" || value === "session" || value === "workspace" || value === "persistent";
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
