import type { JsonObject, RedactionMetadata } from "./common.js";
import type { CommandId, CredentialRef } from "./ids.js";

export type ReadinessStatus = "pass" | "warn" | "fail";

export type ReadinessCommandName = "init" | "config" | "auth" | "doctor" | "privacy" | "verify-install";

export interface ReadinessCheck extends JsonObject {
  readonly id: string;
  readonly label: string;
  readonly status: ReadinessStatus;
  readonly message: string;
  readonly metadata?: JsonObject;
  readonly suggestedActions?: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface ReadinessCredentialReference extends JsonObject {
  readonly ref: CredentialRef;
  readonly provider: "deepseek";
  readonly source: "process-env" | "env-file" | "missing";
  readonly available: boolean;
  readonly redaction: RedactionMetadata;
}

export interface ReadinessCommandResult extends JsonObject {
  readonly commandId: CommandId;
  readonly command: ReadinessCommandName;
  readonly status: ReadinessStatus;
  readonly checks: readonly ReadinessCheck[];
  readonly warnings: readonly string[];
  readonly metadata: JsonObject;
  readonly suggestedActions: readonly string[];
  readonly credential?: ReadinessCredentialReference;
  readonly redaction: RedactionMetadata;
}
