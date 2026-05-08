import type { CredentialManager, CredentialRecord, CredentialRef } from "@deepseek/platform-contracts";

export class FakeCredentialManager implements CredentialManager {
  private readonly records = new Map<string, CredentialRecord>();

  async resolve(ref: CredentialRef): Promise<CredentialRecord | undefined> {
    return this.records.get(ref);
  }

  async put(record: CredentialRecord): Promise<void> {
    this.records.set(record.ref, record);
  }

  redact(value: string): string {
    return value.length <= 4 ? "****" : `${value.slice(0, 2)}****${value.slice(-2)}`;
  }
}
