import type { JsonObject } from "@deepseek/plugin-api";
import { COMMAND_COMPOSITION_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export const outputSchema = {
  type: "object",
  required: ["schemaVersion", "status", "diagnostics", "redaction"],
  properties: {
    schemaVersion: { const: COMMAND_COMPOSITION_SCHEMA_VERSION },
    status: { type: "string" },
    diagnostics: { type: "array" },
    redaction: { type: "object" }
  }
} as const satisfies JsonObject;

export const emptyInputSchema = { type: "object", additionalProperties: false } as const satisfies JsonObject;

export const queryInputSchema = {
  type: "object",
  properties: { query: { type: "string", minLength: 1 }, limit: { type: "number" } },
  required: ["query"],
  additionalProperties: false
} as const satisfies JsonObject;

export const contextTargetInputSchema = {
  type: "object",
  properties: { target: { type: "string", minLength: 1 }, limit: { type: "number" } },
  required: ["target"],
  additionalProperties: false
} as const satisfies JsonObject;
