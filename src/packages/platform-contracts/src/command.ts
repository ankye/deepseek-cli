import type { JsonObject, SerializableResult } from "./common.js";
import type { CommandId } from "./ids.js";

export type CommandInvocationMode = "user" | "model" | "host";

export interface CommandManifest {
  readonly id: CommandId;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly modes: readonly CommandInvocationMode[];
  readonly hostSupport: readonly string[];
  readonly sideEffect: string;
  readonly inputSchema: JsonObject;
}

export interface CommandSystem {
  register(manifest: CommandManifest, handler?: (input: JsonObject) => Promise<SerializableResult>): Promise<void>;
  invoke(nameOrAlias: string, input: JsonObject): Promise<SerializableResult>;
  help(): Promise<readonly CommandManifest[]>;
}
