import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { asId } from "@deepseek/platform-contracts";
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

    await deps.hooks.register(
      {
        id: asId<"hook">("hook-before-turn"),
        name: "before-turn",
        point: "turn.before",
        order: 1,
        timeoutMs: 100,
        failurePolicy: "fail"
      },
      async () => ({ ok: true, value: { checked: true } })
    );
    assert.equal((await deps.hooks.run("turn.before", {})).length, 1);

    await deps.mcp.connect({
      id: asId<"mcpServer">("mcp-fake"),
      name: "fake",
      transport: "fake",
      namespace: "fake",
      trust: "trusted",
      timeoutMs: 100
    });
    assert.equal((await deps.mcp.listTools("fake")).length, 1);

    const diff = await deps.plugins.install({
      id: asId<"plugin">("plugin-one"),
      name: "one",
      version: "1.0.0",
      source: "workspace",
      integrity: "sha256-dev",
      permissions: ["capability:read"],
      contributions: { commands: ["help"] }
    });
    assert.deepEqual(diff.added, ["capability:read"]);

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
