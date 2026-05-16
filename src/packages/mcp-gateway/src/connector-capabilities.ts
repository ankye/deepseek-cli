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
const userAgent = "deepseek-cli-native-connector/0.1";
type ConnectorCapabilityMode = "fake" | "native";

export interface McpGatewayFamilyCapabilityOptions {
  readonly gateway?: McpGateway;
  readonly mode?: ConnectorCapabilityMode;
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
  const mode = options.mode ?? "fake";
  const pages = new Map<string, FakePage>();
  const design = createDesignState(mode);
  return [
    binding("mcp-gateway.browser-navigate", "browser.navigate", "Navigate browser page", "browser-automation", "external-connector", ["browser", "connector"], "read", mode, (input) => browserNavigate(pages, input, mode)),
    binding("mcp-gateway.browser-interact", "browser.interact", "Interact with browser page", "browser-automation", "external-connector", ["browser", "connector", "write"], "write", mode, (input) => browserInteract(pages, input, mode)),
    binding("mcp-gateway.browser-inspect", "browser.inspect", "Inspect browser page", "browser-automation", "external-connector", ["browser", "read"], "read", mode, (input) => browserInspect(pages, input, mode)),
    binding("mcp-gateway.browser-screenshot", "browser.screenshot", "Capture browser screenshot", "browser-automation", "external-connector", ["browser", "artifact"], "read", mode, (input) => browserScreenshot(pages, input, mode)),
    binding("mcp-gateway.mcp-server-lifecycle", "mcp.server-lifecycle", "Manage MCP server lifecycle", "mcp-connectors", "external-connector", ["connector", "read"], "read", mode, (input) => mcpLifecycle(gateway, input, mode)),
    binding("mcp-gateway.mcp-tool-call", "mcp.tool-call", "Call MCP tool", "mcp-connectors", "external-connector", ["connector", "write"], "write", mode, (input) => mcpToolCall(gateway, input, mode)),
    binding("mcp-gateway.mcp-resource-read", "mcp.resource-read", "Read MCP resource", "mcp-connectors", "external-connector", ["connector", "read"], "read", mode, (input) => mcpResourceRead(gateway, input, mode)),
    binding("mcp-gateway.mcp-prompt", "mcp.prompt", "List or render MCP prompt", "mcp-connectors", "external-connector", ["connector", "read"], "read", mode, (input) => mcpPrompt(gateway, input, mode)),
    binding("mcp-gateway.design-document-state", "design.document-state", "Read design document state", "design-canvas", "design", ["design", "read"], "read", mode, () => designDocumentState(design, mode)),
    binding("mcp-gateway.design-node-query", "design.node-query", "Query design nodes", "design-canvas", "design", ["design", "read"], "read", mode, (input) => designNodeQuery(design, input, mode)),
    binding("mcp-gateway.design-batch-edit", "design.batch-edit", "Apply design batch edit", "design-canvas", "design", ["design", "write"], "write", mode, (input) => designBatchEdit(design, input, mode)),
    binding("mcp-gateway.design-export-snapshot", "design.export-snapshot", "Export design snapshot", "design-canvas", "design", ["design", "artifact"], "read", mode, (input) => designExportSnapshot(design, input, mode))
  ];
}

async function browserNavigate(pages: Map<string, FakePage>, input: JsonObject, mode: ConnectorCapabilityMode) {
  const url = stringValue(input.url) ?? "about:blank";
  const pageId = stringValue(input.pageId) ?? `page:${stableHash(url)}`;
  const fetched = mode === "native" && url !== "about:blank" ? await fetchPage(url) : undefined;
  if (fetched?.ok === false) return fetched.result;
  const html = fetched?.html ?? `<main><h1>${titleForUrl(url)}</h1><input id="q" value=""><button id="go">Go</button></main>`;
  const page: FakePage = {
    pageId,
    url: fetched?.finalUrl ?? url,
    title: extractTitle(html) || titleForUrl(url),
    dom: html,
    fields: new Map(),
    clicks: [],
    console: [],
    network: [`GET ${url}${fetched ? ` ${fetched.status}` : ""}`]
  };
  pages.set(pageId, page);
  return ok({ familyId: "browser.navigate", pageId, url: page.url, title: page.title, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("browser.navigate", "mcp-gateway.browser-navigate", mode) });
}

function browserInteract(pages: Map<string, FakePage>, input: JsonObject, mode: ConnectorCapabilityMode) {
  const page = pages.get(stringValue(input.pageId) ?? "") ?? ensurePage(pages);
  const operation = stringValue(input.operation) ?? "click";
  const selector = stringValue(input.selector) ?? "body";
  if (operation === "type" || operation === "select") page.fields.set(selector, redactSecretText(stringValue(input.value) ?? ""));
  if (operation === "click") {
    page.clicks.push(selector);
    const href = firstHref(page.dom);
    if (mode === "native" && href) page.network.push(`CLICK ${selector} -> ${href}`);
  }
  page.console.push(`${mode}:${operation}:${selector}`);
  return ok({
    familyId: "browser.interact",
    pageId: page.pageId,
    operation,
    selector,
    state: pageState(page),
    providerNativeSupport: providerNativeSupport(mode),
    evidence: evidence("browser.interact", "mcp-gateway.browser-interact", mode)
  });
}

function browserInspect(pages: Map<string, FakePage>, input: JsonObject, mode: ConnectorCapabilityMode) {
  const page = pages.get(stringValue(input.pageId) ?? "") ?? ensurePage(pages);
  return ok({
    familyId: "browser.inspect",
    pageId: page.pageId,
    url: page.url,
    title: page.title,
    dom: page.dom.slice(0, 1_000),
    console: page.console.slice(-20),
    network: page.network.slice(-20),
    links: extractLinks(page.dom).slice(0, 20),
    state: pageState(page),
    truncated: page.dom.length > 1_000,
    providerNativeSupport: providerNativeSupport(mode),
    evidence: evidence("browser.inspect", "mcp-gateway.browser-inspect", mode)
  });
}

function browserScreenshot(pages: Map<string, FakePage>, input: JsonObject, mode: ConnectorCapabilityMode) {
  const page = pages.get(stringValue(input.pageId) ?? "") ?? ensurePage(pages);
  const shot = mode === "native"
    ? svgArtifact("browser.screenshot", "screenshot", stableHash(`${page.pageId}:${page.url}`), page.title, page.dom)
    : artifact("browser.screenshot", "screenshot", stableHash(`${page.pageId}:${page.url}`), "image/png", `fake screenshot ${page.title}`, mode);
  return ok({ familyId: "browser.screenshot", pageId: page.pageId, artifact: shot, artifacts: [shot], providerNativeSupport: providerNativeSupport(mode), evidence: evidence("browser.screenshot", "mcp-gateway.browser-screenshot", mode) });
}

async function mcpLifecycle(gateway: McpGateway | undefined, input: JsonObject, mode: ConnectorCapabilityMode) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const action = stringValue(input.action) ?? "list";
  if (action === "connect") {
    const manifest = isJsonObject(input.manifest) ? input.manifest as unknown as McpServerManifest : defaultMcpManifest();
    const summary = mode === "native" ? await gateway.connectServer(manifest) : await gateway.connectServer(manifest, defaultMcpAdapter());
    return ok({ familyId: "mcp.server-lifecycle", action, summary, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("mcp.server-lifecycle", "mcp-gateway.mcp-server-lifecycle", mode) });
  }
  if (action === "disconnect") {
    const disconnected = await (gateway as DisconnectableMcpGateway).disconnectServer?.(asId<"mcpServer">(stringValue(input.serverId) ?? "mcp-family-fake"));
    return ok({ familyId: "mcp.server-lifecycle", action, disconnected: disconnected ? toJson(disconnected) : null, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("mcp.server-lifecycle", "mcp-gateway.mcp-server-lifecycle", mode) });
  }
  const servers = await gateway.listServers({ schemaVersion: MCP_SCHEMA_VERSION, includeInert: input.includeInert === true });
  return ok({ familyId: "mcp.server-lifecycle", action: "list", servers, count: servers.length, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("mcp.server-lifecycle", "mcp-gateway.mcp-server-lifecycle", mode) });
}

async function mcpToolCall(gateway: McpGateway | undefined, input: JsonObject, mode: ConnectorCapabilityMode) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const result = await gateway.callTool({
    schemaVersion: MCP_SCHEMA_VERSION,
    serverId: asId<"mcpServer">(stringValue(input.serverId) ?? "mcp-family-fake"),
    name: stringValue(input.name) ?? "echo",
    caller: "runtime",
    input: isJsonObject(input.input) ? input.input : {}
  });
  return ok({ familyId: "mcp.tool-call", result, authEvidence: result.auth ?? null, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("mcp.tool-call", "mcp-gateway.mcp-tool-call", mode) });
}

async function mcpResourceRead(gateway: McpGateway | undefined, input: JsonObject, mode: ConnectorCapabilityMode) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const result = await gateway.readResource({
    schemaVersion: MCP_SCHEMA_VERSION,
    serverId: asId<"mcpServer">(stringValue(input.serverId) ?? "mcp-family-fake"),
    uri: stringValue(input.uri) ?? "mcp://family/readme",
    caller: "runtime"
  });
  return ok({ familyId: "mcp.resource-read", result, cachePolicy: result.cachePolicy, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("mcp.resource-read", "mcp-gateway.mcp-resource-read", mode) });
}

async function mcpPrompt(gateway: McpGateway | undefined, input: JsonObject, mode: ConnectorCapabilityMode) {
  if (!gateway) return fail("MCP_GATEWAY_UNAVAILABLE", "MCP gateway is not configured.");
  const prompts = await gateway.listPrompts({ schemaVersion: MCP_SCHEMA_VERSION, includeInert: false });
  const name = stringValue(input.name);
  const selected = prompts.find((prompt) => prompt.name === name || prompt.qualifiedName === name) ?? prompts[0];
  return ok({
    familyId: "mcp.prompt",
    prompts,
    rendered: selected ? `Prompt ${selected.qualifiedName}: ${JSON.stringify(redactValue(input.arguments ?? {})).slice(0, 500)}` : "",
    providerNativeSupport: providerNativeSupport(mode),
    evidence: evidence("mcp.prompt", "mcp-gateway.mcp-prompt", mode)
  });
}

function designDocumentState(design: Map<string, FakeDesignNode>, mode: ConnectorCapabilityMode) {
  return ok({ familyId: "design.document-state", documentId: `design:${mode}`, nodeCount: design.size, rootNodeId: "root", nodes: [...design.values()].map(publicDesignNode), providerNativeSupport: providerNativeSupport(mode), evidence: evidence("design.document-state", "mcp-gateway.design-document-state", mode) });
}

function designNodeQuery(design: Map<string, FakeDesignNode>, input: JsonObject, mode: ConnectorCapabilityMode) {
  const query = stringValue(input.query)?.toLowerCase();
  const nodeId = stringValue(input.nodeId);
  const nodes = [...design.values()]
    .filter((node) => nodeId ? node.id === nodeId : query ? node.name.toLowerCase().includes(query) || node.type.toLowerCase().includes(query) : true)
    .slice(0, 25)
    .map(publicDesignNode);
  return ok({ familyId: "design.node-query", nodes, count: nodes.length, truncated: design.size > nodes.length, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("design.node-query", "mcp-gateway.design-node-query", mode) });
}

function designBatchEdit(design: Map<string, FakeDesignNode>, input: JsonObject, mode: ConnectorCapabilityMode) {
  const operations = Array.isArray(input.operations) ? input.operations.filter(isJsonObject).slice(0, 20) : [];
  const snapshot = new Map([...design].map(([key, value]) => [key, { ...value, children: [...value.children] }]));
  try {
    for (const operation of operations) applyDesignOperation(design, operation);
    return ok({ familyId: "design.batch-edit", status: "completed", operationCount: operations.length, rollbackAvailable: true, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("design.batch-edit", "mcp-gateway.design-batch-edit", mode) });
  } catch (error) {
    design.clear();
    for (const [key, value] of snapshot) design.set(key, value);
    return ok({ familyId: "design.batch-edit", status: "rolled-back", operationCount: operations.length, diagnostic: error instanceof Error ? error.message : "DESIGN_EDIT_FAILED", rollbackAvailable: true, providerNativeSupport: providerNativeSupport(mode), evidence: evidence("design.batch-edit", "mcp-gateway.design-batch-edit", mode) });
  }
}

function designExportSnapshot(design: Map<string, FakeDesignNode>, input: JsonObject, mode: ConnectorCapabilityMode) {
  const nodeId = stringValue(input.nodeId) ?? "root";
  const format = stringValue(input.format) ?? "png";
  const node = design.get(nodeId);
  const snapshot = mode === "native"
    ? svgArtifact("design.export-snapshot", "design-export", stableHash(`${nodeId}:${format}`), node?.name ?? nodeId, JSON.stringify([...design.values()].map(publicDesignNode)))
    : artifact("design.export-snapshot", "design-export", stableHash(`${nodeId}:${format}`), format === "pdf" ? "application/pdf" : "image/png", `fake design export ${nodeId}.${format}`, mode);
  return ok({ familyId: "design.export-snapshot", nodeId, format, artifact: snapshot, artifacts: [snapshot], providerNativeSupport: providerNativeSupport(mode), evidence: evidence("design.export-snapshot", "mcp-gateway.design-export-snapshot", mode) });
}

function binding(
  id: string,
  familyId: ToolFamilyId,
  name: string,
  domainId: ToolFamilyDomainId,
  riskClass: ToolFamilyRiskClass,
  operationProfiles: readonly ToolFamilyOperationProfile[],
  sideEffect: CapabilityManifest["sideEffect"],
  mode: ConnectorCapabilityMode,
  execute: (input: JsonObject) => JsonObject | Promise<JsonObject>
): CapabilityExecutorBinding {
  const resourceScope = analyzeResourceScope({}, sideEffect);
  const native = mode === "native";
  const sandboxRequirements = createSandboxRequirement({ sideEffect, resourceScope, timeoutMs: 10_000, permissions: [`${domainId}:${mode}`, "connector:read"] });
  return {
    manifest: {
      id: asId<"capability">(id),
      name,
      description: `${familyId} ${native ? "native" : "fake-first"} connector capability`,
      source: "@deepseek/mcp-gateway",
      version: "0.1.0",
      trust: "trusted",
      sideEffect,
      permissions: [`${domainId}:${mode}`, "connector:read"],
      inputSchema: { type: "object", additionalProperties: true },
      outputSchema: { type: "object", additionalProperties: true },
      enabled: true,
      timeoutMs: 10_000,
      projection: { modelVisible: true, outputBounded: true, connectorTrust: native ? "trusted" : "fake", providerSupport: native ? "native" : "fake", policyTags: [native ? "native-connector" : "fake-first", domainId], agentScopeIds: ["default"] },
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
        hostRequirements: [native ? "native-connector" : "fake-connector"],
        connectorProfile: domainId === "mcp-connectors" || domainId === "browser-automation" || domainId === "design-canvas" ? "mcp" : "provider",
        scorecardRubricId: `rubric.${familyId}.baseline`,
        redaction: { class: "public" }
      },
      secretExposure: createSecretRedactionDecision("", { class: "public" }),
      resourceScope,
      ["sandboxRequirements"]: sandboxRequirements,
      audit: createSandboxAuditEvidence({
        decision: "manifest",
        reasonCode: native ? "manifest.native-connector" : "manifest.fake-connector",
        subject: "@deepseek/mcp-gateway",
        resource: id,
        ["sandboxProfile"]: sandboxRequirements.profile
      }),
      security: { modelVisible: true, outputRedaction: "internal", preflight: native ? "native-connector" : "fake-connector" }
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

function createDesignState(mode: ConnectorCapabilityMode): Map<string, FakeDesignNode> {
  return new Map([
    ["root", { id: "root", name: mode === "native" ? "Native Document" : "Document", type: "frame", children: ["title"] }],
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
  if (pages.size === 0) {
    pages.set("page:blank", {
      pageId: "page:blank",
      url: "about:blank",
      title: "Blank",
      dom: "<main><h1>Blank</h1></main>",
      fields: new Map(),
      clicks: [],
      console: [],
      network: []
    });
  }
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

function artifact(familyId: ToolFamilyId, kind: ToolFamilyArtifactKind, key: string, mimeType: string, preview: string, mode: ConnectorCapabilityMode): JsonObject {
  return {
    artifactId: `artifact:${familyId}:${key}`,
    familyId,
    kind,
    uri: `artifact://${mode}/${familyId}/${key}`,
    mimeType,
    byteLength: 1024,
    sha256: stableHash(`${familyId}:${key}:${preview}`),
    preview: redactSecretText(preview).slice(0, 200),
    truncated: preview.length > 200,
    createdAt: deterministicTime,
    redaction: { class: "internal" }
  };
}

function evidence(familyId: ToolFamilyId, capabilityId: string, mode: ConnectorCapabilityMode): JsonObject {
  return { mode, providerNativeSupport: providerNativeSupport(mode), capabilityId, familyId, replayRef: mode === "native" ? "" : `replay:${capabilityId}`, createdAt: deterministicTime, redaction: { class: "public" } };
}

function providerNativeSupport(mode: ConnectorCapabilityMode): "native" | "unsupported" {
  return mode === "native" ? "native" : "unsupported";
}

async function fetchPage(url: string): Promise<{ readonly ok: true; readonly html: string; readonly finalUrl: string; readonly status: number } | { readonly ok: false; readonly result: JsonObject }> {
  if (!/^https?:\/\//i.test(url)) return { ok: false, result: fail("BROWSER_URL_REJECTED", "Browser navigate requires an http(s) URL.") };
  try {
    const response = await fetch(url, { headers: { "user-agent": userAgent } });
    return { ok: true, html: await response.text(), finalUrl: response.url, status: response.status };
  } catch (error) {
    return { ok: false, result: fail("BROWSER_NATIVE_FETCH_FAILED", error instanceof Error ? error.message : "Native browser fetch failed.") };
  }
}

function extractTitle(html: string): string {
  return redactSecretText(stripTags(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? "")).trim();
}

function firstHref(html: string): string | undefined {
  return firstMatch(html, /<a\b[^>]*href\s*=\s*["']([^"']+)["']/i);
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

function svgArtifact(familyId: ToolFamilyId, kind: ToolFamilyArtifactKind, key: string, title: string, body: string): JsonObject {
  const safeTitle = redactSecretText(title).slice(0, 80);
  const safeBody = redactSecretText(stripTags(body).replace(/\s+/g, " ").trim()).slice(0, 160);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#f8fafc"/><rect x="24" y="24" width="592" height="312" rx="12" fill="#ffffff" stroke="#334155"/><text x="48" y="84" font-family="Arial" font-size="28" fill="#0f172a">${escapeXml(safeTitle)}</text><text x="48" y="136" font-family="Arial" font-size="16" fill="#334155">${escapeXml(safeBody)}</text></svg>`;
  return {
    artifactId: `artifact:${familyId}:${key}`,
    familyId,
    kind,
    uri: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    mimeType: "image/svg+xml",
    byteLength: Buffer.byteLength(svg, "utf8"),
    sha256: stableHash(svg),
    preview: safeTitle,
    truncated: body.length > safeBody.length,
    createdAt: deterministicTime,
    redaction: { class: "internal", fields: ["uri"] }
  };
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
