import type { DistributionUpdateManager, JsonObject, ReleaseMetadata } from "@deepseek/platform-contracts";

const currentRelease: ReleaseMetadata = {
  version: "0.1.0",
  channel: "dev",
  signedMetadata: "development-unsigned",
  compatibility: ["framework-0.1"]
};

export class StaticDistributionUpdateManager implements DistributionUpdateManager {
  async current(): Promise<ReleaseMetadata> {
    return currentRelease;
  }

  async checkForUpdate(): Promise<ReleaseMetadata | undefined> {
    return undefined;
  }

  async catalogs(): Promise<readonly JsonObject[]> {
    return [];
  }
}
