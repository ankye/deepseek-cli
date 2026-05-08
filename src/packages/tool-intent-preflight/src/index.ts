import type {
  CapabilityId,
  JsonObject,
  ToolIntent,
  ToolIntentDiagnostic,
  ToolIntentPreflightRequest,
  ToolIntentPreflightResult,
  ToolIntentPreflightService,
  ToolIntentProviderProfile,
  ToolIntentRepairAction
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

const defaultPathFields = ["path", "file", "filePath", "target", "cwd"];
const deepSeekProviderId = asId<"modelProvider">("provider-deepseek");

export const deepSeekToolIntentProfile: ToolIntentProviderProfile = {
  providerId: deepSeekProviderId,
  pathFields: ["path", "file", "filePath", "target", "cwd"],
  toolNameAliases: {
    readFile: "read_file",
    read_file: "read_file",
    "fs.readFile": "read_file"
  },
  unwrapArgumentsField: "arguments",
  strictJsonArguments: false
};

export class DeterministicToolIntentPreflight implements ToolIntentPreflightService {
  constructor(private readonly profiles: readonly ToolIntentProviderProfile[] = [deepSeekToolIntentProfile]) {}

  async check(request: ToolIntentPreflightRequest): Promise<ToolIntentPreflightResult> {
    const repairs: ToolIntentRepairAction[] = [];
    const diagnostics: ToolIntentDiagnostic[] = [];
    const profile = this.profileFor(request);
    const providerPrepared = prepareProviderIntent(request.intent, profile);
    repairs.push(...providerPrepared.repairs);
    diagnostics.push(...providerPrepared.diagnostics);
    const preparedIntent = providerPrepared.intent;
    const capabilityId = asId<"capability">(preparedIntent.name);
    const visible = new Set<string>(request.modelVisibleCapabilities.map(String));
    if (!visible.has(String(capabilityId))) {
      diagnostics.push(diagnostic("TOOL_INTENT_UNKNOWN_TOOL", `Tool is not model-visible: ${preparedIntent.name}`, "name"));
      return result("rejected", request, diagnostics, repairs, undefined, capabilityId, profile);
    }

    const repairedInput: Record<string, unknown> = { ...preparedIntent.input };
    for (const field of request.pathFields ?? profile?.pathFields ?? defaultPathFields) {
      const value = repairedInput[field];
      if (typeof value !== "string") continue;
      const normalized = normalizeWorkspacePath(value, request.workspaceRoot, request.platform, field);
      diagnostics.push(...normalized.diagnostics);
      repairs.push(...normalized.repairs);
      if (normalized.value) repairedInput[field] = normalized.value;
    }

    if (diagnostics.length > 0) {
      return result("rejected", request, diagnostics, repairs, undefined, capabilityId, profile);
    }

    const repaired: ToolIntent = {
      ...preparedIntent,
      input: repairedInput as JsonObject
    };
    return result(repairs.length > 0 ? "repaired" : "accepted", request, diagnostics, repairs, repaired, capabilityId, profile);
  }

  private profileFor(request: ToolIntentPreflightRequest): ToolIntentProviderProfile | undefined {
    if (!request.providerId) return undefined;
    return this.profiles.find((profile) => {
      if (profile.providerId !== request.providerId) return false;
      return !profile.profileId || !request.profileId || profile.profileId === request.profileId;
    });
  }
}

export function prepareProviderIntent(
  intent: ToolIntent,
  profile?: ToolIntentProviderProfile
): { readonly intent: ToolIntent; readonly repairs: readonly ToolIntentRepairAction[]; readonly diagnostics: readonly ToolIntentDiagnostic[] } {
  if (!profile) return { intent, repairs: [], diagnostics: [] };
  const repairs: ToolIntentRepairAction[] = [];
  const diagnostics: ToolIntentDiagnostic[] = [];
  let name = intent.name;
  const alias = stringFromJsonObject(profile.toolNameAliases, name);
  if (alias && alias !== name) {
    repairs.push(repair("provider-tool-alias-normalized", "name", name, alias));
    name = alias;
  }

  let input: JsonObject = intent.input;
  if (profile.unwrapArgumentsField) {
    const raw = input[profile.unwrapArgumentsField];
    if (typeof raw === "string") {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isJsonObject(parsed)) {
          input = parsed;
          repairs.push(repair("provider-arguments-unwrapped", profile.unwrapArgumentsField, raw, JSON.stringify(parsed)));
        } else if (profile.strictJsonArguments) {
          diagnostics.push(diagnostic("TOOL_INTENT_PROVIDER_ARGUMENTS_NOT_OBJECT", "Provider arguments JSON must decode to an object", profile.unwrapArgumentsField));
        }
      } catch {
        diagnostics.push(diagnostic("TOOL_INTENT_PROVIDER_ARGUMENTS_INVALID_JSON", "Provider arguments are not valid JSON", profile.unwrapArgumentsField));
      }
    }
  }

  return {
    intent: { ...intent, name, input },
    repairs,
    diagnostics
  };
}

export function normalizeWorkspacePath(
  value: string,
  workspaceRoot: string,
  platform: ToolIntentPreflightRequest["platform"],
  field = "path"
): { readonly value?: string; readonly repairs: readonly ToolIntentRepairAction[]; readonly diagnostics: readonly ToolIntentDiagnostic[] } {
  const repairs: ToolIntentRepairAction[] = [];
  const diagnostics: ToolIntentDiagnostic[] = [];
  const trimmed = value.trim();
  if (!trimmed) {
    diagnostics.push(diagnostic("TOOL_INTENT_EMPTY_PATH", "Path must not be empty", field));
    return { diagnostics, repairs };
  }
  if (isHomePath(trimmed)) {
    diagnostics.push(diagnostic("TOOL_INTENT_HOME_PATH_REJECTED", "Home-directory paths are not workspace-safe", field));
    return { diagnostics, repairs };
  }
  if (isAbsolutePath(trimmed)) {
    diagnostics.push(diagnostic("TOOL_INTENT_ABSOLUTE_PATH_REJECTED", "Absolute paths must not come from model tool intent", field));
    return { diagnostics, repairs };
  }

  let next = trimmed;
  if (next.startsWith("./") || next.startsWith(".\\")) {
    const before = next;
    next = next.slice(2);
    repairs.push(repair("path-prefix-removed", field, before, next));
  }

  const separator = platform === "windows" ? "\\" : "/";
  const alternate = platform === "windows" ? /\//g : /\\/g;
  if (alternate.test(next)) {
    const before = next;
    next = next.replace(alternate, separator);
    repairs.push(repair("path-separator-normalized", field, before, next));
  }

  const parts = next.split(/[\\/]+/).filter(Boolean);
  if (parts.some((part) => part === "..")) {
    diagnostics.push(diagnostic("TOOL_INTENT_PARENT_TRAVERSAL_REJECTED", "Parent traversal is not workspace-safe", field));
    return { diagnostics, repairs };
  }
  if (parts.some((part) => part === ".")) {
    const before = next;
    next = parts.filter((part) => part !== ".").join(separator);
    repairs.push(repair("path-normalized", field, before, next));
  }
  if (looksLikeWindowsDriveRelative(next)) {
    diagnostics.push(diagnostic("TOOL_INTENT_AMBIGUOUS_PLATFORM_PATH", "Drive-relative paths are ambiguous and rejected", field));
    return { diagnostics, repairs };
  }

  const normalizedRoot = workspaceRoot.replace(/[\\/]+$/, "");
  return {
    value: normalizedRoot ? `${normalizedRoot}${separator}${next}` : next,
    diagnostics,
    repairs: normalizedRoot ? [...repairs, repair("path-normalized", field, value, `${normalizedRoot}${separator}${next}`)] : repairs
  };
}

function result(
  status: ToolIntentPreflightResult["status"],
  request: ToolIntentPreflightRequest,
  diagnostics: readonly ToolIntentDiagnostic[],
  repairs: readonly ToolIntentRepairAction[],
  repaired?: ToolIntent,
  capabilityId?: CapabilityId,
  profile?: ToolIntentProviderProfile
): ToolIntentPreflightResult {
  return {
    status,
    original: request.intent,
    ...(repaired ? { repaired } : {}),
    ...(capabilityId ? { capabilityId } : {}),
    repairs,
    diagnostics,
    platform: {
      os: request.platform,
      pathFields: request.pathFields ?? profile?.pathFields ?? defaultPathFields
    },
    ...(profile || request.providerId ? { provider: { providerId: request.providerId ?? profile?.providerId ?? "", profileId: request.profileId ?? profile?.profileId ?? "", matched: Boolean(profile) } } : {}),
    workspaceRoot: request.workspaceRoot,
    redaction: { class: "internal" }
  };
}

function diagnostic(code: string, message: string, field: string): ToolIntentDiagnostic {
  return {
    code,
    message,
    field,
    retryable: false,
    redaction: { class: "public" }
  };
}

function repair(kind: ToolIntentRepairAction["kind"], field: string, before: string, after: string): ToolIntentRepairAction {
  return {
    kind,
    field,
    before,
    after,
    confidence: 1
  };
}

function stringFromJsonObject(value: JsonObject | undefined, key: string): string | undefined {
  const found = value?.[key];
  return typeof found === "string" ? found : undefined;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHomePath(value: string): boolean {
  return value === "~" || value.startsWith("~/") || value.startsWith("~\\");
}

function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || value.startsWith("\\") || /^[a-zA-Z]:[\\/]/.test(value);
}

function looksLikeWindowsDriveRelative(value: string): boolean {
  return /^[a-zA-Z]:($|[^\\/])/.test(value);
}
