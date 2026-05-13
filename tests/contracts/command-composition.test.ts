import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  CommandCompositionContribution,
  HookSummary,
  McpPromptSummary,
  McpToolSummary,
  PluginManifest,
  SkillSummary
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import {
  commandManifestToCompositionRecord,
  createCommandCompositionRegistry,
  extensionContributionToCompositionRecord,
  hookSummaryToCompositionRecord,
  mcpPromptSummaryToCompositionRecord,
  mcpToolSummaryToCompositionRecord,
  pluginCommandContributionToCompositionRecords,
  projectModelVisible,
  projectUserVisible,
  rendererHintToCompositionRecord,
  skillSummaryToCompositionRecord,
  workflowSuggestionToCompositionRecord
} from "@deepseek/command-system";

describe("command composition contracts", () => {
  it("projects command manifests as inert records without invoking handlers", async () => {
    let invoked = 0;
    const registry = createCommandCompositionRegistry();
    registry.registerCommandManifest({
      id: asId<"command">("command.echo"),
      name: "echo",
      aliases: ["say"],
      modes: ["user", "host", "model"],
      hostSupport: ["cli"],
      sideEffect: "read",
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      source: { kind: "built-in", id: "test", trust: "trusted" },
      projection: { userVisible: true, hostVisible: true, modelVisible: true, resultListVisible: true, group: "test" }
    });
    const handler = async (): Promise<never> => {
      invoked += 1;
      throw new Error("projection executed handler");
    };
    void handler;

    const model = registry.project("model-visible");

    assert.equal(invoked, 0);
    assert.equal(model.ok, true);
    assert.equal(model.records[0]?.target.id, "command:command.echo");
    assert.equal(model.records[0]?.displayName, "echo");
  });

  it("rejects duplicate aliases and ignores disabled duplicates", () => {
    const one = commandContribution("one", "shared");
    const two = commandContribution("two", "shared");
    const collision = projectUserVisible([one, two]);

    assert.equal(collision.ok, false);
    assert.equal(collision.records.length, 0);
    assert.equal(collision.diagnostics.some((diagnostic) => diagnostic.code === "COMPOSITION_ALIAS_COLLISION" && diagnostic.targetIds.includes("command:one") && diagnostic.targetIds.includes("command:two")), true);

    const disabled = { ...two, projection: { ...two.projection, disabled: true } };
    const withoutDisabled = projectUserVisible([one, disabled]);
    assert.equal(withoutDisabled.ok, true);
    assert.deepEqual(withoutDisabled.records.map((record) => record.target.id), ["command:one"]);
  });

  it("sorts user-visible records by group, trust, source kind, display name, and target id", () => {
    const records = [
      commandContribution("zeta", "z", { group: "b", sourceKind: "plugin", trust: "workspace" }),
      commandContribution("alpha", "a", { group: "a", sourceKind: "plugin", trust: "workspace" }),
      commandContribution("core", "c", { group: "a", sourceKind: "built-in", trust: "trusted" })
    ];

    const projected = projectUserVisible(records);

    assert.equal(projected.ok, true);
    assert.deepEqual(projected.records.map((record) => record.displayName), ["core", "alpha", "zeta"]);
  });

  it("fails closed for unsafe model-visible records", () => {
    const unsafe = commandContribution("unsafe", "unsafe", {
      sourceKind: "plugin",
      trust: "untrusted",
      sideEffect: "write",
      modelVisible: true,
      outputSchema: { type: "object" }
    });
    const missingSchema = commandContribution("missing-schema", "missing", {
      modelVisible: true
    });
    const safe = commandContribution("safe", "safe", {
      sideEffect: "read",
      modelVisible: true,
      outputSchema: { type: "object" }
    });

    const projected = projectModelVisible([unsafe, missingSchema, safe]);

    assert.equal(projected.ok, true);
    assert.deepEqual(projected.records.map((record) => record.target.id), ["command:safe"]);
    assert.equal(projected.diagnostics.filter((diagnostic) => diagnostic.code === "COMPOSITION_MODEL_VISIBILITY_REJECTED").length, 2);
  });

  it("normalizes skills, hooks, MCP, plugin commands, extensions, workflows, and renderer hints with pit metadata", () => {
    const skill = skillSummaryToCompositionRecord(skillSummary());
    const hook = hookSummaryToCompositionRecord(hookSummary());
    const prompt = mcpPromptSummaryToCompositionRecord(mcpPromptSummary());
    const tool = mcpToolSummaryToCompositionRecord(mcpToolSummary());
    const plugin = pluginCommandContributionToCompositionRecords(pluginManifest())[0]!;
    const extension = extensionContributionToCompositionRecord(extensionContribution());
    const workflow = workflowSuggestionToCompositionRecord({ id: "repair", displayName: "repair workflow" });
    const renderer = rendererHintToCompositionRecord({ id: "diff", displayName: "diff renderer" });

    assert.equal(skill.target.id, "skill:planner");
    assert.equal(skill.provenance.loadingState, "summary-only");
    assert.equal(skill.outputSchema, undefined);
    assert.equal(hook.target.id, "hook:hook.before");
    assert.equal(hook.provenance.failurePolicy, "continue");
    assert.equal(prompt.target.id, "mcp-prompt:docs.search");
    assert.equal(tool.target.id, "mcp-tool:docs.lookup");
    assert.equal(plugin.referencePitFixtureIds.includes("pit.extension-permission-expansion.permission-diff"), true);
    assert.equal(extension.referencePitFixtureIds.includes("pit.legacy-contribution-normalization.manifest-boundary"), true);
    assert.equal(workflow.target.id, "workflow:repair");
    assert.equal(renderer.projection.hostOnly, true);

    const serialized = JSON.stringify([skill, hook, prompt, tool, plugin, extension, workflow, renderer]);
    assert.equal(serialized.includes("pit.legacy-contribution-normalization.manifest-boundary"), true);
    assert.equal(serialized.includes("pit.mcp-plugin-precedence.enterprise-deny"), true);
    assert.equal(serialized.includes("pit.extension-permission-expansion.permission-diff"), true);
  });
});

function commandContribution(
  id: string,
  alias: string,
  options: {
    readonly group?: string;
    readonly sourceKind?: string;
    readonly trust?: "trusted" | "workspace" | "untrusted" | "quarantined";
    readonly sideEffect?: string;
    readonly modelVisible?: boolean;
    readonly outputSchema?: { readonly type: string };
  } = {}
) {
  return commandManifestToCompositionRecord({
    id: asId<"command">(id),
    name: id,
    aliases: [alias],
    modes: ["user", "host", ...(options.modelVisible ? ["model" as const] : [])],
    hostSupport: ["cli"],
    sideEffect: options.sideEffect ?? "none",
    inputSchema: { type: "object" },
    ...(options.outputSchema ? { outputSchema: options.outputSchema } : {}),
    source: { kind: options.sourceKind ?? "built-in", id: "test", trust: options.trust ?? "trusted" },
    projection: { userVisible: true, hostVisible: true, modelVisible: options.modelVisible === true, resultListVisible: true, group: options.group ?? "test" }
  });
}

function skillSummary(): SkillSummary {
  return {
    schemaVersion: "1.0.0",
    id: asId<"skill">("skill.planner"),
    name: "planner",
    version: "1.0.0",
    source: "built-in",
    trust: "trusted",
    enabled: true,
    description: "Plan work.",
    activation: ["plan"],
    executionModes: ["context"],
    permissions: [],
    loadingState: "summary-only",
    compatibility: { schemaVersion: "1.0.0" },
    redaction: { class: "internal" }
  };
}

function hookSummary(): HookSummary {
  return {
    schemaVersion: "1.0.0",
    id: asId<"hook">("hook.before"),
    name: "before",
    version: "1.0.0",
    point: "user-input.before",
    source: "plugin",
    trust: "workspace",
    enabled: true,
    ordering: { priority: 10 },
    timeoutMs: 1000,
    failurePolicy: "continue",
    isolation: "in-process-observe-only",
    permissions: [],
    compatibility: { schemaVersion: "1.0.0" },
    redaction: { class: "internal" }
  };
}

function mcpPromptSummary(): McpPromptSummary {
  return {
    schemaVersion: "1.0.0",
    serverId: asId<"mcpServer">("mcp.docs"),
    namespace: "docs",
    name: "search",
    qualifiedName: "docs.search",
    description: "Search docs.",
    argumentsSchema: { type: "object" },
    trust: "workspace",
    redaction: { class: "internal" },
    provenance: { server: "docs" },
    compatibility: { schemaVersion: "1.0.0" }
  };
}

function mcpToolSummary(): McpToolSummary {
  return {
    schemaVersion: "1.0.0",
    serverId: asId<"mcpServer">("mcp.docs"),
    namespace: "docs",
    name: "lookup",
    qualifiedName: "docs.lookup",
    description: "Lookup docs.",
    transport: { kind: "stdio", command: "docs" },
    trust: "workspace",
    permissions: ["network:docs"],
    timeoutMs: 1000,
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    redaction: { class: "internal" },
    provenance: { server: "docs" },
    compatibility: { schemaVersion: "1.0.0" }
  };
}

function pluginManifest(): PluginManifest {
  return {
    id: asId<"plugin">("plugin.docs"),
    name: "docs",
    version: "1.0.0",
    source: "workspace",
    integrity: "sha256:docs",
    permissions: ["workspace:read"],
    contributions: {
      commands: [
        {
          id: "open-docs",
          name: "open-docs",
          aliases: ["docs"],
          permissions: ["workspace:read", "network:docs"],
          baselinePermissions: ["workspace:read"],
          sideEffect: "network"
        }
      ]
    }
  };
}

function extensionContribution(): CommandCompositionContribution {
  return {
    kind: "extension-command",
    ownerSubsystem: "extension-system",
    source: { kind: "extension", id: "ext.docs", trust: "workspace" },
    target: { kind: "extension-command", id: "extension-command:ext.docs.open" },
    displayName: "ext-open",
    aliases: ["ext"],
    permissions: ["workspace:read"],
    sideEffect: "read",
    projection: { userVisible: true, hostVisible: true, modelVisible: false, resultListVisible: true }
  };
}
