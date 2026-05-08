import type { JsonObject, SerializableResult } from "./common.js";
import type { CapabilityId } from "./ids.js";

export type SideEffectLevel = "none" | "read" | "write" | "network" | "process";
export type TrustStatus = "trusted" | "workspace" | "untrusted" | "quarantined";

export interface CapabilityManifest {
  readonly id: CapabilityId;
  readonly name: string;
  readonly source: string;
  readonly version: string;
  readonly trust: TrustStatus;
  readonly sideEffect: SideEffectLevel;
  readonly permissions: readonly string[];
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject;
  readonly enabled: boolean;
}

export interface CapabilityRegistry {
  register(manifest: CapabilityManifest, executor?: (input: JsonObject) => Promise<SerializableResult>): Promise<void>;
  get(id: CapabilityId): Promise<CapabilityManifest | undefined>;
  listModelVisible(): Promise<readonly CapabilityManifest[]>;
  execute(id: CapabilityId, input: JsonObject): Promise<SerializableResult>;
}
