import type { JsonObject } from "./common.js";
import type { ExtensionId } from "./ids.js";
import type { TrustStatus } from "./capability.js";

export interface ExtensionManifest {
  readonly id: ExtensionId;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly integrity: string;
  readonly trust: TrustStatus;
  readonly activation: readonly string[];
  readonly permissions: readonly string[];
  readonly contributions: JsonObject;
}

export interface ExtensionManager {
  load(manifest: ExtensionManifest): Promise<void>;
  list(): Promise<readonly ExtensionManifest[]>;
  contributions(point: string): Promise<readonly JsonObject[]>;
}
