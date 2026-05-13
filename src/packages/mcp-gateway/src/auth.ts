import type {
  ExtensionCredentialAuthorizationResult,
  ExtensionCredentialOperation,
  ExtensionCredentialOwner,
  ExtensionCredentialRequirement,
  JsonObject,
  McpCallerKind,
  McpServerManifest,
  RedactedError,
  SessionId,
} from "@deepseek/platform-contracts";
import { EXTENSION_AUTH_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export interface McpCredentialAuthorizationRequest {
  readonly manifest: McpServerManifest;
  readonly requirement: ExtensionCredentialRequirement;
  readonly operation: ExtensionCredentialOperation;
  readonly caller: McpCallerKind;
  readonly targetKind: "tool" | "resource" | "prompt" | "transport";
  readonly targetName: string;
  readonly sessionId?: SessionId;
  readonly metadata?: JsonObject;
}

export type McpCredentialAuthorizer = (
  request: McpCredentialAuthorizationRequest,
) => Promise<ExtensionCredentialAuthorizationResult> | ExtensionCredentialAuthorizationResult;

export async function authorizeMcpRequirements(
  authorizer: McpCredentialAuthorizer | undefined,
  request: Omit<McpCredentialAuthorizationRequest, "requirement"> & {
    readonly requirements: readonly ExtensionCredentialRequirement[];
  },
): Promise<ExtensionCredentialAuthorizationResult | undefined> {
  if (request.requirements.length === 0) return undefined;
  if (!authorizer) {
    return deniedAuthorization(request.requirements[0]!, request.operation, "missing", {
      source: "mcp-gateway",
      serverId: request.manifest.id,
      targetKind: request.targetKind,
      targetName: request.targetName,
      caller: request.caller,
    });
  }

  let firstAllowed: ExtensionCredentialAuthorizationResult | undefined;
  for (const requirement of request.requirements) {
    const result = await authorizer({ ...request, requirement });
    if (result.status === "denied") return result;
    firstAllowed ??= result;
  }
  return firstAllowed;
}

export function authDiagnostics(auth: ExtensionCredentialAuthorizationResult | undefined): readonly RedactedError[] {
  if (!auth || auth.status === "allowed") return [];
  return auth.diagnostics.length > 0
    ? auth.diagnostics
    : [diagnostic(`EXTENSION_CREDENTIAL_${auth.reason.toUpperCase().replace(/-/g, "_")}`, `Extension credential authorization denied: ${auth.reason}.`)];
}

export function mergeMcpRequirements(
  manifest: McpServerManifest,
  targetRequirements: readonly ExtensionCredentialRequirement[] | undefined,
): readonly ExtensionCredentialRequirement[] {
  return [...(manifest.credentialRequirements ?? []), ...(targetRequirements ?? [])];
}

function deniedAuthorization(
  requirement: ExtensionCredentialRequirement,
  operation: ExtensionCredentialOperation,
  reason: ExtensionCredentialAuthorizationResult extends infer T ? T extends { readonly status: "denied"; readonly reason: infer R } ? R : never : never,
  audit: JsonObject,
): ExtensionCredentialAuthorizationResult {
  const evidence = {
    schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION,
    status: "denied" as const,
    owner: requirement.owner,
    operation,
    requirementId: requirement.requirementId,
    reason,
    diagnostics: [diagnostic(`EXTENSION_CREDENTIAL_${String(reason).toUpperCase().replace(/-/g, "_")}`, `Extension credential authorization denied: ${String(reason)}.`)],
    referencePitFixtureIds: ["pit.extension-auth.credential-scope-denial", ...(requirement.referencePitFixtureIds ?? [])],
    audit,
    redaction: { class: "secret" as const, fields: ["credentialRef", "diagnostics"] },
    compatibility: { schemaVersion: EXTENSION_AUTH_SCHEMA_VERSION },
  };
  return {
    ...evidence,
    replayFingerprint: `authorization:${stableHash(stableStringify(evidence))}`,
  };
}

function diagnostic(code: string, message: string): RedactedError {
  return {
    code,
    message,
    retryable: code === "EXTENSION_CREDENTIAL_MISSING",
    redaction: { class: "public" },
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}
