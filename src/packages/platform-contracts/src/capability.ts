import type { JsonObject, SerializableResult, TraceContext } from "./common.js";
import type { CapabilityId } from "./ids.js";
import type { ExecutionEnvelope } from "./runtime.js";

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

export interface CapabilityExecutionContext {
  readonly envelope: ExecutionEnvelope;
  readonly trace: TraceContext;
  readonly cancelled?: boolean;
  readonly cancellationReason?: string;
}

export type CapabilityExecutor = (
  input: JsonObject,
  context: CapabilityExecutionContext
) => Promise<SerializableResult>;

export interface CapabilityExecutorBinding {
  readonly manifest: CapabilityManifest;
  readonly execute: CapabilityExecutor;
}

export interface CapabilityRegistry {
  register(manifest: CapabilityManifest, executor?: CapabilityExecutor): Promise<void>;
  get(id: CapabilityId): Promise<CapabilityManifest | undefined>;
  listHostVisible(): Promise<readonly CapabilityManifest[]>;
  listModelVisible(): Promise<readonly CapabilityManifest[]>;
  resolveExecutable(id: CapabilityId): Promise<CapabilityExecutorBinding | undefined>;
  execute(id: CapabilityId, input: JsonObject, context?: CapabilityExecutionContext): Promise<SerializableResult>;
}
