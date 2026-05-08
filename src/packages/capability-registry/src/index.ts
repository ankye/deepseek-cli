import type { CapabilityId, CapabilityManifest, CapabilityRegistry, JsonObject, SerializableResult } from "@deepseek/platform-contracts";

export class InMemoryCapabilityRegistry implements CapabilityRegistry {
  private readonly manifests = new Map<string, CapabilityManifest>();
  private readonly executors = new Map<string, (input: JsonObject) => Promise<SerializableResult>>();

  async register(manifest: CapabilityManifest, executor?: (input: JsonObject) => Promise<SerializableResult>): Promise<void> {
    if (this.manifests.has(manifest.id)) throw new Error(`Capability already registered: ${manifest.id}`);
    this.manifests.set(manifest.id, manifest);
    if (executor) this.executors.set(manifest.id, executor);
  }

  async get(id: CapabilityId): Promise<CapabilityManifest | undefined> {
    return this.manifests.get(id);
  }

  async listModelVisible(): Promise<readonly CapabilityManifest[]> {
    return [...this.manifests.values()].filter((manifest) => manifest.enabled && manifest.trust !== "untrusted");
  }

  async execute(id: CapabilityId, input: JsonObject): Promise<SerializableResult> {
    const executor = this.executors.get(id);
    if (!executor) {
      return { ok: false, error: { code: "CAPABILITY_NOT_EXECUTABLE", message: String(id), retryable: false, redaction: { class: "public" } } };
    }
    return executor(input);
  }
}
