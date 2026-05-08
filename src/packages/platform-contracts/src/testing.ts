import type { JsonObject } from "./common.js";
import type { BusEnvelope } from "./bus.js";
import type { ProtocolEnvelope } from "./protocol.js";
import type { RuntimeEvent } from "./runtime.js";
import type { SessionEvent } from "./session.js";

export interface GoldenTrace {
  readonly name: string;
  readonly schemaVersion: string;
  readonly protocol: readonly ProtocolEnvelope[];
  readonly bus: readonly BusEnvelope[];
  readonly runtime: readonly RuntimeEvent[];
  readonly sessions: readonly SessionEvent[];
  readonly assertions: readonly JsonObject[];
}

export interface ReplayResult {
  readonly ok: boolean;
  readonly failures: readonly string[];
}

export interface RegressionHarness {
  normalize(trace: GoldenTrace): Promise<GoldenTrace>;
  replay(trace: GoldenTrace): Promise<ReplayResult>;
  assertSemantic(trace: GoldenTrace, assertion: JsonObject): Promise<ReplayResult>;
}
