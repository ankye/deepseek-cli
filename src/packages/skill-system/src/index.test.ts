import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SKILL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { InMemorySkillSystem } from "./index.js";

const secret = "sk-skill-1234567890";

describe("skill system v1", () => {
  it("validates, registers, summarizes, and progressively loads trusted skills", async () => {
    const skills = new InMemorySkillSystem();
    const summary = await skills.registerSkill({
      schemaVersion: SKILL_SCHEMA_VERSION,
      id: asId<"skill">("skill-review"),
      name: "review",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["review"],
      executionModes: ["context"],
      permissions: [],
      description: "Review guidance",
      metadata: {
        instructions: ["Review diffs with tests first."],
        examples: ["Prefer small patches."]
      }
    });

    assert.equal(summary.loadingState, "summary-only");
    assert.equal((await skills.listSummaries())[0]?.loadingState, "summary-only");
    const activated = await skills.activateSkill({ schemaVersion: SKILL_SCHEMA_VERSION, name: "review", trigger: "explicit", context: {} });
    assert.equal(activated.status, "activated");
    assert.equal(activated.contentLoaded, true);
    assert.equal(activated.contextSegments.length, 2);
    assert.equal((await skills.listSummaries())[0]?.loadingState, "loaded");
  });

  it("keeps untrusted and disabled skills inert", async () => {
    const skills = new InMemorySkillSystem();
    await skills.registerSkill({
      id: asId<"skill">("skill-untrusted"),
      name: "workspace-review",
      version: "1.0.0",
      source: "workspace",
      trust: "untrusted",
      activation: ["review"],
      executionModes: ["context"],
      permissions: []
    });
    await skills.registerSkill({
      id: asId<"skill">("skill-disabled"),
      name: "disabled-review",
      version: "1.0.0",
      source: "user",
      trust: "trusted",
      enabled: false,
      activation: ["disabled-review"],
      executionModes: ["context"],
      permissions: []
    });

    assert.equal((await skills.activateSkill({ schemaVersion: SKILL_SCHEMA_VERSION, name: "workspace-review", trigger: "explicit", context: {} })).status, "inert");
    assert.equal((await skills.projectContext({ schemaVersion: SKILL_SCHEMA_VERSION, name: "disabled-review", trigger: "explicit", sessionId: asId<"session">("session-skill") })).nodes.length, 0);
  });

  it("rejects malformed manifests and unsupported schema versions", async () => {
    const skills = new InMemorySkillSystem();
    const malformed = await skills.validateManifest({ name: "missing" } as never);
    const unsupported = await skills.validateManifest({
      schemaVersion: "999.0.0",
      id: asId<"skill">("skill-unsupported"),
      name: "unsupported",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["unsupported"],
      executionModes: ["context"],
      permissions: []
    });

    assert.equal(malformed.ok, false);
    assert.equal(malformed.diagnostics.some((item) => item.code === "SKILL_ID_REQUIRED"), true);
    assert.equal(unsupported.ok, false);
    assert.equal(unsupported.diagnostics.some((item) => item.code === "SKILL_SCHEMA_VERSION_UNSUPPORTED"), true);
  });

  it("projects bounded redacted context nodes", async () => {
    const skills = new InMemorySkillSystem();
    await skills.registerSkill({
      id: asId<"skill">("skill-secret"),
      name: "secret-safe",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["secret-safe"],
      executionModes: ["context"],
      permissions: [],
      context: { maxSegments: 1, maxSegmentChars: 32, preferredKinds: ["instruction"] },
      metadata: {
        instructions: [`Never print DEEPSEEK_API_KEY=${secret} in output.`]
      }
    });

    const projection = await skills.projectContext({
      schemaVersion: SKILL_SCHEMA_VERSION,
      name: "secret-safe",
      trigger: "explicit",
      sessionId: asId<"session">("session-skill-projection"),
      maxSegments: 1,
      maxSegmentChars: 80
    });
    const serialized = JSON.stringify(projection);
    assert.equal(projection.status, "projected");
    assert.equal(projection.nodes.length, 1);
    assert.equal(projection.nodes[0]?.source, "skill-system");
    assert.equal(serialized.includes(secret), false);
    assert.equal(serialized.includes("[REDACTED:secret]"), true);
  });
});
