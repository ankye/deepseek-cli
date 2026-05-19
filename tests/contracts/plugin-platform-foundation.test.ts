import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLUGIN_LIFECYCLE_HOOK_POINTS,
  type PluginContributionDescriptor,
  type PluginContributionKind,
  type PluginLifecycleState,
  type PluginManifest
} from "@deepseek/platform-contracts";
import {
  action,
  agentContribution,
  cacheProvider,
  configFragment,
  contextProvider,
  defineBuiltinPlugin,
  deterministicPluginFixture,
  diagnosticsProvider,
  hookContribution,
  malformedPluginFixture,
  memoryProvider,
  mcpConnector,
  modelProfile,
  resourceBundle,
  skillContribution,
  targetResolver,
  toolContribution,
  workflowTemplate
} from "@deepseek/plugin-api";
import {
  PLUGIN_API_LEVELS,
  PLUGIN_CONTRIBUTION_KINDS,
  PLUGIN_LIFECYCLE_STATES,
  createPluginAuditRecord,
  createPluginHealthRecord,
  createPluginLifecycleEvent,
  createPluginLifecycleStatePath,
  createPluginLifecycleTransition,
  createPluginRollbackRecord,
  detectPluginContributionConflicts,
  normalizePluginHookContribution,
  pluginContributionCatalog,
  projectPluginDiagnosticSurfaces,
  projectPluginInspector,
  resolvePluginDependencyGraph,
  validatePluginManifestMetadata
} from "@deepseek/plugin-system";

describe("complete plugin platform foundation", () => {
  it("covers the complete lifecycle matrix with deterministic fingerprints", () => {
    const manifest = deterministicPluginFixture();
    const path = createPluginLifecycleStatePath(manifest, { includeHealthCheck: true, includeUpdateAndRollback: true });
    const quarantine = createPluginLifecycleTransition({
      manifest,
      previousState: "validated",
      nextState: "quarantined",
      trigger: "quarantine",
      actor: "test",
      reason: "validation policy failed"
    });
    const coveredStates = new Set<PluginLifecycleState>([
      ...path.flatMap((transition) => [transition.previousState, transition.nextState].filter(Boolean) as PluginLifecycleState[]),
      quarantine.nextState
    ]);

    assert.deepEqual([...coveredStates].sort(), [...PLUGIN_LIFECYCLE_STATES].sort());
    assert.equal(new Set(path.map((transition) => transition.replayFingerprint)).size, path.length);
    assert.equal(path[0]?.replayFingerprint, createPluginLifecycleStatePath(manifest, { includeHealthCheck: true, includeUpdateAndRollback: true })[0]?.replayFingerprint);

    const event = createPluginLifecycleEvent({ kind: "plugin.lifecycle", transition: quarantine });
    const audit = createPluginAuditRecord({ transition: quarantine, action: "quarantine" });
    assert.equal(event.lifecycle?.nextState, "quarantined");
    assert.equal(audit.lifecycleState, "quarantined");
  });

  it("exposes every API level and contribution kind in the platform catalog", () => {
    const catalog = pluginContributionCatalog();
    const kinds = catalog.entries.map((entry) => entry.kind).sort();

    assert.deepEqual(kinds, [...PLUGIN_CONTRIBUTION_KINDS].sort());
    assert.deepEqual([...PLUGIN_API_LEVELS].sort(), ["declarative-author", "governed-runtime", "host-projection", "manifest", "test-harness"].sort());
    assert.equal(catalog.entries.every((entry) => entry.defaultProjection.hostOwnsLayout), true);
    assert.equal(catalog.entries.some((entry) => entry.kind === "mcp-connector" && entry.status === "inactive"), true);
    assert.equal(catalog.entries.some((entry) => entry.kind === "resource-bundle" && entry.status === "inactive"), true);
  });

  it("builds descriptors for the full declarative author catalog", () => {
    const fullCatalogDescriptors = [
      action({ id: "fixture.action", permissions: [], sideEffect: "none" }),
      targetResolver({ id: "fixture.target", permissions: ["workspace:read"], sideEffect: "read" }),
      hookContribution({ id: "fixture.hook", permissions: [], sideEffect: "none", metadata: { point: "plugin.activation.after" } }),
      skillContribution({ id: "fixture.skill", permissions: [], sideEffect: "read" }),
      toolContribution({ id: "fixture.tool", permissions: ["workspace:read"], sideEffect: "read" }),
      mcpConnector({ id: "fixture.mcp", permissions: ["network:read"], sideEffect: "network" }),
      agentContribution({ id: "fixture.agent", permissions: [], sideEffect: "mixed" }),
      contextProvider({ id: "fixture.context", permissions: ["workspace:read"], sideEffect: "read" }),
      memoryProvider({ id: "fixture.memory", permissions: ["memory:read"], sideEffect: "read" }),
      cacheProvider({ id: "fixture.cache", permissions: ["cache:read"], sideEffect: "read" }),
      workflowTemplate({ id: "fixture.workflow", permissions: [], sideEffect: "none" }),
      modelProfile({ id: "fixture.model", permissions: [], sideEffect: "model" }),
      configFragment({ id: "fixture.config", permissions: [], sideEffect: "none" }),
      diagnosticsProvider({ id: "fixture.diagnostics", permissions: [], sideEffect: "read" }),
      resourceBundle({ id: "fixture.resources", permissions: [], sideEffect: "none" })
    ];
    const manifest = defineBuiltinPlugin({
      id: "@deepseek/plugin-full-catalog",
      name: "Full Catalog",
      version: "0.1.0",
      integrity: "sha256:full-catalog",
      permissions: [],
      actions: fullCatalogDescriptors.filter((item) => item.kind === "action"),
      targetResolvers: fullCatalogDescriptors.filter((item) => item.kind === "target-resolver"),
      hooks: fullCatalogDescriptors.filter((item) => item.kind === "hook"),
      skills: fullCatalogDescriptors.filter((item) => item.kind === "skill"),
      tools: fullCatalogDescriptors.filter((item) => item.kind === "tool"),
      mcpConnectors: fullCatalogDescriptors.filter((item) => item.kind === "mcp-connector"),
      agents: fullCatalogDescriptors.filter((item) => item.kind === "agent"),
      contextProviders: fullCatalogDescriptors.filter((item) => item.kind === "context-provider"),
      memoryProviders: fullCatalogDescriptors.filter((item) => item.kind === "memory-provider"),
      cacheProviders: fullCatalogDescriptors.filter((item) => item.kind === "cache-provider"),
      workflowTemplates: fullCatalogDescriptors.filter((item) => item.kind === "workflow-template"),
      modelProfiles: fullCatalogDescriptors.filter((item) => item.kind === "model-profile"),
      configFragments: fullCatalogDescriptors.filter((item) => item.kind === "config-fragment"),
      diagnosticsProviders: fullCatalogDescriptors.filter((item) => item.kind === "diagnostics-provider"),
      resourceBundles: fullCatalogDescriptors.filter((item) => item.kind === "resource-bundle")
    });
    const descriptors = manifest.contributions.contributionDescriptors as unknown as readonly PluginContributionDescriptor[];
    const descriptorKinds = new Set<PluginContributionKind>(descriptors.map((item) => item.kind));

    for (const kind of [
      "action",
      "target-resolver",
      "hook",
      "skill",
      "tool",
      "mcp-connector",
      "agent",
      "context-provider",
      "memory-provider",
      "cache-provider",
      "workflow-template",
      "model-profile",
      "config-fragment",
      "diagnostics-provider",
      "resource-bundle"
    ] as const) {
      assert.equal(descriptorKinds.has(kind), true, kind);
    }
    assert.equal(manifest.apiLevels?.some((level) => level.level === "manifest"), true);
    assert.equal(manifest.apiLevels?.some((level) => level.level === "declarative-author"), true);
  });

  it("rejects forbidden private APIs before activation or projection", () => {
    for (const kind of [
      "host-callback",
      "runtime-handle",
      "raw-credential",
      "filesystem-import",
      "process-import",
      "network-import",
      "model-sdk-import",
      "lifecycle-callback",
      "undeclared-owner-route"
    ] as const) {
      const validation = validatePluginManifestMetadata([malformedPluginFixture(kind)], { requiredSource: "built-in", requireSha256Integrity: true });
      assert.equal(validation.ok, false, kind);
      assert.equal(validation.errors.some((error) => error.code === "PLUGIN_FORBIDDEN_API_REJECTED"), true, kind);
    }
  });

  it("resolves dependencies, reports conflicts, and keeps projection inert", () => {
    let executed = 0;
    const first = deterministicPluginFixture({ id: "@deepseek/plugin-conflict-a" });
    const second = {
      ...deterministicPluginFixture({ id: "@deepseek/plugin-conflict-b" }),
      dependencies: [{ pluginId: first.id, versionRange: "^0.1.0" }],
      optionalDependencies: [{ pluginId: "@deepseek/plugin-missing-optional" as PluginManifest["id"], versionRange: "^0.1.0" }],
      contributions: {
          ...deterministicPluginFixture({ id: "@deepseek/plugin-conflict-b" }).contributions,
          commands: [{ id: "bad-private", execute: () => { executed += 1; } }]
        }
    } as unknown as PluginManifest;
    const dependencyResolution = resolvePluginDependencyGraph([second, first]);
    const conflicts = detectPluginContributionConflicts([first, second]);
    const health = createPluginHealthRecord(second, "degraded");
    const rollback = createPluginRollbackRecord({ manifest: second, fromVersion: "0.2.0", toVersion: "0.1.0", reason: "test rollback" });
    const projection = projectPluginInspector(second, { lifecycleState: "validated", conflicts, health });
    const surfaces = projectPluginDiagnosticSurfaces([projection]);

    assert.equal(dependencyResolution.status, "degraded");
    assert.deepEqual(dependencyResolution.activationOrder, [first.id, second.id]);
    assert.equal(conflicts.some((conflict) => conflict.conflictKind === "command-id"), true);
    assert.equal(health.status, "degraded");
    assert.equal(rollback.toVersion, "0.1.0");
    assert.equal(projection.lifecycleState, "validated");
    assert.equal(projection.conflicts.length > 0, true);
    assert.equal(surfaces.cliText.includes("@deepseek/plugin-conflict-b"), true);
    assert.equal(surfaces.jsonl.includes("\"lifecycleState\":\"validated\""), true);
    assert.equal(executed, 0);
  });

  it("normalizes plugin lifecycle hooks into canonical hook manifests", () => {
    const manifest = deterministicPluginFixture();
    const descriptor = (manifest.contributions.contributionDescriptors as unknown as readonly PluginContributionDescriptor[])
      .find((item) => item.kind === "hook");

    assert.ok(descriptor);
    const hook = normalizePluginHookContribution(manifest, descriptor);
    assert.equal(PLUGIN_LIFECYCLE_HOOK_POINTS.includes(hook.point as (typeof PLUGIN_LIFECYCLE_HOOK_POINTS)[number]), true);
    assert.equal(hook.source, "plugin");
    assert.equal(hook.metadata?.pluginId, manifest.id);
  });
});
