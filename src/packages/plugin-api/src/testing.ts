import type { JsonObject, PluginManifest } from "@deepseek/platform-contracts";
import {
  action,
  command,
  defineBuiltinPlugin,
  hookContribution,
  keymap,
  mcpConnector,
  paletteEntry,
  rendererHint,
  resourceBundle,
  toolContribution
} from "./builders.js";

export interface PluginFixtureOptions {
  readonly id?: string;
  readonly source?: string;
  readonly integrity?: string;
  readonly permissions?: readonly string[];
  readonly metadata?: JsonObject;
}

export type MalformedPluginFixtureKind =
  | "host-callback"
  | "runtime-handle"
  | "raw-credential"
  | "filesystem-import"
  | "process-import"
  | "network-import"
  | "model-sdk-import"
  | "lifecycle-callback"
  | "undeclared-owner-route";

export function deterministicPluginFixture(options: PluginFixtureOptions = {}): PluginManifest {
  return defineBuiltinPlugin({
    id: options.id ?? "@deepseek/plugin-fixture",
    name: "Deterministic Plugin Fixture",
    version: "0.1.0",
    integrity: options.integrity ?? "sha256:fixture",
    permissions: options.permissions ?? ["workspace:read"],
    commands: [
      command({
        id: "fixture.open",
        name: "Fixture: Open",
        aliases: ["/fixture open"],
        description: "Open fixture target.",
        ownerSubsystem: "command-system",
        commandId: "fixture.open",
        sideEffect: "read",
        permissions: ["workspace:read"],
        group: "fixture",
        order: 10,
        inputSchema: { type: "object" },
        outputSchema: { type: "object" }
      })
    ],
    actions: [action({ id: "fixture.action", permissions: ["workspace:read"], sideEffect: "read" })],
    paletteEntries: [paletteEntry({ id: "fixture.palette", title: "Fixture", category: "fixture", targetKind: "plugin-command" })],
    keymaps: [keymap({ id: "fixture.key", mode: "normal", key: "g f", action: "open", targetKind: "file", namespace: "fixture" })],
    rendererHints: [rendererHint({ id: "fixture.render", host: "cli-tui", placement: "panel" })],
    hooks: [
      hookContribution({
        id: "fixture.activation",
        permissions: [],
        sideEffect: "none",
        metadata: { point: "plugin.activation.after" }
      })
    ],
    tools: [toolContribution({ id: "fixture.tool", permissions: ["workspace:read"], sideEffect: "read" })],
    mcpConnectors: [mcpConnector({ id: "fixture.mcp", permissions: ["network:read"], sideEffect: "network" })],
    resourceBundles: [resourceBundle({ id: "fixture.resources", permissions: [], sideEffect: "none" })],
    ...(options.metadata ? { metadata: options.metadata } : {})
  });
}

export function malformedPluginFixture(kind: MalformedPluginFixtureKind): PluginManifest {
  const manifest = deterministicPluginFixture({ id: `@deepseek/plugin-malformed-${kind}` });
  const malformedByKind: Record<MalformedPluginFixtureKind, JsonObject> = {
    "host-callback": { rendererHints: [{ id: "bad-host", hostCallback: "private" }] },
    "runtime-handle": { commands: [{ id: "bad-runtime", runtimeHandle: "private" }] },
    "raw-credential": { tools: [{ id: "bad-credential", rawCredential: "secret" }] },
    "filesystem-import": { imports: ["node:fs"] },
    "process-import": { imports: ["node:child_process"] },
    "network-import": { imports: ["node:net"] },
    "model-sdk-import": { imports: ["openai"] },
    "lifecycle-callback": { lifecycleCallbacks: { onActivate: "private" } },
    "undeclared-owner-route": { contributionDescriptors: [{ id: "bad-route", kind: "tool", ownerRoute: "private" }] }
  };
  return {
    ...manifest,
    contributions: {
      ...manifest.contributions,
      ...malformedByKind[kind]
    }
  };
}

export function deterministicReplayFingerprint(value: unknown): string {
  return stableStringify(value);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(",")}}`;
}
