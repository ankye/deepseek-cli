import type { JsonObject, JsonValue, RedactedError, RedactionMetadata } from "./common.js";
import type { CredentialRef } from "./ids.js";

export interface ConfigProfile {
  readonly name: string;
  readonly values: Readonly<Record<string, JsonValue>>;
}

export interface ConfigStore {
  get<T extends JsonValue = JsonValue>(key: string): Promise<T | undefined>;
  set(key: string, value: JsonValue): Promise<void>;
  profile(): Promise<ConfigProfile>;
}

export type ConfigScope = "defaults" | "user" | "workspace" | "environment" | "cli";

export type ConfigDiagnosticSeverity = "info" | "warn" | "error";

export interface ConfigSourceMetadata extends JsonObject {
  readonly scope: ConfigScope;
  readonly path?: string;
  readonly envKey?: string;
  readonly argv?: string;
  readonly priority: number;
}

export interface ConfigMigrationMetadata extends JsonObject {
  readonly schemaVersion: string;
  readonly minReaderVersion?: string;
  readonly migrationId?: string;
}

export interface ConfigDocument extends JsonObject {
  readonly schemaVersion: string;
  readonly profile: string;
  readonly values: JsonObject;
  readonly source: ConfigSourceMetadata;
  readonly redaction: RedactionMetadata;
  readonly migration: ConfigMigrationMetadata;
}

export interface ConfigDiagnostic extends JsonObject {
  readonly code: string;
  readonly severity: ConfigDiagnosticSeverity;
  readonly keyPath: string;
  readonly message: string;
  readonly source?: ConfigSourceMetadata;
  readonly suggestedActions: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ResolvedConfigValue extends JsonObject {
  readonly key: string;
  readonly value: JsonValue;
  readonly redactedValue: JsonValue;
  readonly source: ConfigSourceMetadata;
  readonly shadowedSources: readonly ConfigSourceMetadata[];
  readonly redaction: RedactionMetadata;
}

export interface ResolvedConfig extends JsonObject {
  readonly schemaVersion: string;
  readonly profile: string;
  readonly values: readonly ResolvedConfigValue[];
  readonly diagnostics: readonly ConfigDiagnostic[];
  readonly redaction: RedactionMetadata;
}

export interface ConfigWriteRequest extends JsonObject {
  readonly scope: "user" | "workspace";
  readonly key: string;
  readonly value: JsonValue;
  readonly profile?: string;
}

export interface ConfigWriteResult extends JsonObject {
  readonly ok: boolean;
  readonly document?: ConfigDocument;
  readonly diagnostics: readonly ConfigDiagnostic[];
  readonly error?: RedactedError;
}

export interface ConfigService {
  load(): Promise<ResolvedConfig>;
  resolve(overrides?: JsonObject): Promise<ResolvedConfig>;
  set(request: ConfigWriteRequest): Promise<ConfigWriteResult>;
  document(scope: "user" | "workspace"): Promise<ConfigDocument | undefined>;
}

export interface DeepSeekConfigValues extends JsonObject {
  readonly model?: string;
  readonly profile?: string;
  readonly output?: "text" | "stream-json" | "json";
  readonly telemetry?: "disabled" | "local" | "enabled";
  readonly privacy?: "local" | "redacted" | "strict";
  readonly sandbox?: "ask" | "allow" | "deny";
  readonly credentialRef?: CredentialRef;
}
