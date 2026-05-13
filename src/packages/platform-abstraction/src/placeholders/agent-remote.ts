import type { RemoteBinding, RemoteRuntimeConnectivity } from "@deepseek/platform-contracts";

export class NoopRemoteRuntimeConnectivity implements RemoteRuntimeConnectivity {
  private readonly bindings = new Map<string, RemoteBinding>();
  private readonly cancellations: { readonly id: string; readonly reason: string }[] = [];

  async bind(binding: RemoteBinding): Promise<void> {
    this.bindings.set(binding.id, binding);
  }

  async reconnect(id: string): Promise<RemoteBinding | undefined> {
    return this.bindings.get(id);
  }

  async cancelRemote(id: string, reason: string): Promise<void> {
    this.cancellations.push({ id, reason });
  }

  cancellationHistory(): readonly { readonly id: string; readonly reason: string }[] {
    return [...this.cancellations];
  }
}
