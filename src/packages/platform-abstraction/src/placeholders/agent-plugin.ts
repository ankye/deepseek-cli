import type { PermissionDiff, PluginId, PluginManager, PluginManifest } from "@deepseek/platform-contracts";

export class InMemoryPluginManager implements PluginManager {
  private readonly plugins = new Map<string, PluginManifest>();

  async install(manifest: PluginManifest): Promise<PermissionDiff> {
    this.plugins.set(manifest.id, manifest);
    return { added: manifest.permissions, removed: [] };
  }

  async uninstall(id: PluginId): Promise<void> {
    this.plugins.delete(id);
  }

  async list(): Promise<readonly PluginManifest[]> {
    return [...this.plugins.values()];
  }
}
