import type { RemoteBinding, RemoteRuntimeConnectivity } from "@deepseek/platform-contracts";

export class NoopRemoteRuntimeConnectivity implements RemoteRuntimeConnectivity {
  private readonly bindings = new Map<string, RemoteBinding>();

  async bind(binding: RemoteBinding): Promise<void> {
    this.bindings.set(binding.id, binding);
  }

  async reconnect(id: string): Promise<RemoteBinding | undefined> {
    return this.bindings.get(id);
  }

  async cancelRemote(_id: string, _reason: string): Promise<void> {}
}
