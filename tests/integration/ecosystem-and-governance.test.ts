import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOOK_SCHEMA_VERSION, MCP_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createHookOutput } from "@deepseek/hook-system";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { createPlatformRuntime, FakePlatformRuntime } from "@deepseek/platform-abstraction";

describe("ecosystem and governance integration", () => {
  it("validates capabilities, commands, skills, hooks, MCP, plugins, extensions, and evolution controls", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.capabilities.register(
      {
        id: asId<"capability">("capability-read"),
        name: "read",
        source: "built-in",
        version: "1.0.0",
        trust: "trusted",
        sideEffect: "read",
        permissions: ["workspace:read"],
        inputSchema: {},
        outputSchema: {},
        enabled: true
      },
      async () => ({ ok: true, value: { result: "ok" } })
    );
    assert.equal((await deps.capabilities.listModelVisible()).length, 1);

    await deps.commands.register(
      {
        id: asId<"command">("command-help"),
        name: "help",
        aliases: ["?"],
        modes: ["user", "host"],
        hostSupport: ["cli", "vscode"],
        sideEffect: "none",
        inputSchema: {}
      },
      async () => ({ ok: true, value: { text: "help" } })
    );
    assert.equal((await deps.commands.invoke("?", {})).ok, true);

    await deps.skills.registerSkill({
      id: asId<"skill">("skill-review"),
      name: "review",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["review"],
      executionModes: ["context"],
      permissions: []
    });
    assert.equal((await deps.skills.activateSkill({ schemaVersion: "1.0.0", name: "review", trigger: "explicit", context: {} })).summary?.name, "review");

    await deps.hooks.registerHook(
      {
        id: asId<"hook">("hook-before-turn"),
        name: "before-turn",
        version: "1.0.0",
        point: "user-input.before",
        source: "built-in",
        trust: "trusted",
        ordering: { priority: 1 },
        timeoutMs: 100,
        failurePolicy: "block",
        isolation: "in-process-observe-only",
        permissions: [],
        inputSchema: {},
        outputSchema: {}
      },
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-before-turn"), "observation", { checked: true }) })
    );
    assert.equal((await deps.hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} })).executions.length, 1);

    await deps.mcp.connectServer({
      schemaVersion: MCP_SCHEMA_VERSION,
      id: asId<"mcpServer">("mcp-fake"),
      name: "fake",
      version: "1.0.0",
      source: "built-in",
      transport: { kind: "fake" },
      namespace: "fake",
      trust: "trusted",
      permissions: ["mcp:tool"],
      timeoutMs: 100,
      tools: [{ name: "fake.tool", inputSchema: {}, permissions: ["mcp:tool"] }]
    });
    assert.equal((await deps.mcp.listTools({ schemaVersion: MCP_SCHEMA_VERSION, namespace: "fake" })).length, 1);

    const installResult = await deps.plugins.install({
      id: asId<"plugin">("plugin-one"),
      name: "one",
      version: "1.0.0",
      source: "workspace",
      integrity: "sha256-dev",
      permissions: ["capability:read"],
      contributions: { commands: ["help"] }
    });
    assert.deepEqual(installResult.diff.added, ["capability:read"]);
    assert.equal(installResult.lockEntry.pluginId, "plugin-one");

    await deps.extensions.load({
      id: asId<"extension">("extension-one"),
      name: "one",
      version: "1.0.0",
      source: "workspace",
      integrity: "sha256-dev",
      trust: "trusted",
      activation: ["onStartup"],
      permissions: [],
      contributions: { workflowTemplates: { name: "single-turn" } }
    });
    assert.equal((await deps.extensions.contributions("workflowTemplates")).length, 1);

    await deps.evolution.setGate({ name: "future.mode", enabled: true, owner: "platform" });
    assert.equal(await deps.evolution.isEnabled("future.mode"), true);
  });

  it("covers policy, sandbox, workspace, platform fallback, memory/cache, credentials, and code intelligence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    assert.equal((await deps.policy.decide({ subject: "user", action: "read", resource: "workspace", metadata: {} })).action, "allow");
    assert.equal((await deps.policy.decide({ subject: "user", action: "delete", resource: "workspace", metadata: {} })).action, "ask");

    const sandboxEvents = [];
    for await (const event of deps.sandbox.run({ command: "echo", args: ["ok"], controls: ["no-network"] })) {
      sandboxEvents.push(event);
    }
    assert.equal(sandboxEvents[0]?.mode, "development");

    const workspace = await deps.workspaceState.identify(["."]);
    assert.equal(workspace.trusted, true);

    const platform = createPlatformRuntime("fake") as FakePlatformRuntime;
    assert.equal((await platform.runProcess("echo", ["ok"])).exitCode, 0);

    await deps.memory.put({
      id: asId<"memory">("memory-1"),
      scope: "session",
      content: "fact",
      provenance: { source: "test" },
      redaction: { class: "internal" },
      confidence: 1
    });
    assert.equal((await deps.memory.query("session")).length, 1);

    await deps.cache.set({
      key: asId<"cacheKey">("cache-1"),
      namespace: "token-counts",
      value: 1,
      createdAt: new Date(0).toISOString(),
      invalidation: ["manual"]
    });
    assert.equal((await deps.cache.invalidate("token-counts", "test")), 1);

    await deps.credentials.put({
      ref: asId<"credentialRef">("credential-1"),
      scope: "test",
      redaction: { class: "secret" },
      audit: { source: "fake" }
    });
    assert.equal(deps.credentials.redact("abcdef"), "ab****ef");

    assert.equal((await deps.codeIntelligence.diagnostics(".")).length, 0);
  });
});
