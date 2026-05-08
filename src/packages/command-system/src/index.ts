import type { CommandManifest, CommandSystem, JsonObject, SerializableResult } from "@deepseek/platform-contracts";

export class InMemoryCommandSystem implements CommandSystem {
  private readonly manifests = new Map<string, CommandManifest>();
  private readonly aliases = new Map<string, string>();
  private readonly handlers = new Map<string, (input: JsonObject) => Promise<SerializableResult>>();

  async register(manifest: CommandManifest, handler?: (input: JsonObject) => Promise<SerializableResult>): Promise<void> {
    this.manifests.set(manifest.id, manifest);
    this.aliases.set(manifest.name, manifest.id);
    for (const alias of manifest.aliases) this.aliases.set(alias, manifest.id);
    if (handler) this.handlers.set(manifest.id, handler);
  }

  async invoke(nameOrAlias: string, input: JsonObject): Promise<SerializableResult> {
    const id = this.aliases.get(nameOrAlias);
    const handler = id ? this.handlers.get(id) : undefined;
    if (!handler) {
      return { ok: false, error: { code: "COMMAND_NOT_FOUND", message: nameOrAlias, retryable: false, redaction: { class: "public" } } };
    }
    return handler(input);
  }

  async help(): Promise<readonly CommandManifest[]> {
    return [...this.manifests.values()];
  }
}
