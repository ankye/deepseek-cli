import type { JsonObject, RedactionMetadata } from "./common.js";
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
