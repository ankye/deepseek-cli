import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SKILL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { InMemorySkillSystem } from "@deepseek/skill-system";

describe("skill system matrix", () => {
  it("covers trust, disabled, malformed, summary, activation, and projection modes", async () => {
    const skills = new InMemorySkillSystem();
    const manifests = [
      { id: asId<"skill">("skill-trusted"), name: "trusted", trust: "trusted", enabled: true, expected: "projected" },
      { id: asId<"skill">("skill-untrusted-matrix"), name: "untrusted", trust: "untrusted", enabled: true, expected: "inert" },
      { id: asId<"skill">("skill-disabled-matrix"), name: "disabled", trust: "trusted", enabled: false, expected: "inert" }
    ] as const;

    for (const manifest of manifests) {
      await skills.registerSkill({
        id: manifest.id,
        name: manifest.name,
        version: "1.0.0",
        source: manifest.trust === "untrusted" ? "workspace" : "built-in",
        trust: manifest.trust,
        enabled: manifest.enabled,
        activation: [manifest.name],
        executionModes: ["context"],
        permissions: [],
        metadata: { instructions: [`${manifest.name} instruction`] }
      });
    }

    const malformed = await skills.validateManifest({ name: "bad" } as never);
    assert.equal(malformed.ok, false);
    assert.equal((await skills.listSummaries()).every((summary) => summary.loadingState === "summary-only" || summary.loadingState === "inert"), true);

    for (const manifest of manifests) {
      const projection = await skills.projectContext({
        schemaVersion: SKILL_SCHEMA_VERSION,
        name: manifest.name,
        trigger: "explicit",
        sessionId: asId<"session">(`session-${manifest.name}`)
      });
      assert.equal(projection.status, manifest.expected, manifest.name);
    }
  });
});
