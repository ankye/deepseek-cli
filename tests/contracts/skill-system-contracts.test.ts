import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SKILL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { InMemorySkillSystem } from "@deepseek/skill-system";

describe("skill system contracts", () => {
  it("emits serializable v1 DTOs for summaries, activation, and context projection", async () => {
    const skills = new InMemorySkillSystem();
    await skills.registerSkill({
      id: asId<"skill">("skill-contract"),
      name: "contract",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["contract"],
      executionModes: ["context"],
      permissions: [],
      metadata: { instructions: ["Use contract-safe output."] }
    });

    const summaries = await skills.listSummaries();
    const activation = await skills.activateSkill({ schemaVersion: SKILL_SCHEMA_VERSION, name: "contract", trigger: "explicit", context: {} });
    const projection = await skills.projectContext({
      schemaVersion: SKILL_SCHEMA_VERSION,
      name: "contract",
      trigger: "explicit",
      sessionId: asId<"session">("session-skill-contract")
    });

    assert.equal(summaries[0]?.schemaVersion, SKILL_SCHEMA_VERSION);
    assert.equal(activation.schemaVersion, SKILL_SCHEMA_VERSION);
    assert.equal(projection.schemaVersion, SKILL_SCHEMA_VERSION);
    assert.equal(projection.nodes[0]?.source, "skill-system");
    assert.equal(JSON.stringify({ summaries, activation, projection }).includes("undefined"), false);
  });

  it("does not expose legacy generic skill APIs", () => {
    const skills = new InMemorySkillSystem() as unknown as Record<string, unknown>;
    assert.equal(skills.register, undefined);
    assert.equal(skills.activate, undefined);
    assert.equal(skills.list, undefined);
  });
});
