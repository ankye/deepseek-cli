import type {
  CapabilityExecutorBinding,
  CapabilityManifest,
  JsonObject,
  JsonValue,
  McpGateway,
  McpServerAdapter,
  McpServerManifest,
  ToolFamilyArtifactKind,
  ToolFamilyDomainId,
  ToolFamilyId,
  ToolFamilyOperationProfile,
  ToolFamilyRiskClass
} from "@deepseek/platform-contracts";
import { MCP_SCHEMA_VERSION, TOOL_FAMILY_CATALOG_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { analyzeResourceScope, createSandboxAuditEvidence, createSandboxRequirement, createSecretRedactionDecision } from "@deepseek/policy-sandbox";

const deterministicTime = "1970-01-01T00:00:00.000Z";
const catalogVersion = "v1";

export interface McpGatewayFamilyCapabilityOptions {
  readonly gateway?: McpGateway;
}

interface FakePage {
  readonly pageId: string;
  url: string;
  title: string;
  dom: string;
  readonly fields: Map<string, string>;
  readonly clicks: string[];
  readonly console: string[];
  readonly network: string[];
}

interface FakeDesignNode {
  readonly id: string;
  name: string;
  type: string;
  text?: string;
  children: string[];
}

interface DisconnectableMcpGateway extends McpGateway {
  disconnectServer?(serverId: McpServerManifest["id"]): Promise<unknown>;
}

export function createMcpGatewayFamilyCapabilities(options: McpGatewayFamilyCapabilityOptions = {}): readonly CapabilityExecutorBinding[] {
  const gateway = options.gateway;
  const pages = new Map<string, FakePage>();
  const design = createDesignState();
  return [
    binding("mcp-gateway.browser-navigate", "browser.navigate", "Navigate browser page", "browser-automation", "external-connector", ["browser", "connector"], "read", (input) => browserNavigate(pages, input)),
    binding("mcp-gateway.browser-interact", "browser.interact", "Interact with browser page", "browser-automation", "external-connector", ["browser", "connector", "write"], "write", (input) => browserInteract(pages, input)),
    binding("mcp-gateway.browser-inspect", "browser.inspect", "Inspect browser page", "browser-automation", "external-connector", ["browser", "read"], "read", (input) => browserInspect(pages, input)),
    binding("mcp-gateway.browser-screenshot", "browser.screenshot", "Capture browser screenshot", "browser-automation", "external-connector", ["browser", "artifact"], "read", (input) => browserScreenshot(pages, input)),
    binding("mcp-gateway.mcp-server-lifecycle", "mcp.server-lifecycle", "Manage MCP server lifecycle", "mcp-connectors", "external-connector", ["connector", "read"], "read", (input) => mcpLifecycle(gateway, input)),
    binding("mcp-gateway.mcp-tool-call", "mcp.tool-call", "Call MCP tool", "mcp-connectors", "external-connector", ["connector", "write"], "write", (input) => mcpToolCall(gateway, input)),
    binding("mcp-gateway.mcp-resource-read", "mcp.resource-read", "Read MCP resource", "mcp-connectors", "external-connector", ["connector", "read"], "read", (input) => mcpResourceRead(gateway, input)),
    binding("mcp-gateway.mcp-prompt", "mcp.prompt", "List or render MCP prompt", "mcp-connectors", "external-connector", ["connector", "read"], "read", (input) => mcpPrompt(gateway, input)),
    binding("mcp-gateway.design-document-state", "design.document-state", "Read design document state", "design-canvas", "design", ["design", "read"], "read", () => designDocumentState(design)),
    binding("mcp-gateway.design-node-query", "design.node-query", "Query design nodes", "design-canvas", "design", ["design", "read"], "read", (input) => designNodeQuery(design, input)),
    binding("mcp-gateway.design-batch-edit", "design.batch-edit", "Apply design batch edit", "design-canvas", "design", ["design", "write"], "write", (input) => designBatchEdit(design, input)),
    binding("mcp-gateway.design-export-snapshot", "design.export-snapshot", "Export design snapshot", "design-canvas", "design", ["design", "artifact"], "read", (input) => designExportSnapshot(design, input))
  ];
}

function browserNavigate(pages: Map<string, FakePage>, input: JsonObject) {
  const url = stringValue(input.url) ?? "about:blank";
  const pageId = stringValue(input.pageId) ?? `page:${stableHash(url)}`;
  const page: FakePage = {
    pageId,
    url,
    title: titleForUrl(url),
    dom: `<main><h1>${titleForUrl(url)}</h1><input id="q" value=""><button id="go">Go</button></main>`,
    fields: new Map(),
    clicks: [],
    console: [],
    network: [`GET ${url}`]
  };
  pages.set(pageId, page);
  return ok({ familyId: "browser.navigate", pageId, url, title: page.title, evidence: evidence("browser.navigate", "mcp-gateway.browser-navigate") });
}

function browserInteract(pages: Map<string, FakePage>, input: JsonObject) {
  const page = pages.get(stringValue(input.pageId) ?? "") ?? ensurePage(pages);
  const operation = stringValue(input.operation) ?? "click";
  const selector = stringValue(input.selector) ?? "body";
  if (operation === "type" || operation === "select") page.fields.set(selector, redactSecretText(stringValue(input.value) ?? ""));
  if (operation === "click") page.clicks.push(selector);
  page.console.push(`fake:${operation}:${selector}`);
  return ok({
    familyId: "browser.interact",
    pageId: page.pageId,
    operation,
    selector,
    state: pageState(page),
    evidence: evidence("browser.interact", "mcp-gateway.browser-interact")
  });
}

function browserInspect(pages: Map<string, FakePage>, input: JsonObject) {
  const page = pages.get(stringValue(input.pageId) ?? "") ?? ensurePage(pages);
  return ok({
    familyId: "browser.inspect",
    pageId: page.pageId,
    url: page.url,
    title: page.title,
    dom: page.dom.slice(0, 1_000),
    console: page.console.slice(-20),
    network: page.network.slice(-20),
    state: pageState(page),
    truncated: page.dom.length > 1_000,
    evidence: evidence("browser.inspect", "mcp-gateway.browser-inspect")
  });
}

function browserScreenshot(pages: Map<string, FakePage>, input: JsonObject) {
  const page = pages.get(stringValue(input.pageId) ?? "") ?? ensurePage(pages);
  const shot = artifact("browser.screenshot", "screenshot", stableHash(`${page.pageId}:${page.url}`), "image/png", `fake screenshot ${page.title}`);
  return ok({ familyId: "browser.screenshot", pageId: page.pageId, artifact: shot, artifacts: [shot], evidence: evidence("browser.screenshot", "mcp-gateway.browser-screenshot") });
}

async function mcpLifecycle(gateway: McpGateway | undefined, input: JsonObject) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const action = stringValue(input.action) ?? "list";
  if (action === "connect") {
    const manifest = isJsonObject(input.manifest) ? input.manifest as unknown as McpServerManifest : defaultMcpManifest();
    const summary = await gateway.connectServer(manifest, defaultMcpAdapter());
    return ok({ familyId: "mcp.server-lifecycle", action, summary, evidence: evidence("mcp.server-lifecycle", "mcp-gateway.mcp-server-lifecycle") });
  }
  if (action === "disconnect") {
    const disconnected = await (gateway as DisconnectableMcpGateway).disconnectServer?.(asId<"mcpServer">(stringValue(input.serverId) ?? "mcp-family-fake"));
    return ok({ familyId: "mcp.server-lifecycle", action, disconnected: disconnected ? toJson(disconnected) : null, evidence: evidence("mcp.server-lifecycle", "mcp-gateway.mcp-server-lifecycle") });
  }
  const servers = await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION, includeInert: input.includeInert === true });
  return ok({ familyId: "mcp.server-lifecycle", action: "list", servers, count: servers.length, evidence: evidence("mcp.server-lifecycle", "mcp-gateway.mcp-server-lifecycle") });
}

async function mcpToolCall(gateway: McpGateway | undefined, input: JsonObject) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const result = await gateway.callTool({
    schemaVersion: MCP_SCHEMA_VERSION,
    serverId: asId<"mcpServer">(stringValue(input.serverId) ?? "mcp-family-fake"),
    name: stringValue(input.name) ?? "echo",
    caller: "runtime",
    input: isJsonObject(input.input) ? input.input : {}
  });
  return ok({ familyId: "mcp.tool-call", result, authEvidence: result.auth ?? null, evidence: evidence("mcp.tool-call", "mcp-gateway.mcp-tool-call") });
}

async function mcpResourceRead(gateway: McpGateway | undefined, input: JsonObject) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const result = await gateway.readResource({
    schemaVersion: MCP_SCHEMA_VERSION,
    serverId: asId<"mcpServer">(stringValue(input.serverId) ?? "mcp-family-fake"),
    uri: stringValue(input.uri) ?? "mcp://family/readme",
    caller: "runtime"
  });
  return ok({ familyId: "mcp.resource-read", result, cachePolicy: result.cachePolicy, evidence: evidence("mcp.resource-read", "mcp-gateway.mcp-resource-read") });
}

async function mcpPrompt(gateway: McpGateway | undefined, input: JsonObject) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const prompts = await gateway.listPrompts({ schemaVersion: MCP_SCHEMA_VERSION, includeInert: false });
  const name = stringValue(input.name);
  const selected = prompts.find((prompt) => prompt.name === name || prompt.qualifiedName === name) ?? prompts[0];
  return ok({
    familyId: "mcp.prompt",
    prompts,
    rendered: selected ? `Prompt ${selected.qualifiedName}: ${JSON.stringify(redactValue(input.arguments ?? {})).slice(0, 500)}` : "",
    evidence: evidence("mcp.prompt", "mcp-gateway.mcp-prompt")
  });
}

function designDocumentState(design: Map<string, FakeDesignNode>) {
  return ok({ familyId: "design.document-state", documentId: "design:fake", nodeCount: design.size, rootNodeId: "root", nodes: [...design.values()].map(publicDesignNode), evidence: evidence("design.document-state", "mcp-gateway.design-document-state") });
}

function designNodeQuery(design: Map<string, FakeDesignNode>, input: JsonObject) {
  const query = stringValue(input.query)?.toLowerCase();
  const nodeId = stringValue(input.nodeId);
  const nodes = [...design.values()]
    .filter((node) => nodeId ? node.id === nodeId : query ? node.name.toLowerCase().includes(query) || node.type.toLowerCase().includes(query) : true)
    .slice(0, 25)
    .map(publicDesignNode);
  return ok({ familyId: "design.node-query", nodes, count: nodes.length, truncated: design.size > nodes.length, evidence: evidence("design.node-query", "mcp-gateway.design-node-query") });
}

function designBatchEdit(design: Map<string, FakeDesignNode>, input: JsonObject) {
  const operations = Array.isArray(input.operations) ? input.operations.filter(isJsonObject).slice(0, 20) : [];
  const snapshot = new Map([...design].map(([key, value]) => [key, { ...value, children: [...value.children] }]));
  try {
    for (const operation of operations) applyDesignOperation(design, operation);
    return ok({ familyId: "design.batch-edit", status: "completed", operationCount: operations.length, rollbackAvailable: true, evidence: evidence("design.batch-edit", "mcp-gateway.design-batch-edit") });
  } catch (error) {
    design.clear();
    for (const [key, value] of snapshot) design.set(key, value);
    return ok({ familyId: "design.batch-edit", status: "rolled-back", operationCount: operations.length, diagnostic: error instanceof Error ? error.message : "DESIGN_EDIT_FAILED", rollbackAvailable: true, evidence: evidence("design.batch-edit", "mcp-gateway.design-batch-edit") });
  }
}

function designExportSnapshot(_design: Map<string, FakeDesignNode>, input: JsonObject) {
  const nodeId = stringValue(input.nodeId) ?? "root";
  const format = stringValue(input.format) ?? "png";
  const snapshot = artifact("design.export-snapshot", "design-export", stableHash(`${nodeId}:${format}`), format === "pdf" ? "application/pdf" : "image/png", `fake design export ${nodeId}.${format}`);
  return ok({ familyId: "design.export-snapshot", nodeId, format, artifact: snapshot, artifacts: [snapshot], evidence: evidence("design.export-snapshot", "mcp-gateway.design-export-snapshot") });
}

function binding(
  id: string,
  familyId: ToolFamilyId,
  name: string,
  domainId: ToolFamilyDomainId,
  riskClass: ToolFamilyRiskClass,
  operationProfiles: readonly ToolFamilyOperationProfile[],
  sideEffect: CapabilityManifest["sideEffect"],
  execute: (input: JsonObject) => JsonObject | Promise<JsonObject>
): CapabilityExecutorBinding {
  const resourceScope = analyzeResourceScope({}, sideEffect);
  const sandboxRequirements = createSandboxRequirement({ sideEffect, resourceScope, timeoutMs: 1_000, permissions: [`${domainId}:fake`, "connector:read"] });
  return {
    manifest: {
      id: asId<"capability">(id),
      name,
      description: `${familyId} fake-first connector capability`,
      source: "@deepseek/mcp-gateway",
      version: "0.1.0",
      trust: "trusted",
      sideEffect,
      permissions: [`${domainId}:fake`, "connector:read"],
      inputSchema: { type: "object", additionalProperties: true },
      outputSchema: { type: "object", additionalProperties: true },
      enabled: true,
      timeoutMs: 1_000,
      projection: { modelVisible: true, outputBounded: true, connectorTrust: "fake", providerSupport: "fake", policyTags: ["fake-first", domainId], agentScopeIds: ["default"] },
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
        hostRequirements: ["fake-connector"],
        connectorProfile: domainId === "mcp-connectors" ? "mcp" : "provider",
        scorecardRubricId: `rubric.${familyId}.baseline`,
        redaction: { class: "public" }
      },
      secretExposure: createSecretRedactionDecision("", { class: "public" }),
      resourceScope,
      ["sandboxRequirements"]: sandboxRequirements,
      audit: createSandboxAuditEvidence({
        decision: "manifest",
        reasonCode: "manifest.fake-connector",
        subject: "@deepseek/mcp-gateway",
        resource: id,
        ["sandboxProfile"]: sandboxRequirements.profile
      }),
      security: { modelVisible: true, outputRedaction: "internal", preflight: "fake-connector" }
    },
    execute: async (input) => ({ ok: true, value: await execute(input) })
  };
}

function defaultMcpManifest(): McpServerManifest {
  return {
    schemaVersion: MCP_SCHEMA_VERSION,
    id: asId<"mcpServer">("mcp-family-fake"),
    name: "family fake",
    version: "1.0.0",
    namespace: "family",
    source: "built-in",
    trust: "trusted",
    transport: { kind: "fake" },
    permissions: ["mcp:read"],
    timeoutMs: 100,
    tools: [{ name: "echo", inputSchema: {}, outputSchema: {}, permissions: ["mcp:tool"], timeoutMs: 100 }],
    resources: [{ uri: "mcp://family/readme", name: "readme", permissions: ["mcp:resource"], cachePolicy: "session" }],
    prompts: [{ name: "summarize", argumentsSchema: {} }]
  };
}

function defaultMcpAdapter(): McpServerAdapter {
  return {
    toolHandlers: {
      echo: async (input) => ({ ok: true, value: redactValue({ echoed: input, fixtureCredential: "credentialRef:family-fake" }) as JsonObject })
    },
    resourceHandlers: {
      "mcp://family/readme": async () => ({ ok: true, value: { content: "fake MCP resource TOKEN=familysecret", mimeType: "text/plain" } })
    }
  };
}

function createDesignState(): Map<string, FakeDesignNode> {
  return new Map([
    ["root", { id: "root", name: "Document", type: "frame", children: ["title"] }],
    ["title", { id: "title", name: "Title", type: "text", text: "DeepSeek", children: [] }]
  ]);
}

function applyDesignOperation(design: Map<string, FakeDesignNode>, operation: JsonObject): void {
  const type = stringValue(operation.type);
  const nodeId = stringValue(operation.nodeId) ?? stringValue(operation.id);
  if (type === "insert") {
    const id = nodeId ?? `node:${stableHash(JSON.stringify(operation))}`;
    if (design.has(id)) throw new Error("DESIGN_NODE_DUPLICATE");
    const text = stringValue(operation.text);
    design.set(id, { id, name: stringValue(operation.name) ?? id, type: stringValue(operation.nodeType) ?? "frame", ...(text !== undefined ? { text } : {}), children: [] });
    return;
  }
  if (!nodeId || !design.has(nodeId)) throw new Error("DESIGN_NODE_NOT_FOUND");
  if (type === "update") {
    const node = design.get(nodeId);
    if (!node) throw new Error("DESIGN_NODE_NOT_FOUND");
    node.name = stringValue(operation.name) ?? node.name;
    const text = stringValue(operation.text);
    if (text !== undefined) node.text = text;
    return;
  }
  if (type === "delete") {
    if (nodeId === "root") throw new Error("DESIGN_ROOT_DELETE_REJECTED");
    design.delete(nodeId);
    return;
  }
  throw new Error("DESIGN_OPERATION_UNSUPPORTED");
}

function ensurePage(pages: Map<string, FakePage>): FakePage {
  if (pages.size === 0) browserNavigate(pages, { url: "about:blank" });
  return [...pages.values()][0] as FakePage;
}

function pageState(page: FakePage): JsonObject {
  return {
    fields: Object.fromEntries(page.fields),
    clicks: page.clicks.slice(-20)
  };
}

function publicDesignNode(node: FakeDesignNode): JsonObject {
  return { id: node.id, name: node.name, type: node.type, text: node.text ? redactSecretText(node.text).slice(0, 500) : undefined, children: node.children };
}

function titleForUrl(url: string): string {
  return url === "about:blank" ? "Blank" : `Fake page ${new URL(url, "https://example.test").hostname}`;
}

function artifact(familyId: ToolFamilyId, kind: ToolFamilyArtifactKind, key: string, mimeType: string, preview: string): JsonObject {
  return {
    artifactId: `artifact:${familyId}:${key}`,
    familyId,
    kind,
    uri: `artifact://fake/${familyId}/${key}`,
    mimeType,
    byteLength: 1024,
    sha256: stableHash(`${familyId}:${key}:${preview}`),
    preview: redactSecretText(preview).slice(0, 200),
    truncated: preview.length > 200,
    createdAt: deterministicTime,
    redaction: { class: "internal" }
  };
}

function evidence(familyId: ToolFamilyId, capabilityId: string): JsonObject {
  return { mode: "fake", providerNativeSupport: "unsupported", capabilityId, familyId, replayRef: `replay:${capabilityId}`, createdAt: deterministicTime, redaction: { class: "public" } };
}

function ok(value: JsonObject): JsonObject {
  return value;
}

function toJson(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function fail(code: string, message: string): JsonObject {
  return { familyId: "mcp.server-lifecycle", status: "failed", diagnostics: [{ code, message, retryable: false, redaction: { class: "public" } }], redaction: { class: "internal" } };
}

function redactValue(value: JsonValue): JsonValue {
  if (typeof value === "string") return redactSecretText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    const output: Record<string, JsonValue> = {};
    for (const [key, nested] of Object.entries(value)) output[key] = /token|secret|password|api[_-]?key/i.test(key) ? "[REDACTED:secret]" : redactValue(nested as JsonValue);
    return output;
  }
  return value;
}

function redactSecretText(value: string): string {
  return value.replace(/\b(?:sk|ds)-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]").replace(/\b[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s"',;]+/gi, (match) => `${match.split("=")[0]}=[REDACTED:secret]`);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
