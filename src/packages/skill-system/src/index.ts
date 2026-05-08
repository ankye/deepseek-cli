import type { JsonObject, SkillManifest, SkillSystem } from "@deepseek/platform-contracts";

export class InMemorySkillSystem implements SkillSystem {
  private readonly manifests = new Map<string, SkillManifest>();

  async register(manifest: SkillManifest): Promise<void> {
    this.manifests.set(manifest.id, manifest);
  }

  async activate(name: string, _context: JsonObject): Promise<SkillManifest | undefined> {
    return [...this.manifests.values()].find((manifest) => manifest.name === name && manifest.trust !== "untrusted");
  }

  async list(): Promise<readonly SkillManifest[]> {
    return [...this.manifests.values()];
  }
}
