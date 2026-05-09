import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SKILL_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("skill system golden replay", () => {
  it("normalizes trusted skill activation and context evidence", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.skills.registerSkill({
      id: asId<"skill">("skill-golden"),
      name: "golden-skill",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["golden"],
      executionModes: ["context"],
      permissions: [],
      metadata: { instructions: ["Golden skill instruction."] }
    });

    const activation = await deps.skills.activateSkill({ schemaVersion: SKILL_SCHEMA_VERSION, name: "golden-skill", trigger: "explicit", context: {} });
    const projection = await deps.skills.projectContext({
      schemaVersion: SKILL_SCHEMA_VERSION,
      name: "golden-skill",
      trigger: "context-relevance",
      sessionId: asId<"session">("session-skill-golden")
    });
    const trace = await deps.regression.normalize({
      name: "skill-system",
      schemaVersion: "1.0.0",
      protocol: [],
      bus: [],
      runtime: [
        {
          kind: "context.projection.completed",
          sessionId: asId<"session">("session-skill-golden"),
          trace: {
            traceId: asId<"trace">("trace-skill-golden"),
            spanId: asId<"span">("span-skill-golden"),
            correlationId: asId<"correlation">("corr-skill-golden"),
            sessionId: asId<"session">("session-skill-golden")
          },
          data: {
            skillActivation: activation.replayFingerprint,
            skillProjection: projection.replayFingerprint
          }
        }
      ],
      sessions: [],
      assertions: [{ expectedKind: "context.projection.completed" }]
    });
    const replay = await deps.regression.replay(trace);

    assert.equal(replay.ok, true, replay.failures.join("\n"));
    assert.equal(activation.status, "activated");
    assert.equal(projection.nodes.length > 0, true);
  });
});
