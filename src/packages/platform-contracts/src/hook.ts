import type { JsonObject, SerializableResult } from "./common.js";
import type { HookId } from "./ids.js";

export interface HookManifest {
  readonly id: HookId;
  readonly name: string;
  readonly point: string;
  readonly order: number;
  readonly timeoutMs: number;
  readonly failurePolicy: "fail" | "warn" | "ignore";
}

export interface HookSystem {
  register(manifest: HookManifest, handler?: (input: JsonObject) => Promise<SerializableResult>): Promise<void>;
  run(point: string, input: JsonObject): Promise<readonly SerializableResult[]>;
}
