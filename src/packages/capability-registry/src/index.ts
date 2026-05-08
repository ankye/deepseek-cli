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

function cloneJson<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}

function cloneManifest(manifest: CapabilityManifest): CapabilityManifest {
  return deepFreeze(cloneJson(manifest));
}

export class InMemoryCapabilityRegistry implements CapabilityRegistry {
  private readonly manifests = new Map<string, CapabilityManifest>();
  private readonly executors = new Map<string, CapabilityExecutor>();

  async register(manifest: CapabilityManifest, executor?: CapabilityExecutor): Promise<void> {
    const existing = this.manifests.get(manifest.id);
    if (existing && existing.version !== manifest.version) {
      throw new Error(`CAPABILITY_DUPLICATE_INCOMPATIBLE_VERSION: ${manifest.id}`);
    }
    if (existing) throw new Error(`CAPABILITY_DUPLICATE: ${manifest.id}`);
    this.manifests.set(manifest.id, cloneManifest(manifest));
    if (executor) this.executors.set(manifest.id, executor);
  }

  async get(id: CapabilityId): Promise<CapabilityManifest | undefined> {
    const manifest = this.manifests.get(id);
    return manifest ? cloneManifest(manifest) : undefined;
  }

  async listHostVisible(): Promise<readonly CapabilityManifest[]> {
    return [...this.manifests.values()]
      .filter((manifest) => manifest.enabled)
      .map(cloneManifest);
  }

  async listModelVisible(): Promise<readonly CapabilityManifest[]> {
    return [...this.manifests.values()]
      .filter((manifest) => manifest.enabled && manifest.trust !== "untrusted")
      .map(cloneManifest);
  }

  async resolveExecutable(id: CapabilityId): Promise<CapabilityExecutorBinding | undefined> {
    const manifest = this.manifests.get(id);
    const executor = this.executors.get(id);
    if (!manifest || !executor) return undefined;
    return { manifest: cloneManifest(manifest), execute: executor };
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
