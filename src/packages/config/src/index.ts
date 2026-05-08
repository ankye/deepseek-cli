import type {
  ConfigDiagnostic,
  ConfigDocument,
  ConfigProfile,
  ConfigScope,
  ConfigService,
  ConfigSourceMetadata,
  ConfigStore,
  ConfigWriteRequest,
  ConfigWriteResult,
  JsonObject,
  JsonValue,
  PlatformRuntime,
  ResolvedConfig,
  ResolvedConfigValue,
  SerializableResult
} from "@deepseek/platform-contracts";

const schemaVersion = "1.0.0";
const appName = "deepseek";
const knownKeys = new Set(["model", "profile", "output", "telemetry", "privacy", "sandbox", "credentialRef"]);
const secretLike = /api[_-]?key|token|password|secret|credential/i;

type ConfigPathResult = { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error?: NonNullable<SerializableResult["error"]> };

export interface PersistentConfigServiceOptions {
  readonly platform: PlatformRuntime;
  readonly workspaceRoot: string;
  readonly defaults?: JsonObject;
  readonly environment?: JsonObject;
  readonly cli?: JsonObject;
  readonly userDocument?: ConfigDocument | undefined;
  readonly workspaceDocument?: ConfigDocument | undefined;
  readonly profile?: string;
}

export class InMemoryConfigStore implements ConfigStore {
  private readonly values = new Map<string, JsonValue>();

  async get<T extends JsonValue = JsonValue>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async set(key: string, value: JsonValue): Promise<void> {
    this.values.set(key, value);
  }

  async profile(): Promise<ConfigProfile> {
    return {
      name: "default",
      values: Object.fromEntries(this.values)
    };
  }
}

export class PersistentConfigService implements ConfigService {
  private readonly profileName: string;
  private userDocument: ConfigDocument | undefined;
  private workspaceDocument: ConfigDocument | undefined;

  constructor(private readonly options: PersistentConfigServiceOptions) {
    this.profileName = options.profile ?? "default";
    this.userDocument = options.userDocument;
    this.workspaceDocument = options.workspaceDocument;
  }

  async load(): Promise<ResolvedConfig> {
    return this.resolve();
  }

  async resolve(overrides: JsonObject = {}): Promise<ResolvedConfig> {
    const sources = [
      documentSource("defaults", { schemaVersion, profile: this.profileName, values: this.options.defaults ?? {}, source: source("defaults", 0), redaction: { class: "public" }, migration: migration() }),
      documentSource("user", this.userDocument ?? (await this.readDocument("user"))),
      documentSource("workspace", this.workspaceDocument ?? (await this.readDocument("workspace"))),
      documentSource("environment", { schemaVersion, profile: this.profileName, values: this.options.environment ?? {}, source: source("environment", 3), redaction: { class: "sensitive" }, migration: migration() }),
      documentSource("cli", { schemaVersion, profile: this.profileName, values: { ...(this.options.cli ?? {}), ...overrides }, source: source("cli", 4), redaction: { class: "internal" }, migration: migration() })
    ].filter((entry): entry is ConfigDocument => Boolean(entry));

    const diagnostics = sources.flatMap((document) => validateDocument(document));
    const keys = new Set<string>();
    for (const document of sources) {
      for (const key of Object.keys(document.values)) keys.add(key);
    }

    const values: ResolvedConfigValue[] = [];
    for (const key of [...keys].sort()) {
      const candidates = sources
        .filter((document) => Object.prototype.hasOwnProperty.call(document.values, key))
        .sort((left, right) => right.source.priority - left.source.priority);
      const winner = candidates[0];
      if (!winner) continue;
      const value = winner.values[key];
      if (value !== undefined) {
        values.push({
          key,
          value,
          redactedValue: redactConfigValue(key, value),
          source: winner.source,
          shadowedSources: candidates.slice(1).map((candidate) => candidate.source),
          redaction: secretLike.test(key) ? { class: "secret" } : { class: "internal" }
        });
      }
    }

    return {
      schemaVersion,
      profile: this.profileName,
      values,
      diagnostics,
      redaction: { class: "internal", fields: ["values.value"] }
    };
  }

  async set(request: ConfigWriteRequest): Promise<ConfigWriteResult> {
    const diagnostics: ConfigDiagnostic[] = [];
    if (isSecretLikeConfig(request.key, request.value)) {
      diagnostics.push(diagnostic("CONFIG_SECRET_VALUE_REJECTED", "error", request.key, "Raw secret-like values must be stored through credential-auth-management.", source(request.scope, priority(request.scope)), [
        "Use deepseek auth to store a credential reference."
      ]));
      return { ok: false, diagnostics, error: { code: "CONFIG_SECRET_VALUE_REJECTED", message: "Raw secret-like config value rejected.", retryable: false, redaction: { class: "public" } } };
    }

    const pathResult = this.pathForScope(request.scope);
    if (!pathResult.ok) {
      return pathResult.error ? { ok: false, diagnostics, error: pathResult.error } : { ok: false, diagnostics };
    }

    const current = (await this.document(request.scope)) ?? createDocument(request.scope, {}, this.profileName, pathResult.value);
    const next = createDocument(request.scope, { ...current.values, [request.key]: request.value }, request.profile ?? current.profile, current.source.path);
    diagnostics.push(...validateDocument(next));
    if (diagnostics.some((item) => item.severity === "error")) return { ok: false, document: next, diagnostics };

    const write = await this.options.platform.atomicWriteFile(pathResult.value, `${JSON.stringify(next, null, 2)}\n`);
    if (!write.ok) {
      return write.error ? { ok: false, document: next, diagnostics, error: write.error } : { ok: false, document: next, diagnostics };
    }
    if (request.scope === "user") this.userDocument = next;
    if (request.scope === "workspace") this.workspaceDocument = next;
    return { ok: true, document: next, diagnostics };
  }

  async document(scopeName: "user" | "workspace"): Promise<ConfigDocument | undefined> {
    if (scopeName === "user") return this.userDocument ?? (await this.readDocument("user"));
    return this.workspaceDocument ?? (await this.readDocument("workspace"));
  }

  private async readDocument(scopeName: "user" | "workspace"): Promise<ConfigDocument | undefined> {
    const pathResult = this.pathForScope(scopeName);
    if (!pathResult.ok) return undefined;
    try {
      const parsed: unknown = JSON.parse(await this.options.platform.readFile(pathResult.value));
      return normalizeDocument(scopeName, parsed, pathResult.value, this.profileName);
    } catch {
      return undefined;
    }
  }

  private pathForScope(scopeName: "user" | "workspace"): ConfigPathResult {
    if (scopeName === "user") return { ok: true, value: this.options.platform.userConfigPath(appName) };
    const result = this.options.platform.workspaceMetadataPath(this.options.workspaceRoot, appName);
    if (result.ok && result.value) return { ok: true, value: result.value };
    return result.error ? { ok: false, error: result.error } : { ok: false };
  }
}

export function createConfigDocument(scopeName: "user" | "workspace", values: JsonObject, profile = "default", path?: string): ConfigDocument {
  return createDocument(scopeName, values, profile, path);
}

export function validateConfigDocument(document: ConfigDocument): readonly ConfigDiagnostic[] {
  return validateDocument(document);
}

export function redactConfigValue(key: string, value: JsonValue): JsonValue {
  if (secretLike.test(key)) return "[REDACTED]";
  if (typeof value === "string" && looksLikeSecret(value)) return "[REDACTED]";
  return value;
}

function documentSource(scopeName: ConfigScope, document: ConfigDocument | undefined): ConfigDocument | undefined {
  if (!document) return undefined;
  return { ...document, source: { ...document.source, scope: scopeName, priority: priority(scopeName) } };
}

function normalizeDocument(scopeName: "user" | "workspace", value: unknown, path: string, profile: string): ConfigDocument | undefined {
  if (!isJsonObject(value)) return undefined;
  const documentSchemaVersion = typeof value.schemaVersion === "string" ? value.schemaVersion : schemaVersion;
  return {
    schemaVersion: documentSchemaVersion,
    profile: typeof value.profile === "string" ? value.profile : profile,
    values: isJsonObject(value.values) ? value.values : {},
    source: source(scopeName, priority(scopeName), path),
    redaction: { class: "internal", fields: ["values.*secret*", "values.*token*", "values.*key*"] },
    migration: migration(documentSchemaVersion)
  };
}

function createDocument(scopeName: "user" | "workspace", values: JsonObject, profile: string, path?: string): ConfigDocument {
  return {
    schemaVersion,
    profile,
    values,
    source: source(scopeName, priority(scopeName), path),
    redaction: { class: "internal", fields: ["values.*secret*", "values.*token*", "values.*key*"] },
    migration: migration()
  };
}

function validateDocument(document: ConfigDocument): readonly ConfigDiagnostic[] {
  const diagnostics: ConfigDiagnostic[] = [];
  if (document.schemaVersion !== schemaVersion) {
    diagnostics.push(diagnostic("CONFIG_SCHEMA_VERSION_UNSUPPORTED", "error", "schemaVersion", `Unsupported config schema version ${document.schemaVersion}.`, document.source, ["Run a config migration before using this file."]));
  }
  for (const [key, value] of Object.entries(document.values)) {
    if (!knownKeys.has(key)) {
      diagnostics.push(diagnostic("CONFIG_UNKNOWN_KEY", "warn", key, `Unknown config key: ${key}.`, document.source, ["Remove the key or add it through an OpenSpec config schema change."]));
    }
    if (isSecretLikeConfig(key, value)) {
      diagnostics.push(diagnostic("CONFIG_SECRET_VALUE_REJECTED", "error", key, "Raw secret-like values are not allowed in config documents.", document.source, ["Use credential-auth-management and store only credentialRef in config."]));
    }
  }
  return diagnostics;
}

function isSecretLikeConfig(key: string, value: JsonValue | undefined): boolean {
  if (secretLike.test(key) && key !== "credentialRef") return true;
  return typeof value === "string" && looksLikeSecret(value);
}

function looksLikeSecret(value: string): boolean {
  return /^sk-[A-Za-z0-9_-]{8,}/.test(value) || /Bearer\s+[A-Za-z0-9._~+/=-]+/i.test(value);
}

function diagnostic(code: string, severity: ConfigDiagnostic["severity"], keyPath: string, message: string, metadata: ConfigSourceMetadata, suggestedActions: readonly string[]): ConfigDiagnostic {
  return {
    code,
    severity,
    keyPath,
    message,
    source: metadata,
    suggestedActions,
    redaction: { class: "internal" }
  };
}

function source(scopeName: ConfigScope, priorityValue: number, path?: string): ConfigSourceMetadata {
  return { scope: scopeName, priority: priorityValue, ...(path ? { path } : {}) };
}

function priority(scopeName: ConfigScope): number {
  return { defaults: 0, user: 1, workspace: 2, environment: 3, cli: 4 }[scopeName];
}

function migration(version = schemaVersion) {
  return { schemaVersion: version, minReaderVersion: "0.1.0" };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
