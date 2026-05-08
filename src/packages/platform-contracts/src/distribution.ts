import type { JsonObject } from "./common.js";

export interface ReleaseMetadata {
  readonly version: string;
  readonly channel: string;
  readonly signedMetadata: string;
  readonly compatibility: readonly string[];
}

export interface DistributionUpdateManager {
  current(): Promise<ReleaseMetadata>;
  checkForUpdate(channel?: string): Promise<ReleaseMetadata | undefined>;
  catalogs(): Promise<readonly JsonObject[]>;
}
