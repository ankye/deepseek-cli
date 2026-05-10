import type { ExtensionManifest, ExtensionManager, JsonObject } from "@deepseek/platform-contracts";

export class InMemoryExtensionManager implements ExtensionManager {
  private readonly manifests = new Map<string, ExtensionManifest>();

  async load(manifest: ExtensionManifest): Promise<void> {
    if (manifest.trust === "untrusted") throw new Error("Untrusted extensions are disabled by default");
    this.manifests.set(manifest.id, manifest);
  }

  async list(): Promise<readonly ExtensionManifest[]> {
    return [...this.manifests.values()];
  }

  async contributions(point: string): Promise<readonly JsonObject[]> {
    return [...this.manifests.values()]
      .map((manifest) => manifest.contributions[point])
      .filter((value): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value));
  }
}
