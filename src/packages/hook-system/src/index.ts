import type { HookManifest, HookSystem, JsonObject, SerializableResult } from "@deepseek/platform-contracts";

export class InMemoryHookSystem implements HookSystem {
  private readonly manifests: HookManifest[] = [];
  private readonly handlers = new Map<string, (input: JsonObject) => Promise<SerializableResult>>();

  async register(manifest: HookManifest, handler?: (input: JsonObject) => Promise<SerializableResult>): Promise<void> {
    this.manifests.push(manifest);
    if (handler) this.handlers.set(manifest.id, handler);
  }

  async run(point: string, input: JsonObject): Promise<readonly SerializableResult[]> {
    const hooks = this.manifests.filter((manifest) => manifest.point === point).sort((a, b) => a.order - b.order);
    const results: SerializableResult[] = [];
    for (const hook of hooks) {
      const handler = this.handlers.get(hook.id);
      if (handler) results.push(await handler(input));
    }
    return results;
  }
}
