import type {
  CapabilityExecutionContext,
  CapabilityExecutor,
  CapabilityExecutorBinding,
  CapabilityId,
  CapabilityManifest,
  CapabilityRegistry,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";

export class InMemoryCapabilityRegistry implements CapabilityRegistry {
  private readonly manifests = new Map<string, CapabilityManifest>();
  private readonly executors = new Map<string, CapabilityExecutor>();

  async register(manifest: CapabilityManifest, executor?: CapabilityExecutor): Promise<void> {
    const existing = this.manifests.get(manifest.id);
    if (existing && existing.version !== manifest.version) {
      throw new Error(`CAPABILITY_DUPLICATE_INCOMPATIBLE_VERSION: ${manifest.id}`);
    }
    if (existing) throw new Error(`CAPABILITY_DUPLICATE: ${manifest.id}`);
    this.manifests.set(manifest.id, manifest);
    if (executor) this.executors.set(manifest.id, executor);
  }

  async get(id: CapabilityId): Promise<CapabilityManifest | undefined> {
    return this.manifests.get(id);
  }

  async listHostVisible(): Promise<readonly CapabilityManifest[]> {
    return [...this.manifests.values()]
      .filter((manifest) => manifest.enabled)
      .map((manifest) => ({ ...manifest }));
  }

  async listModelVisible(): Promise<readonly CapabilityManifest[]> {
    return [...this.manifests.values()].filter((manifest) => manifest.enabled && manifest.trust !== "untrusted");
  }

  async resolveExecutable(id: CapabilityId): Promise<CapabilityExecutorBinding | undefined> {
    const manifest = this.manifests.get(id);
    const executor = this.executors.get(id);
    if (!manifest || !executor) return undefined;
    return { manifest, execute: executor };
  }

  async execute(id: CapabilityId, input: JsonObject, context?: CapabilityExecutionContext): Promise<SerializableResult> {
    const binding = await this.resolveExecutable(id);
    const executor = binding?.execute;
    if (!executor) {
      return { ok: false, error: { code: "CAPABILITY_NOT_EXECUTABLE", message: String(id), retryable: false, redaction: { class: "public" } } };
    }
    if (!context) {
      return {
        ok: false,
        error: {
          code: "CAPABILITY_CONTEXT_REQUIRED",
          message: String(id),
          retryable: false,
          redaction: { class: "public" }
        }
      };
    }
    return executor(input, context);
  }
}
