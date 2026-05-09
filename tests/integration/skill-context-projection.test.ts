import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, SKILL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createProjectionRequest } from "@deepseek/context-engine";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("skill context projection integration", () => {
  it("feeds trusted skill context nodes into the context engine", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const sessionId = asId<"session">("session-skill-context");
    await deps.skills.registerSkill({
      id: asId<"skill">("skill-review-context"),
      name: "review-context",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["review"],
      executionModes: ["context"],
      permissions: [],
      metadata: { instructions: ["Review code paths and tests together."] }
    });

    const skillProjection = await deps.skills.projectContext({
      schemaVersion: SKILL_SCHEMA_VERSION,
      name: "review-context",
      trigger: "context-relevance",
      sessionId
    });
    const contextProjection = await deps.context.projectGraph({
      ...createProjectionRequest({ sessionId, prompt: "review this change", hardLimitTokens: 64 }),
      schemaVersion: CONTEXT_PROJECTION_SCHEMA_VERSION,
      candidateNodes: skillProjection.nodes
    });

    assert.equal(skillProjection.status, "projected");
    assert.equal(contextProjection.selectedNodes.some((node) => node.source === "skill-system"), true);
  });
});
