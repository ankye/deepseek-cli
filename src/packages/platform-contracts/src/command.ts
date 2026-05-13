import type { JsonObject, SerializableResult } from "./common.js";
import type { CommandId } from "./ids.js";
import type {
  CommandCompositionOwnerSubsystem,
  CommandCompositionProjection,
  CommandCompositionSideEffect,
  CommandCompositionSource,
  CommandCompositionTarget
} from "./command-composition.js";

export type CommandInvocationMode = "user" | "model" | "host";

export interface CommandManifest {
  readonly id: CommandId;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly modes: readonly CommandInvocationMode[];
  readonly hostSupport: readonly string[];
  readonly sideEffect: string;
  readonly inputSchema: JsonObject;
  readonly ownerSubsystem?: CommandCompositionOwnerSubsystem;
  readonly source?: CommandCompositionSource;
  readonly permissions?: readonly string[];
  readonly compatibility?: JsonObject;
  readonly projection?: CommandCompositionProjection;
  readonly target?: CommandCompositionTarget;
  readonly outputSchema?: JsonObject;
  readonly redaction?: JsonObject;
  readonly referencePitFixtureIds?: readonly string[];
  readonly compositionKind?: "command" | "extension-command" | "plugin-command";
  readonly compositionSideEffect?: CommandCompositionSideEffect;
  readonly description?: string;
  readonly metadata?: JsonObject;
}

export interface CommandSystem {
  register(manifest: CommandManifest, handler?: (input: JsonObject) => Promise<SerializableResult>): Promise<void>;
  invoke(nameOrAlias: string, input: JsonObject): Promise<SerializableResult>;
  help(): Promise<readonly CommandManifest[]>;
}
