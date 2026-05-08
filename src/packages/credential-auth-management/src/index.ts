import type { CredentialManager, CredentialRecord, CredentialRef } from "@deepseek/platform-contracts";

export type DeepSeekCredentialEnv = Readonly<Record<"DEEPSEEK_API_KEY" | "DEEPSEEK_TOKEN", string | undefined>>;

export function createDeepSeekCredentialPresenceEnv(env: Readonly<Record<string, string | undefined>> = process.env): DeepSeekCredentialEnv {
  return {
    DEEPSEEK_API_KEY: hasValue(env.DEEPSEEK_API_KEY) ? "present" : undefined,
    DEEPSEEK_TOKEN: hasValue(env.DEEPSEEK_TOKEN) ? "present" : undefined
  };
}

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

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
