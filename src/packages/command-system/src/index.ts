import type {
  CommandId,
  CommandManifest,
  CommandSystem,
  JsonObject,
  JsonValue,
  ModelLiveVerificationResult,
  PlatformDescriptor,
  ReadinessCheck,
  ReadinessCommandName,
  ReadinessCommandResult,
  ReadinessCredentialReference,
  ResolvedConfig,
  SerializableResult
} from "@deepseek/platform-contracts";
import type { StoredCredentialReference } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export type InteractiveControlCommandName = "help" | "exit" | "quit" | "clear" | "cancel" | "resume" | "fork";
export type InteractiveControlAction = "help" | "exit" | "clear" | "cancel" | "resume" | "fork";

export interface InteractiveControlResult extends JsonObject {
  readonly action: InteractiveControlAction;
  readonly command: InteractiveControlCommandName;
  readonly message: string;
  readonly terminal: boolean;
  readonly controls?: readonly JsonObject[];
  readonly sessionId?: string;
  readonly parentSessionId?: string;
}

export class InMemoryCommandSystem implements CommandSystem {
  private readonly manifests = new Map<string, CommandManifest>();
  private readonly aliases = new Map<string, string>();
  private readonly handlers = new Map<string, (input: JsonObject) => Promise<SerializableResult>>();

  async register(manifest: CommandManifest, handler?: (input: JsonObject) => Promise<SerializableResult>): Promise<void> {
    this.manifests.set(manifest.id, manifest);
    this.aliases.set(manifest.name, manifest.id);
    for (const alias of manifest.aliases) this.aliases.set(alias, manifest.id);
    if (handler) this.handlers.set(manifest.id, handler);
  }

  async invoke(nameOrAlias: string, input: JsonObject): Promise<SerializableResult> {
    const id = this.aliases.get(nameOrAlias);
    const handler = id ? this.handlers.get(id) : undefined;
    if (!handler) {
      return { ok: false, error: { code: "COMMAND_NOT_FOUND", message: nameOrAlias, retryable: false, redaction: { class: "public" } } };
    }
    return handler(input);
  }

  async help(): Promise<readonly CommandManifest[]> {
    return [...this.manifests.values()];
  }
}

export interface LocalReadinessEnvironment {
  readonly cwd: string;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly envFile?: Readonly<Record<string, string | undefined>>;
  readonly ignoredPaths: readonly string[];
  readonly availableCommands: readonly string[];
  readonly platformDescriptor?: PlatformDescriptor;
  readonly config?: JsonObject;
  readonly resolvedConfig?: ResolvedConfig;
  readonly credentialReferences?: readonly StoredCredentialReference[];
  readonly workspaceMetadataPath?: string;
  readonly liveVerifier?: () => Promise<ModelLiveVerificationResult>;
  readonly initialized?: boolean;
  readonly initializedThisRun?: boolean;
}

export function createDefaultReadinessEnvironment(env: Readonly<Record<string, string | undefined>>): LocalReadinessEnvironment {
  return {
    cwd: ".",
    nodeVersion: "unknown",
    platform: "unknown",
    packageName: "deepseek-cli-platform",
    packageVersion: "0.1.0",
    env,
    ignoredPaths: [".env", ".env.*", "参考/"],
    availableCommands: ["node", "npm"],
    config: {},
    initialized: false
  };
}

export async function registerLocalReadinessCommands(commandSystem: CommandSystem, environment: LocalReadinessEnvironment): Promise<void> {
  for (const command of readinessCommandNames) {
    await commandSystem.register(readinessManifest(command), async (input) => ({
      ok: true,
      value: await runLocalReadinessCommand(command, input, environment)
    }));
  }
}

export async function runLocalReadinessCommand(command: ReadinessCommandName, input: JsonObject, environment: LocalReadinessEnvironment): Promise<ReadinessCommandResult> {
  switch (command) {
    case "init":
      return readinessResult(command, environment, initChecks(environment, input), { initialized: Boolean(environment.initialized), initializedThisRun: Boolean(environment.initializedThisRun), force: Boolean(input.force), workspaceMetadataPath: environment.workspaceMetadataPath });
    case "config":
      return readinessResult(command, environment, configChecks(environment), { configKeys: Object.keys(environment.config ?? {}).sort(), resolvedConfig: redactedResolvedConfig(environment.resolvedConfig) });
    case "auth": {
      const credential = credentialReference(environment);
      return readinessResult(command, environment, authChecks(credential), { provider: "deepseek", credentialCount: environment.credentialReferences?.length ?? 0 }, credential);
    }
    case "doctor": {
      const credential = credentialReference(environment);
      const live = input.live === true && environment.liveVerifier ? await environment.liveVerifier() : undefined;
      return readinessResult(command, environment, [...platformChecks(environment), ...configChecks(environment), ...authChecks(credential), ignoredPathCheck(environment), ...liveChecks(live, input.live === true)], { checkGroup: "doctor", liveRequested: input.live === true }, credential, live);
    }
    case "privacy":
      return readinessResult(command, environment, privacyChecks(environment), { telemetryExport: resolvedValue(environment, "telemetry") ?? "disabled", diagnosticsPersistence: "local-redacted", privacy: resolvedValue(environment, "privacy") ?? "local" });
    case "verify-install":
      return readinessResult(command, environment, verifyInstallChecks(environment), { packageName: environment.packageName, packageVersion: environment.packageVersion });
  }
}

export async function invokeLocalReadinessCommand(command: ReadinessCommandName, input: JsonObject, environment: LocalReadinessEnvironment): Promise<SerializableResult<ReadinessCommandResult>> {
  const commandSystem = new InMemoryCommandSystem();
  await registerLocalReadinessCommands(commandSystem, environment);
  const result = await commandSystem.invoke(command, input);
  if (!result.ok || !isReadinessResult(result.value)) {
    return { ok: false, error: result.error ?? { code: "READINESS_COMMAND_FAILED", message: command, retryable: false, redaction: { class: "public" } } };
  }
  return { ok: true, value: result.value };
}

export const readinessCommandNames = ["init", "config", "auth", "doctor", "privacy", "verify-install"] as const satisfies readonly ReadinessCommandName[];
export const interactiveControlCommandNames = ["help", "exit", "quit", "clear", "cancel", "resume", "fork"] as const satisfies readonly InteractiveControlCommandName[];
const registeredInteractiveControlCommandNames = ["help", "exit", "clear", "cancel", "resume", "fork"] as const satisfies readonly InteractiveControlCommandName[];

export async function registerInteractiveControlCommands(commandSystem: CommandSystem): Promise<void> {
  for (const command of registeredInteractiveControlCommandNames) {
    await commandSystem.register(interactiveControlManifest(command), async (input) => runInteractiveControlCommand(command, input));
  }
}

export async function invokeInteractiveControlCommand(command: InteractiveControlCommandName, input: JsonObject = {}): Promise<SerializableResult<InteractiveControlResult>> {
  return invokeInteractiveCommand(command, input);
}

export async function invokeInteractiveCommand(nameOrAlias: string, input: JsonObject = {}): Promise<SerializableResult<InteractiveControlResult>> {
  const commandSystem = new InMemoryCommandSystem();
  await registerInteractiveControlCommands(commandSystem);
  const result = await commandSystem.invoke(nameOrAlias, input);
  if (!result.ok || !isInteractiveControlResult(result.value)) {
    return { ok: false, error: result.error ?? { code: "INTERACTIVE_COMMAND_FAILED", message: nameOrAlias, retryable: false, redaction: { class: "public" } } };
  }
  return { ok: true, value: result.value };
}

export function interactiveControlManifest(command: InteractiveControlCommandName): CommandManifest {
  const registeredCommand = command === "quit" ? "exit" : command;
  return {
    id: interactiveCommandId(registeredCommand),
    name: registeredCommand,
    aliases: registeredCommand === "exit" ? ["quit"] : [],
    modes: ["user", "host"],
    hostSupport: ["cli"],
    sideEffect: interactiveControlSideEffect(registeredCommand),
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: "string" },
        sessionId: { type: "string" },
        parentSessionId: { type: "string" }
      }
    }
  };
}

export function readinessManifest(command: ReadinessCommandName): CommandManifest {
  return {
    id: commandId(command),
    name: command,
    aliases: command === "verify-install" ? ["verify"] : [],
    modes: ["user", "host"],
    hostSupport: ["cli", "vscode", "server"],
    sideEffect: command === "init" ? "workspace-metadata" : "none",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: command === "init" ? { force: { type: "boolean" } } : {}
    }
  };
}

function runInteractiveControlCommand(command: InteractiveControlCommandName, input: JsonObject): SerializableResult<InteractiveControlResult> {
  const action = interactiveControlAction(command);
  return {
    ok: true,
    value: {
      action,
      command,
      terminal: action === "exit",
      message: interactiveControlMessage(command, input),
      ...(typeof input.sessionId === "string" ? { sessionId: input.sessionId } : {}),
      ...(typeof input.parentSessionId === "string" ? { parentSessionId: input.parentSessionId } : {}),
      ...(action === "help" ? { controls: interactiveHelpProjection() } : {})
    }
  };
}

function interactiveControlAction(command: InteractiveControlCommandName): InteractiveControlAction {
  if (command === "quit") return "exit";
  return command;
}

function interactiveControlSideEffect(command: InteractiveControlCommandName): string {
  const action = interactiveControlAction(command);
  if (action === "cancel") return "runtime-control";
  if (action === "exit") return "host-lifecycle";
  if (action === "clear") return "host-render";
  if (action === "resume" || action === "fork") return "session-control";
  return "none";
}

function interactiveControlMessage(command: InteractiveControlCommandName, input: JsonObject): string {
  const action = interactiveControlAction(command);
  if (action === "help") return "Interactive controls are available.";
  if (action === "exit") return "Interactive session closing.";
  if (action === "clear") return "Interactive display cleared.";
  if (action === "resume") return typeof input.sessionId === "string" ? `Resume requested: ${input.sessionId}` : "Resume requires a session id.";
  if (action === "fork") return typeof input.parentSessionId === "string" ? `Fork requested: ${input.parentSessionId}` : "Fork requires a parent session id.";
  const reason = typeof input.reason === "string" && input.reason.trim() ? input.reason.trim() : "user requested cancellation";
  return `Cancellation requested: ${reason}`;
}

export function interactiveHelpProjection(): readonly JsonObject[] {
  return registeredInteractiveControlCommandNames.map((command) => ({
    name: `/${command}`,
    aliases: interactiveControlManifest(command).aliases.map((alias) => `/${alias}`),
    action: interactiveControlAction(command),
    sideEffect: interactiveControlSideEffect(command),
    hostSupport: ["cli"]
  }));
}

export function renderInteractiveControlText(result: InteractiveControlResult): readonly string[] {
  if (result.action === "help") {
    const lines: string[] = ["Chat controls:"];
    for (const entry of interactiveHelpProjection()) {
      const name = String(entry.name ?? "");
      const aliases = Array.isArray(entry.aliases) ? (entry.aliases as readonly string[]) : [];
      const aliasSuffix = aliases.length > 0 ? ` (aliases: ${aliases.join(", ")})` : "";
      lines.push(`  ${name}${aliasSuffix} — ${String(entry.sideEffect ?? "")}`);
    }
    lines.push("  /cost — show accumulated token usage for the current session");
    lines.push("  /model — show the active model profile");
    lines.push("Ctrl+C once cancels an active turn; Ctrl+C twice within 2s exits.");
    return lines;
  }
  if (result.action === "clear") {
    return ["\x1B[2J\x1B[H", ""];
  }
  if (result.action === "exit") {
    return [`[chat] ${result.message || "exit requested"}`];
  }
  if (result.action === "cancel") {
    return [`[chat] ${result.message || "cancellation requested"}`];
  }
  return [`[chat] ${result.action}: ${result.message}`];
}

function readinessResult(
  command: ReadinessCommandName,
  environment: LocalReadinessEnvironment,
  checks: readonly ReadinessCheck[],
  metadata: JsonObject,
  credential?: ReadinessCredentialReference,
  live?: ModelLiveVerificationResult
): ReadinessCommandResult {
  const warnings = checks.filter((check) => check.status === "warn").map((check) => check.message);
  const status = checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass";
  return {
    commandId: commandId(command),
    command,
    status,
    checks,
    warnings,
    metadata: {
      cwd: environment.cwd,
      platform: environment.platform,
      nodeVersion: environment.nodeVersion,
      ...metadata
    },
    suggestedActions: [...new Set(checks.flatMap((check) => check.suggestedActions ?? []))],
    ...(credential ? { credential } : {}),
    ...(live ? { live } : {}),
    redaction: { class: "internal", fields: ["credential", "metadata.env"] }
  };
}

function initChecks(environment: LocalReadinessEnvironment, input: JsonObject): readonly ReadinessCheck[] {
  const alreadyInitialized = Boolean(environment.initialized);
  const initializedThisRun = Boolean(environment.initializedThisRun);
  return [
    check("workspace.access", "Workspace access", "pass", `Workspace is available at ${environment.cwd}.`),
    check(
      "init.state",
      "Initialization state",
      alreadyInitialized && !input.force ? "warn" : "pass",
      alreadyInitialized && !input.force
        ? "Workspace already has readiness metadata; no files were rewritten."
        : initializedThisRun
          ? "Workspace readiness metadata was initialized."
          : "Workspace can be initialized.",
      alreadyInitialized && !input.force ? ["Use --force only when you intend to refresh generated metadata."] : []
    )
  ];
}

function configChecks(environment: LocalReadinessEnvironment): readonly ReadinessCheck[] {
  const config = environment.config ?? {};
  const keys = Object.keys(config);
  const unknownKeys = keys.filter((key) => !knownConfigKeys.has(key));
  const diagnostics = environment.resolvedConfig?.diagnostics ?? [];
  return [
    check("config.loaded", "Config loaded", "pass", keys.length === 0 ? "No local config values found; defaults will be used." : `${keys.length} local config value(s) found.`, [], { keys }),
    check(
      "config.known-keys",
      "Config known keys",
      unknownKeys.length > 0 || diagnostics.some((diagnostic) => diagnostic.severity === "warn") ? "warn" : diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "fail" : "pass",
      unknownKeys.length > 0 ? `Unknown config key(s): ${unknownKeys.join(", ")}.` : diagnostics.length > 0 ? `${diagnostics.length} config diagnostic(s) found.` : "All config keys are known.",
      diagnostics.flatMap((diagnostic) => diagnostic.suggestedActions ?? []),
      { unknownKeys, diagnosticCodes: diagnostics.map((diagnostic) => diagnostic.code) }
    )
  ];
}

function authChecks(credential: ReadinessCredentialReference): readonly ReadinessCheck[] {
  return [
    check(
      "auth.deepseek",
      "DeepSeek credential",
      credential.available ? "pass" : "warn",
      credential.available ? `DeepSeek credential reference ${credential.ref} is available from ${credential.source}.` : "DeepSeek credential was not found.",
      credential.available ? [] : ["Set DEEPSEEK_API_KEY or DEEPSEEK_TOKEN in an untracked local environment source."],
      { provider: credential.provider, source: credential.source, available: credential.available }
    )
  ];
}

function platformChecks(environment: LocalReadinessEnvironment): readonly ReadinessCheck[] {
  const descriptor = environment.platformDescriptor;
  if (descriptor) {
    return [
      check("platform.descriptor", "Platform descriptor", descriptor.degraded ? "warn" : "pass", `Platform ${descriptor.os}/${descriptor.environmentKind} (${descriptor.architecture}) detected.`, [], {
        os: descriptor.os,
        environmentKind: descriptor.environmentKind,
        architecture: descriptor.architecture,
        degraded: descriptor.degraded,
        degradedReasons: descriptor.degradedReasons
      }),
      check("platform.shell", "Shell provider", descriptor.shell.available ? "pass" : "warn", descriptor.shell.available ? `Shell provider ${descriptor.shell.provider} is available.` : "Shell provider is unavailable.", descriptor.shell.diagnostics.flatMap((diagnostic) => diagnostic.suggestedActions), {
        profile: descriptor.shell.profile,
        provider: descriptor.shell.provider,
        status: descriptor.shell.status,
        diagnostics: descriptor.shell.diagnostics.map((diagnostic) => diagnostic.code)
      }),
      check("platform.search", "Search provider", descriptor.search.status === "available" ? "pass" : "warn", `Search provider ${descriptor.search.provider} selected.`, descriptor.search.diagnostics.flatMap((diagnostic) => diagnostic.suggestedActions), {
        provider: descriptor.search.provider,
        status: descriptor.search.status,
        fallbackChain: descriptor.search.fallbackChain,
        timeoutMs: descriptor.search.timeoutMs,
        diagnostics: descriptor.search.diagnostics.map((diagnostic) => diagnostic.code)
      }),
      check("platform.secure-storage", "Secure storage", descriptor.secureStorage.status === "available" ? "pass" : "warn", `Secure storage provider: ${descriptor.secureStorage.provider}.`, descriptor.secureStorage.diagnostics.flatMap((diagnostic) => diagnostic.suggestedActions), {
        provider: descriptor.secureStorage.provider,
        status: descriptor.secureStorage.status,
        diagnostics: descriptor.secureStorage.diagnostics.map((diagnostic) => diagnostic.code)
      }),
      check("platform.native", "Native capabilities", descriptor.nativeCapabilities.every((capability) => capability.status !== "unavailable") ? "pass" : "warn", `${descriptor.nativeCapabilities.filter((capability) => capability.status === "unavailable").length} native capability probe(s) unavailable.`, descriptor.nativeCapabilities.flatMap((capability) => capability.diagnostics.flatMap((diagnostic) => diagnostic.suggestedActions)), {
        capabilities: descriptor.nativeCapabilities.map((capability) => ({ name: capability.capability, status: capability.status, provider: capability.provider }))
      })
    ];
  }
  return [
    check("platform.os", "Platform", "pass", `Platform detected: ${environment.platform}.`, [], { platform: environment.platform }),
    check("platform.node", "Node.js", environment.nodeVersion.startsWith("v") ? "pass" : "warn", `Node version: ${environment.nodeVersion}.`, [], { nodeVersion: environment.nodeVersion }),
    check("platform.commands", "Command availability", environment.availableCommands.includes("node") ? "pass" : "warn", `Available commands: ${environment.availableCommands.join(", ") || "none"}.`, [], { commands: environment.availableCommands })
  ];
}

function privacyChecks(environment: LocalReadinessEnvironment): readonly ReadinessCheck[] {
  const telemetry = resolvedValue(environment, "telemetry") ?? "disabled";
  const privacy = resolvedValue(environment, "privacy") ?? "local";
  return [
    check("privacy.telemetry", "Telemetry export", telemetry === "enabled" ? "warn" : "pass", `Telemetry export policy: ${telemetry}.`, telemetry === "enabled" ? ["Review telemetry policy before sharing diagnostics."] : [], { export: telemetry }),
    check("privacy.diagnostics", "Diagnostics persistence", "pass", "Diagnostics are local and redacted by default.", [], { persistence: "local-redacted", privacy })
  ];
}

function verifyInstallChecks(environment: LocalReadinessEnvironment): readonly ReadinessCheck[] {
  return [
    check("install.package", "Package metadata", "pass", `${environment.packageName}@${environment.packageVersion} is available.`, [], { packageName: environment.packageName, packageVersion: environment.packageVersion }),
    check("install.executable", "Executable", "pass", "CLI executable surface is available through the current workspace.", [], { command: "deepseek" }),
    ignoredPathCheck(environment)
  ];
}

function ignoredPathCheck(environment: LocalReadinessEnvironment): ReadinessCheck {
  const required = [".env", "参考/"];
  const missing = required.filter((path) => !environment.ignoredPaths.includes(path));
  return check(
    "install.ignored-paths",
    "Ignored local paths",
    missing.length > 0 ? "warn" : "pass",
    missing.length > 0 ? `Missing ignore entries: ${missing.join(", ")}.` : "Local secret and reference paths are ignored.",
    missing.length > 0 ? ["Update .gitignore before committing."] : [],
    { required, missing }
  );
}

function credentialReference(environment: LocalReadinessEnvironment): ReadinessCredentialReference {
  const stored = environment.credentialReferences?.find((reference) => reference.available);
  if (stored) {
    return { ref: stored.ref, provider: "deepseek", source: stored.source, available: true, redaction: { class: "secret" } };
  }
  if (hasValue(environment.env.DEEPSEEK_API_KEY) || hasValue(environment.env.DEEPSEEK_TOKEN)) {
    return { ref: asId<"credentialRef">("credential-deepseek-api-key"), provider: "deepseek", source: "process-env", available: true, redaction: { class: "secret" } };
  }
  if (hasValue(environment.envFile?.DEEPSEEK_API_KEY) || hasValue(environment.envFile?.DEEPSEEK_TOKEN)) {
    return { ref: asId<"credentialRef">("credential-deepseek-api-key"), provider: "deepseek", source: "env-file", available: true, redaction: { class: "secret" } };
  }
  return { ref: asId<"credentialRef">("credential-deepseek-api-key"), provider: "deepseek", source: "missing", available: false, redaction: { class: "secret" } };
}

function liveChecks(live: ModelLiveVerificationResult | undefined, requested: boolean): readonly ReadinessCheck[] {
  if (!requested) {
    return [check("doctor.live", "Live provider verification", "pass", "Live provider verification was not requested; doctor stayed offline.", [], { requested: false })];
  }
  if (!live) {
    return [check("doctor.live", "Live provider verification", "warn", "Live provider verification was requested but no live verifier was configured.", ["Configure a model gateway live verifier."], { requested: true })];
  }
  return [
    check(
      "doctor.live",
      "Live provider verification",
      live.ok ? "pass" : "warn",
      live.ok ? `DeepSeek live verification completed for ${live.provider.model}.` : `DeepSeek live verification did not complete: ${live.terminalStatus}.`,
      live.ok ? [] : live.diagnostics.flatMap((diagnostic) => (Array.isArray(diagnostic.details?.suggestedActions) ? diagnostic.details.suggestedActions.map(String) : [])),
      { requested: true, terminalStatus: live.terminalStatus, eventKinds: live.eventKinds, reachable: live.reachable }
    )
  ];
}

function resolvedValue(environment: LocalReadinessEnvironment, key: string): JsonValue | undefined {
  return environment.resolvedConfig?.values.find((value) => value.key === key)?.redactedValue ?? environment.config?.[key];
}

function redactedResolvedConfig(config: ResolvedConfig | undefined): JsonObject {
  if (!config) return {};
  return {
    schemaVersion: config.schemaVersion,
    profile: config.profile,
    values: config.values.map((value) => ({ key: value.key, value: value.redactedValue, source: value.source.scope, shadowedSources: value.shadowedSources.map((source) => source.scope) })),
    diagnostics: config.diagnostics.map((diagnostic) => ({ code: diagnostic.code, severity: diagnostic.severity, keyPath: diagnostic.keyPath, message: diagnostic.message }))
  };
}

function check(id: string, label: string, status: ReadinessCheck["status"], message: string, suggestedActions: readonly string[] = [], metadata: JsonObject = {}): ReadinessCheck {
  return {
    id,
    label,
    status,
    message,
    metadata,
    suggestedActions,
    redaction: { class: "internal" }
  };
}

function commandId(command: ReadinessCommandName): CommandId {
  return asId<"command">(`readiness.${command}`);
}

function interactiveCommandId(command: InteractiveControlCommandName): CommandId {
  return asId<"command">(`interactive.${command}`);
}

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

const knownConfigKeys = new Set(["model", "profile", "telemetry", "privacy", "sandbox", "output"]);

export function isReadinessResult(value: JsonValue | undefined): value is ReadinessCommandResult {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "command" in value && "checks" in value;
}

export function isInteractiveControlCommandName(value: string | undefined): value is InteractiveControlCommandName {
  return typeof value === "string" && interactiveControlCommandNames.includes(value as InteractiveControlCommandName);
}

export function isInteractiveControlResult(value: JsonValue | undefined): value is InteractiveControlResult {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "action" in value && "command" in value && "terminal" in value;
}
