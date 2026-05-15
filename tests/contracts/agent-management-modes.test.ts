import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryAgentManager } from "@deepseek/agent-management";
import { AGENT_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import type { AgentDefinition } from "@deepseek/platform-contracts";

function customAgent(overrides: Partial<AgentDefinition> = {}): AgentDefinition {
  const base = {
    schemaVersion: AGENT_SCHEMA_VERSION,
    id: asId<"agent">("agent-custom"),
    name: "custom",
    version: "1.0.0",
    source: "workspace" as const,
    modelProfileId: asId<"modelProfile">("model-custom"),
    promptProfile: "custom-agent",
    productRole: "implementer" as const,
    defaultAgentMode: "implementer" as const,
    supportedAgentModes: ["implementer", "verifier", "worker"] as const,
    scopes: {
      capabilities: ["file.read", "file.write", "search.text", "test.run", "shell.run"],
      context: ["workspace", "session", "artifacts"],
      memory: ["working", "session"],
      policy: ["default"],
      skills: ["trusted"],
      commands: ["file.read", "file.write", "search.text", "test.run", "shell.run"],
      hooks: ["trusted"],
      mcp: ["trusted", "read-only"],
      modelProfiles: ["default"],
      hostCapabilities: ["terminal", "filesystem", "process"]
    },
    delegation: {
      canDelegate: false,
      acceptsDelegation: true,
      allowedChildModes: [],
      requiredWorkOrderFields: ["purpose", "originalUserGoal", "taskSummary"],
      resultRouting: "structured-event" as const
    },
    redaction: { class: "internal" as const },
    compatibility: {
      schemaVersion: AGENT_SCHEMA_VERSION,
      supportedAgentModes: ["implementer", "verifier", "worker"] as const,
      defaultAgentMode: "implementer" as const,
      modeContractVersion: "1.0.0",
      redaction: { class: "internal" as const },
      compatibility: { schemaVersion: AGENT_SCHEMA_VERSION, minReaderVersion: "1.0.0" }
    }
  } satisfies AgentDefinition;
  return { ...base, ...overrides };
}

describe("agent management modes", () => {
  it("rejects unsupported mode selection before instance creation", async () => {
    const manager = new InMemoryAgentManager();
    const definition = customAgent();
    await manager.register(definition);

    await assert.rejects(
      manager.createInstance(definition.id, asId<"session">("session-unsupported-mode"), { mode: "coordinator" }),
      /Unsupported agent mode/
    );
  });

  it("validates scope declarations and delegation metadata", async () => {
    const manager = new InMemoryAgentManager();
    const invalid = customAgent({
      id: asId<"agent">("agent-invalid"),
      scopes: {
        ...customAgent().scopes,
        capabilities: ["file.read", ""]
      },
      delegation: {
        canDelegate: true,
        acceptsDelegation: true,
        allowedChildModes: [],
        requiredWorkOrderFields: [],
        resultRouting: "structured-event"
      }
    });

    const errors = await manager.validateDefinition(invalid);
    assert.equal(errors.some((error) => error.code === "AGENT_SCOPE_INVALID"), true);
    assert.equal(errors.some((error) => error.code === "AGENT_DELEGATION_CHILD_MODES_REQUIRED"), true);
    assert.equal(errors.some((error) => error.code === "AGENT_DELEGATION_WORK_ORDER_FIELDS_REQUIRED"), true);
  });

  it("records delegated lineage and continuation lifecycle", async () => {
    const manager = new InMemoryAgentManager();
    const definition = customAgent();
    await manager.register(definition);

    const instance = await manager.createInstance(definition.id, asId<"session">("session-child"), {
      mode: "worker",
      parentAgentId: asId<"agent">("agent-parent"),
      parentSessionId: asId<"session">("session-parent"),
      childSessionId: asId<"session">("session-child"),
      workOrderId: "work-order:initial",
      delegationDecisionId: "delegation:spawn"
    });
    const continued = await manager.transitionInstance(instance.id, {
      transition: "continue",
      workOrderId: "work-order:follow-up",
      reason: "high-context-overlap"
    });

    assert.equal(instance.parentAgentId, asId<"agent">("agent-parent"));
    assert.equal(instance.workOrderId, "work-order:initial");
    assert.equal(continued.lifecycleState, "continued");
    assert.equal(continued.status, "running");
    assert.equal(continued.workOrderId, "work-order:follow-up");
    assert.equal(continued.lifecycleEvents.at(-1)?.transition, "continue");
    assert.equal(continued.lifecycleEvents.at(-1)?.previousLifecycleState, "spawned");
  });

  it("projects verifier scope toward proof without unrelated write actions", async () => {
    const manager = new InMemoryAgentManager();
    const definition = customAgent();
    await manager.register(definition);

    const verifierScope = await manager.projectScopes(definition.id, "verifier");

    assert.equal(verifierScope.capabilities.includes("test.run"), true);
    assert.equal(verifierScope.capabilities.includes("file.read"), true);
    assert.equal(verifierScope.capabilities.includes("file.write"), false);
    assert.equal(verifierScope.commands.includes("shell.run"), true);
    assert.equal(verifierScope.policy.includes("verification"), true);
  });
});
