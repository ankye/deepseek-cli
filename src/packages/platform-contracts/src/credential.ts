import type { JsonObject, RedactedError, RedactionMetadata, SerializableResult } from "./common.js";
import type { CredentialRef } from "./ids.js";

export interface CredentialRecord {
  readonly ref: CredentialRef;
  readonly scope: string;
  readonly expiresAt?: string;
  readonly redaction: RedactionMetadata;
  readonly audit: JsonObject;
}

export interface CredentialManager {
  resolve(ref: CredentialRef): Promise<CredentialRecord | undefined>;
  put(record: CredentialRecord): Promise<void>;
  redact(value: string): string;
}

export type CredentialProviderName = "deepseek";

export type CredentialStorageStatus = "available" | "degraded" | "unavailable";

export interface CredentialScope extends JsonObject {
  readonly provider: CredentialProviderName;
  readonly profile: string;
  readonly workspace?: string;
}

export interface CredentialAuditMetadata extends JsonObject {
  readonly operation: "store" | "resolve" | "delete" | "list";
  readonly scope: CredentialScope;
  readonly at: string;
  readonly redaction: RedactionMetadata;
}

export interface CredentialStorageDiagnostic extends JsonObject {
  readonly code: string;
  readonly status: CredentialStorageStatus;
  readonly message: string;
  readonly suggestedActions: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface StoredCredentialReference extends JsonObject {
  readonly ref: CredentialRef;
  readonly scope: CredentialScope;
  readonly source: "secure-storage" | "process-env" | "env-file" | "fake-storage" | "missing";
  readonly available: boolean;
  readonly rotation?: JsonObject;
  readonly audit: CredentialAuditMetadata;
  readonly redaction: RedactionMetadata;
}

export interface CredentialSecretInput {
  readonly value: string;
  readonly source: "stdin" | "prompt" | "environment" | "test";
}

export interface CredentialSecretResult {
  readonly ok: boolean;
  readonly value?: CredentialSecretInput;
  readonly error?: RedactedError;
}

export interface CredentialStorageAdapter {
  status(): Promise<CredentialStorageDiagnostic>;
  store(scope: CredentialScope, secret: CredentialSecretInput): Promise<SerializableResult<StoredCredentialReference>>;
  resolve(ref: CredentialRef): Promise<CredentialSecretResult>;
  delete(scope: CredentialScope): Promise<SerializableResult<StoredCredentialReference>>;
  list(scope?: Partial<CredentialScope>): Promise<readonly StoredCredentialReference[]>;
}

export interface CredentialAuthService {
  storeDeepSeekCredential(secret: CredentialSecretInput, scope?: Partial<CredentialScope>): Promise<SerializableResult<StoredCredentialReference>>;
  resolveDeepSeekCredential(ref: CredentialRef): Promise<CredentialSecretResult>;
  deleteDeepSeekCredential(scope?: Partial<CredentialScope>): Promise<SerializableResult<StoredCredentialReference>>;
  listDeepSeekCredentials(scope?: Partial<CredentialScope>): Promise<readonly StoredCredentialReference[]>;
  status(): Promise<CredentialStorageDiagnostic>;
}
