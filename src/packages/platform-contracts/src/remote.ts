import type { JsonObject } from "./common.js";
import type { SessionId } from "./ids.js";

export interface RemoteBinding {
  readonly id: string;
  readonly sessionId: SessionId;
  readonly transport: "local-server" | "relay" | "ide-bridge";
  readonly trustedDevice: JsonObject;
}

export interface RemoteRuntimeConnectivity {
  bind(binding: RemoteBinding): Promise<void>;
  reconnect(id: string): Promise<RemoteBinding | undefined>;
  cancelRemote(id: string, reason: string): Promise<void>;
}
