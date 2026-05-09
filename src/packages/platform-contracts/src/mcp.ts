import type { CompatibilityMetadata, JsonObject, RedactedError, RedactionMetadata, SerializableResult, TraceContext } from "./common.js";
import type { CredentialRef, McpServerId, SessionId } from "./ids.js";
import type { TrustStatus } from "./capability.js";

export const MCP_SCHEMA_VERSION = "1.0.0";

export type McpTransportKind = "stdio" | "http" | "websocket" | "in-process" | "ide" | "fake";
export type McpServerSourceKind = "built-in" | "user" | "workspace" | "extension" | "plugin" | "catalog";
export type McpHealthStatus = "connected" | "degraded" | "unavailable" | "disabled" | "rejected";
export type McpOperationStatus = "completed" | "rejected" | "failed" | "timed-out" | "unavailable" | "inert";
export type McpCallerKind = "runtime" | "model" | "user" | "command" | "skill" | "hook" | "agent" | "plugin" | "host" | "test";
export type McpResourceCachePolicy = "no-store" | "session" | "workspace" | "persistent";

export interface McpTransportDeclaration extends JsonObject {
  readonly kind: McpTransportKind;
  readonly command?: string;
  readonly endpoint?: string;
  readonly serverName?: string;
  readonly metadata?: JsonObject;
}

export interface McpToolDeclaration extends JsonObject {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema: JsonObject;
  readonly outputSchema?: JsonObject;
  readonly permissions: readonly string[];
  readonly timeoutMs?: number;
  readonly redaction?: RedactionMetadata;
  readonly metadata?: JsonObject;
}

export interface McpResourceDeclaration extends JsonObject {
  readonly uri: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
  readonly permissions: readonly string[];
  readonly cachePolicy: McpResourceCachePolicy;
  readonly redaction?: RedactionMetadata;
  readonly metadata?: JsonObject;
}

export interface McpPromptDeclaration extends JsonObject {
  readonly name: string;
  readonly description?: string;
  readonly argumentsSchema?: JsonObject;
  readonly redaction?: RedactionMetadata;
  readonly metadata?: JsonObject;
}

export interface McpServerManifest extends JsonObject {
  readonly schemaVersion?: string;
  readonly id: McpServerId;
  readonly name: string;
  readonly version: string;
  readonly namespace: string;
  readonly source: McpServerSourceKind | string;
  readonly trust: TrustStatus;
  readonly transport: McpTransportDeclaration;
  readonly permissions: readonly string[];
  readonly timeoutMs: number;
  readonly enabled?: boolean;
  readonly credentialRef?: CredentialRef;
  readonly tools?: readonly McpToolDeclaration[];
  readonly resources?: readonly McpResourceDeclaration[];
  readonly prompts?: readonly McpPromptDeclaration[];
  readonly compatibility?: CompatibilityMetadata;
  readonly redaction?: RedactionMetadata;
  readonly metadata?: JsonObject;
}

export interface McpServerSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly id: McpServerId;
  readonly name: string;
  readonly version: string;
  readonly namespace: string;
  readonly source: string;
  readonly trust: TrustStatus;
  readonly transport: McpTransportDeclaration;
  readonly permissions: readonly string[];
  readonly timeoutMs: number;
  readonly enabled: boolean;
  readonly health: McpHealthStatus;
  readonly toolCount: number;
  readonly resourceCount: number;
  readonly promptCount: number;
  readonly compatibility: CompatibilityMetadata;
  readonly redaction: RedactionMetadata;
}

export interface McpToolSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly serverId: McpServerId;
  readonly namespace: string;
  readonly name: string;
  readonly qualifiedName: string;
  readonly description: string;
  readonly transport: McpTransportDeclaration;
  readonly trust: TrustStatus;
  readonly permissions: readonly string[];
  readonly timeoutMs: number;
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject;
  readonly redaction: RedactionMetadata;
  readonly provenance: JsonObject;
  readonly compatibility: CompatibilityMetadata;
}

export interface McpResourceSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly serverId: McpServerId;
  readonly namespace: string;
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
  readonly transport: McpTransportDeclaration;
  readonly trust: TrustStatus;
  readonly permissions: readonly string[];
  readonly cachePolicy: McpResourceCachePolicy;
  readonly redaction: RedactionMetadata;
  readonly provenance: JsonObject;
  readonly compatibility: CompatibilityMetadata;
}

export interface McpPromptSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly serverId: McpServerId;
  readonly namespace: string;
  readonly name: string;
  readonly qualifiedName: string;
  readonly description: string;
  readonly argumentsSchema: JsonObject;
  readonly trust: TrustStatus;
  readonly redaction: RedactionMetadata;
  readonly provenance: JsonObject;
  readonly compatibility: CompatibilityMetadata;
}

export interface McpValidationResult extends JsonObject {
  readonly schemaVersion: string;
  readonly ok: boolean;
  readonly diagnostics: readonly RedactedError[];
  readonly normalized?: McpServerManifest;
  readonly redaction: RedactionMetadata;
}

export interface McpListRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly namespace?: string;
  readonly includeInert?: boolean;
  readonly sessionId?: SessionId;
  readonly trace?: TraceContext;
}

export interface McpToolCallRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly serverId: McpServerId;
  readonly name: string;
  readonly input: JsonObject;
  readonly caller: McpCallerKind;
  readonly sessionId?: SessionId;
  readonly timeoutMs?: number;
  readonly trace?: TraceContext;
  readonly metadata?: JsonObject;
}

export interface McpResourceReadRequest extends JsonObject {
  readonly schemaVersion: string;
  readonly serverId: McpServerId;
  readonly uri: string;
  readonly caller: McpCallerKind;
  readonly sessionId?: SessionId;
  readonly timeoutMs?: number;
  readonly trace?: TraceContext;
  readonly metadata?: JsonObject;
}

export interface McpToolCallResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: McpOperationStatus;
  readonly serverId: McpServerId;
  readonly namespace: string;
  readonly name: string;
  readonly qualifiedName: string;
  readonly caller: McpCallerKind;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly output?: JsonObject;
  readonly diagnostics: readonly RedactedError[];
  readonly trust: TrustStatus;
  readonly transport: McpTransportDeclaration;
  readonly permissions: readonly string[];
  readonly timeoutMs: number;
  readonly redaction: RedactionMetadata;
  readonly audit: JsonObject;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export interface McpResourceReadResult extends JsonObject {
  readonly schemaVersion: string;
  readonly status: McpOperationStatus;
  readonly serverId: McpServerId;
  readonly namespace: string;
  readonly uri: string;
  readonly caller: McpCallerKind;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly content?: string;
  readonly mimeType: string;
  readonly cachePolicy: McpResourceCachePolicy;
  readonly diagnostics: readonly RedactedError[];
  readonly trust: TrustStatus;
  readonly transport: McpTransportDeclaration;
  readonly permissions: readonly string[];
  readonly timeoutMs: number;
  readonly redaction: RedactionMetadata;
  readonly provenance: JsonObject;
  readonly audit: JsonObject;
  readonly compatibility: CompatibilityMetadata;
  readonly replayFingerprint: string;
}

export interface McpHandlerContext extends JsonObject {
  readonly manifest: McpServerManifest;
  readonly trace?: TraceContext;
  readonly signal?: JsonObject;
}

export type McpToolHandler = (
  input: JsonObject,
  context: McpHandlerContext
) => Promise<SerializableResult<JsonObject>>;

export type McpResourceHandler = (
  context: McpHandlerContext
) => Promise<SerializableResult<{ readonly content: string; readonly mimeType?: string; readonly metadata?: JsonObject }>>;

export interface McpServerAdapter {
  readonly toolHandlers?: Readonly<Record<string, McpToolHandler>>;
  readonly resourceHandlers?: Readonly<Record<string, McpResourceHandler>>;
}

export interface McpGateway {
  validateManifest(manifest: McpServerManifest): Promise<McpValidationResult>;
  connectServer(manifest: McpServerManifest, adapter?: McpServerAdapter): Promise<McpServerSummary>;
  listServers(request?: McpListRequest): Promise<readonly McpServerSummary[]>;
  listTools(request: McpListRequest): Promise<readonly McpToolSummary[]>;
  listResources(request: McpListRequest): Promise<readonly McpResourceSummary[]>;
  listPrompts(request: McpListRequest): Promise<readonly McpPromptSummary[]>;
  callTool(request: McpToolCallRequest): Promise<McpToolCallResult>;
  readResource(request: McpResourceReadRequest): Promise<McpResourceReadResult>;
}
