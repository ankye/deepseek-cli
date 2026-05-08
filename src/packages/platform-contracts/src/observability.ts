import type { JsonObject } from "./common.js";

export type ObservabilityEventKind = "log" | "metric" | "trace" | "audit" | "usage" | "bus" | "task";

export interface ObservabilityEvent {
  readonly kind: ObservabilityEventKind;
  readonly at: string;
  readonly name: string;
  readonly fields: JsonObject;
}

export interface ObservabilitySink {
  emit(event: ObservabilityEvent): Promise<void>;
  drain(): Promise<readonly ObservabilityEvent[]>;
}
