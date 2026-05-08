import type { ConfigProfile, ConfigStore, JsonValue } from "@deepseek/platform-contracts";

export class InMemoryConfigStore implements ConfigStore {
  private readonly values = new Map<string, JsonValue>();

  async get<T extends JsonValue = JsonValue>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async set(key: string, value: JsonValue): Promise<void> {
    this.values.set(key, value);
  }

  async profile(): Promise<ConfigProfile> {
    return {
      name: "default",
      values: Object.fromEntries(this.values)
    };
  }
}
