import type { JsonValue } from "./common.js";

export interface ConfigProfile {
  readonly name: string;
  readonly values: Readonly<Record<string, JsonValue>>;
}

export interface ConfigStore {
  get<T extends JsonValue = JsonValue>(key: string): Promise<T | undefined>;
  set(key: string, value: JsonValue): Promise<void>;
  profile(): Promise<ConfigProfile>;
}
