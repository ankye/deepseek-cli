import type { AgentLoopOutputMode, CliKeymapProfileName, DiagnosticsCommandName, ExtensionManagementCommandKind, JsonObject, ReadinessCommandName, WorkspaceRevertRequestTarget } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import type { CliOptions, CliTerminalFlags } from "../types.js";
import { defaultTerminalFlags } from "../host/terminal.js";

const readinessCommands = new Set<ReadinessCommandName>(["init", "config", "auth", "doctor", "privacy", "verify-install"]);
const diagnosticsCommands = new Set<DiagnosticsCommandName>(["bundle", "release", "doctor", "verify", "refresh", "evaluate"]);
const defaultOutputMode: AgentLoopOutputMode = "text";

export function parseCliArgs(args: readonly string[], _terminal: CliTerminalFlags = defaultTerminalFlags): CliOptions {
  const output = parseOutputMode(args);
  const timeoutMs = parsePositiveNumberFlag(args, "--timeout-ms");
  const live = args.includes("--live");
  const first = args[0];
  if (!first || first === "help" || first === "--help" || first === "-h") {
    return { command: "help", prompt: "", output, live };
  }
  if (first === "run") {
    return { command: "run", prompt: promptFromArgs(args.slice(1)), output, live, ...(timeoutMs ? { timeoutMs } : {}) };
  }
  if (first === "chat") {
    const sessionId = readFlagValue(args, "--session");
    return {
      command: "chat",
      prompt: "",
      output,
      live,
      ...(timeoutMs ? { timeoutMs } : {}),
      ...(sessionId ? { sessionId: asId<"session">(sessionId) } : {})
    };
  }
  if (first === "tools-smoke") {
    return { command: "tools-smoke", prompt: "", output, live };
  }
  if (first === "session") {
    const action = args[1] === "fork" ? "fork" : "resume";
    const sessionId = args[2] && !args[2].startsWith("-") ? asId<"session">(args[2]) : undefined;
    const base: CliOptions = {
      command: "session",
      prompt: "",
      output,
      live,
      sessionAction: action
    };
    if (action === "fork" && sessionId) return { ...base, parentSessionId: sessionId };
    if (action === "resume" && sessionId) return { ...base, sessionId };
    return base;
  }
  if (first === "mcp") {
    const manifestPath = args[2] && !args[2].startsWith("-") ? args[2] : undefined;
    const callTool = readFlagValue(args, "--call");
    const callInput = readFlagValue(args, "--input");
    return {
      command: "mcp",
      prompt: "",
      output,
      live,
      mcpAction: "test",
      ...(manifestPath ? { mcpManifestPath: manifestPath } : {}),
      ...(callTool ? { mcpCallTool: callTool } : {}),
      ...(callInput ? { mcpCallInput: callInput } : {}),
      enableRealMcp: args.includes("--enable-real-mcp")
    };
  }
  if (first === "index-provider") {
    return {
      command: "index-provider",
      prompt: "",
      output,
      live,
      indexProviderAction: args[1] === "set" ? "set" : "status",
      ...(args[2] ? { indexProviderId: args[2] } : {}),
      ...(args[3] ? { indexProviderStatus: args[3] } : {}),
      indexProviderScope: args.includes("--user") ? "user" : "workspace"
    };
  }
  if (first === "diagnostics") {
    const diagnosticsCommand = parseDiagnosticsCommand(args[1]);
    return {
      command: "diagnostics",
      diagnosticsCommand,
      prompt: "",
      output,
      live,
      diagnosticsInput: parseDiagnosticsInput(diagnosticsCommand, args)
    };
  }
  if (first === "extension") {
    return {
      command: "extension",
      extensionCommand: parseExtensionCommand(args),
      prompt: "",
      output,
      live,
      extensionInput: parseExtensionInput(args)
    };
  }
  if (first === "palette") {
    const paletteAction = parsePaletteAction(args);
    return {
      command: "palette",
      ...(paletteAction ? { paletteAction } : {}),
      paletteKeymapProfile: parsePaletteKeymapProfile(args[2]),
      ...(args[2] ? { paletteActionName: args[2] } : {}),
      ...(args[3] ? { paletteTargetId: args[3] } : {}),
      prompt: "",
      output,
      live
    };
  }
  if (first === "revert") {
    const reason = readFlagValue(args, "--reason");
    const action = args[1] === "apply" ? "apply" : "preview";
    return {
      command: "revert",
      prompt: "",
      output,
      live,
      revertAction: action,
      revertTarget: parseRevertTarget(args),
      ...(reason ? { revertReason: reason } : {})
    };
  }
  if (isReadinessCommand(first)) {
    return { command: "readiness", readinessCommand: first, prompt: "", output, live, readinessInput: parseReadinessInput(first, args) };
  }
  return { command: "help", prompt: "", output, live };
}

export function cliUsageLines(): readonly string[] {
  return [
    "DeepSeek CLI",
    "Usage:",
    "  deepseek run \"<task>\" [--output text|json|jsonl] [--live] [--timeout-ms <ms>]",
    "  deepseek chat [--session <session-id>] [--output text|json|jsonl] [--live] [--timeout-ms <ms>]",
    "  deepseek session resume <session-id> [--output text|json]",
    "  deepseek session fork <session-id> [--output text|json]",
    "  deepseek mcp test <manifest.json> [--enable-real-mcp] [--call <tool> --input <json>] [--output text|json]",
    "  deepseek index-provider status [--output text|json|jsonl]",
    "  deepseek index-provider set <pageindex|zvec|code-index> <enabled|deferred|disabled> [--user] [--output text|json|jsonl]",
    "  deepseek extension list [--output text|json|jsonl]",
    "  deepseek extension plugin install|verify|snapshot|apply-lockfile <file.json> [--output text|json|jsonl]",
    "  deepseek extension skill list|activate [name] [--output text|json|jsonl]",
    "  deepseek extension auth scopes [--output text|json|jsonl]",
    "  deepseek extension mcp test <manifest.json> [--enable-real-mcp] [--call <tool> --input <json>] [--output text|json|jsonl]",
    "  deepseek palette list [--output text|json|jsonl]",
    "  deepseek palette keymap [core|vi-minimal] [--output text|json|jsonl]",
    "  deepseek palette action <action> <target-id> [--output text|json|jsonl]",
    "  deepseek revert preview --request <id>|--turn <id>|--session <id> [--path <path>] [--output text|json|jsonl]",
    "  deepseek revert apply --request <id>|--turn <id>|--session <id> [--path <path>] [--output text|json|jsonl]",
    "  deepseek diagnostics bundle|release|doctor|verify|refresh|evaluate [--baseline <id>] [--full] [--dry-run] [--output text|json|jsonl]",
    "  deepseek tools-smoke [--output text|jsonl]",
    "  deepseek <init|config|auth|doctor|privacy|verify-install> [--output text|json]"
  ];
}

function parseRevertTarget(args: readonly string[]): WorkspaceRevertRequestTarget {
  const requestId = readFlagValue(args, "--request");
  const turnId = readFlagValue(args, "--turn");
  const sessionId = readFlagValue(args, "--session");
  const path = readFlagValue(args, "--path");
  const target: Record<string, unknown> = {};
  if (requestId) target.requestId = requestId;
  if (turnId) target.turnId = asId<"turn">(turnId);
  if (sessionId) target.sessionId = asId<"session">(sessionId);
  if (path) target.path = path;
  return target as WorkspaceRevertRequestTarget;
}

function parsePaletteAction(args: readonly string[]): CliOptions["paletteAction"] {
  const action = args[1];
  if (action === "keymap") return "keymap";
  if (action === "action") return "action";
  return "list";
}

function parsePaletteKeymapProfile(value: string | undefined): CliKeymapProfileName {
  return value === "core" ? "core" : "vi-minimal";
}

function parseExtensionCommand(args: readonly string[]): ExtensionManagementCommandKind {
  const domain = args[1];
  const action = args[2];
  if (domain === "plugin") {
    if (action === "install") return "extension.plugin.install";
    if (action === "verify") return "extension.plugin.verify";
    if (action === "snapshot") return "extension.plugin.snapshot";
    if (action === "apply-lockfile") return "extension.plugin.apply-lockfile";
  }
  if (domain === "skill") {
    if (action === "activate") return "extension.skill.activate";
    return "extension.skill.list";
  }
  if (domain === "auth") return "extension.auth.scopes";
  if (domain === "mcp") return "extension.mcp.test";
  return "extension.list";
}

function parseExtensionInput(args: readonly string[]): JsonObject {
  const input: Record<string, unknown> = {};
  const domain = args[1];
  const action = args[2];
  if (domain === "plugin") {
    const path = args[3] && !args[3].startsWith("-") ? args[3] : undefined;
    if (path) input.path = path;
  }
  if (domain === "skill") {
    const name = args[3] && !args[3].startsWith("-") ? args[3] : undefined;
    if (name) input.name = name;
  }
  if (domain === "mcp") {
    const manifestPath = args[3] && !args[3].startsWith("-") ? args[3] : undefined;
    if (manifestPath) input.manifestPath = manifestPath;
    const callTool = readFlagValue(args, "--call");
    const callInput = readFlagValue(args, "--input");
    if (callTool) input.callTool = callTool;
    if (callInput) input.callInput = callInput;
    if (args.includes("--enable-real-mcp")) input.enableRealMcp = true;
  }
  if (domain === "auth") {
    const manifestPath = readFlagValue(args, "--manifest");
    if (manifestPath) input.manifestPath = manifestPath;
  }
  input.domain = domain ?? "list";
  input.action = action ?? "list";
  return input as JsonObject;
}

function parseReadinessInput(command: ReadinessCommandName, args: readonly string[]): JsonObject {
  const input: Record<string, unknown> = {};
  if (args.includes("--force")) input.force = true;
  if (command === "doctor" && args.includes("--live")) input.live = true;
  if (command === "doctor" && args.includes("--fake-live")) {
    input.live = true;
    input.fakeLive = true;
  }
  if (command === "auth" && args.includes("logout")) input.logout = true;
  if (command === "config" && args[1] === "set") {
    input.setKey = args[2] ?? "";
    input.setValue = parseConfigValue(args[3] ?? "");
    input.scope = args.includes("--user") ? "user" : "workspace";
  }
  return input as JsonObject;
}

function parseDiagnosticsCommand(value: string | undefined): DiagnosticsCommandName {
  return isDiagnosticsCommand(value) ? value : "bundle";
}

function parseDiagnosticsInput(command: DiagnosticsCommandName, args: readonly string[]): JsonObject {
  const input: Record<string, unknown> = { command };
  const maxRecords = parsePositiveNumberFlag(args, "--max-records");
  if (maxRecords) input.maxRecords = maxRecords;
  if (args.includes("--external")) input.external = true;
  if (args.includes("--fake-secret")) input.fakeSecret = true;
  if (command === "refresh") {
    input.full = args.includes("--full");
    input.dryRun = args.includes("--dry-run");
    input.extraArgs = extraDiagnosticsArgs(args, new Set(["--full", "--dry-run"]));
  }
  if (command === "evaluate") {
    input.full = args.includes("--full");
    input.smoke = args.includes("--smoke");
    input.dryRun = args.includes("--dry-run");
    input.baseline = readFlagValue(args, "--baseline") ?? "deepseek-cli";
    const compareBaselines = readRepeatedFlagValues(args, "--compare-baseline");
    if (compareBaselines.length > 0) input.compareBaselines = compareBaselines;
    input.allowExternalBaseline = args.includes("--allow-external-baseline");
    const baselineCommand = readFlagValue(args, "--baseline-command");
    if (baselineCommand) input.baselineCommand = baselineCommand;
    const codexCommand = readFlagValue(args, "--codex-command");
    if (codexCommand) input.codexCommand = codexCommand;
    const claudeCommand = readFlagValue(args, "--claude-command");
    if (claudeCommand) input.claudeCommand = claudeCommand;
    const executeTask = readFlagValue(args, "--execute-task");
    if (executeTask) input.executeTask = executeTask;
    input.baselineArgs = readRepeatedFlagValues(args, "--baseline-arg");
    input.extraArgs = extraDiagnosticsArgs(args, new Set(["--full", "--smoke", "--dry-run"]));
  }
  return input as JsonObject;
}

function extraDiagnosticsArgs(args: readonly string[], knownBooleanFlags: ReadonlySet<string>): readonly string[] {
  const extras: string[] = [];
  for (let index = 2; index < args.length; index += 1) {
    const value = args[index];
    if (!value) continue;
    if (
      value === "--output" ||
      value === "--max-records" ||
      value === "--baseline" ||
      value === "--compare-baseline" ||
      value === "--baseline-command" ||
      value === "--codex-command" ||
      value === "--claude-command" ||
      value === "--baseline-arg" ||
      value === "--execute-task"
    ) {
      index += 1;
      continue;
    }
    if (value === "--allow-external-baseline") continue;
    if (value === "--external" || value === "--fake-secret" || knownBooleanFlags.has(value)) continue;
    extras.push(value);
  }
  return extras;
}

function parseConfigValue(value: string): string | boolean | number {
  if (value === "true") return true;
  if (value === "false") return false;
  const numberValue = Number(value);
  return value.trim() !== "" && Number.isFinite(numberValue) ? numberValue : value;
}

function parseOutputMode(args: readonly string[]): AgentLoopOutputMode {
  const index = args.indexOf("--output");
  const value = index >= 0 ? args[index + 1] : undefined;
  return value === "json" || value === "jsonl" || value === "text" ? value : defaultOutputMode;
}

function parsePositiveNumberFlag(args: readonly string[], name: string): number | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function readFlagValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  return typeof value === "string" && !value.startsWith("-") ? value : undefined;
}

function readRepeatedFlagValues(args: readonly string[], name: string): readonly string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== name) continue;
    const value = args[index + 1];
    if (typeof value === "string") values.push(value);
  }
  return values;
}

function promptFromArgs(args: readonly string[]): string {
  const filtered: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value) continue;
    if (value === "--output" || value === "--timeout-ms") {
      index += 1;
      continue;
    }
    if (value === "--palette") continue;
    if (value === "--live") continue;
    filtered.push(value);
  }
  return filtered.join(" ").trim();
}

function isReadinessCommand(value: string | undefined): value is ReadinessCommandName {
  return typeof value === "string" && readinessCommands.has(value as ReadinessCommandName);
}

function isDiagnosticsCommand(value: string | undefined): value is DiagnosticsCommandName {
  return typeof value === "string" && diagnosticsCommands.has(value as DiagnosticsCommandName);
}
