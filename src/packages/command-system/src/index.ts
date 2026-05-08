import type {
  CommandId,
  CommandManifest,
  CommandSystem,
  JsonObject,
  JsonValue,
  ReadinessCheck,
  ReadinessCommandName,
  ReadinessCommandResult,
  ReadinessCredentialReference,
  SerializableResult
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

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
  readonly config?: JsonObject;
  readonly initialized?: boolean;
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
      value: runLocalReadinessCommand(command, input, environment)
    }));
  }
}

export function runLocalReadinessCommand(command: ReadinessCommandName, input: JsonObject, environment: LocalReadinessEnvironment): ReadinessCommandResult {
  switch (command) {
    case "init":
      return readinessResult(command, environment, initChecks(environment, input), { initialized: Boolean(environment.initialized), force: Boolean(input.force) });
    case "config":
      return readinessResult(command, environment, configChecks(environment), { configKeys: Object.keys(environment.config ?? {}).sort() });
    case "auth": {
      const credential = credentialReference(environment);
      return readinessResult(command, environment, authChecks(credential), { provider: "deepseek" }, credential);
    }
    case "doctor": {
      const credential = credentialReference(environment);
      return readinessResult(command, environment, [...platformChecks(environment), ...configChecks(environment), ...authChecks(credential), ignoredPathCheck(environment)], { checkGroup: "doctor" }, credential);
    }
    case "privacy":
      return readinessResult(command, environment, privacyChecks(), { telemetryExport: "disabled", diagnosticsPersistence: "local-redacted", optOut: true });
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

function readinessResult(
  command: ReadinessCommandName,
  environment: LocalReadinessEnvironment,
  checks: readonly ReadinessCheck[],
  metadata: JsonObject,
  credential?: ReadinessCredentialReference
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
    redaction: { class: "internal", fields: ["credential", "metadata.env"] }
  };
}

function initChecks(environment: LocalReadinessEnvironment, input: JsonObject): readonly ReadinessCheck[] {
  return [
    check("workspace.access", "Workspace access", "pass", `Workspace is available at ${environment.cwd}.`),
    check(
      "init.state",
      "Initialization state",
      environment.initialized && !input.force ? "warn" : "pass",
      environment.initialized && !input.force ? "Workspace already has readiness metadata; no files were rewritten." : "Workspace can be initialized.",
      environment.initialized && !input.force ? ["Use --force only when you intend to refresh generated metadata."] : []
    )
  ];
}

function configChecks(environment: LocalReadinessEnvironment): readonly ReadinessCheck[] {
  const config = environment.config ?? {};
  const keys = Object.keys(config);
  const unknownKeys = keys.filter((key) => !knownConfigKeys.has(key));
  return [
    check("config.loaded", "Config loaded", "pass", keys.length === 0 ? "No local config values found; defaults will be used." : `${keys.length} local config value(s) found.`, [], { keys }),
    check(
      "config.known-keys",
      "Config known keys",
      unknownKeys.length > 0 ? "warn" : "pass",
      unknownKeys.length > 0 ? `Unknown config key(s): ${unknownKeys.join(", ")}.` : "All config keys are known.",
      unknownKeys.length > 0 ? ["Remove unknown keys or add them through a future config schema change."] : [],
      { unknownKeys }
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
  return [
    check("platform.os", "Platform", "pass", `Platform detected: ${environment.platform}.`, [], { platform: environment.platform }),
    check("platform.node", "Node.js", environment.nodeVersion.startsWith("v") ? "pass" : "warn", `Node version: ${environment.nodeVersion}.`, [], { nodeVersion: environment.nodeVersion }),
    check("platform.commands", "Command availability", environment.availableCommands.includes("node") ? "pass" : "warn", `Available commands: ${environment.availableCommands.join(", ") || "none"}.`, [], { commands: environment.availableCommands })
  ];
}

function privacyChecks(): readonly ReadinessCheck[] {
  return [
    check("privacy.telemetry", "Telemetry export", "pass", "Telemetry export is disabled by default for local readiness.", [], { export: "disabled" }),
    check("privacy.diagnostics", "Diagnostics persistence", "pass", "Diagnostics are local and redacted by default.", [], { persistence: "local-redacted" })
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
  if (hasValue(environment.env.DEEPSEEK_API_KEY) || hasValue(environment.env.DEEPSEEK_TOKEN)) {
    return { ref: asId<"credentialRef">("credential-deepseek-api-key"), provider: "deepseek", source: "process-env", available: true, redaction: { class: "secret" } };
  }
  if (hasValue(environment.envFile?.DEEPSEEK_API_KEY) || hasValue(environment.envFile?.DEEPSEEK_TOKEN)) {
    return { ref: asId<"credentialRef">("credential-deepseek-api-key"), provider: "deepseek", source: "env-file", available: true, redaction: { class: "secret" } };
  }
  return { ref: asId<"credentialRef">("credential-deepseek-api-key"), provider: "deepseek", source: "missing", available: false, redaction: { class: "secret" } };
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

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

const knownConfigKeys = new Set(["model", "profile", "telemetry", "privacy", "sandbox", "output"]);

export function isReadinessResult(value: JsonValue | undefined): value is ReadinessCommandResult {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "command" in value && "checks" in value;
}
