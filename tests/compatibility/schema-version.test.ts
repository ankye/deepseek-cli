import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, OBSERVABILITY_SCHEMA_VERSION, SESSION_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createProjectionRequest, InMemoryContextEngine } from "@deepseek/context-engine";
import { InMemoryObservabilitySink } from "@deepseek/observability";
import { requireSchemaVersion } from "@deepseek/testing-regression";

describe("compatibility checks", () => {
  it("requires schemaVersion on persisted subjects", () => {
    assert.deepEqual(requireSchemaVersion({ schemaVersion: "1.0.0" }), []);
    assert.deepEqual(requireSchemaVersion({}), ["missing schemaVersion"]);
  });

  it("requires schemaVersion on session resume and fork artifacts", () => {
    const resume = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId: asId<"session">("session-compat"),
      eventCount: 0,
      latestSequence: 0
    };
    const fork = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      parentSessionId: asId<"session">("session-parent"),
      childSessionId: asId<"session">("session-child"),
      forkPointSequence: 0,
      inheritedEventCount: 0
    };

    assert.deepEqual(requireSchemaVersion(resume), []);
    assert.deepEqual(requireSchemaVersion(fork), []);
    const missingSchema = { ...resume } as Partial<typeof resume>;
    delete missingSchema.schemaVersion;
    assert.deepEqual(requireSchemaVersion(missingSchema), ["missing schemaVersion"]);
  });

  it("requires schemaVersion on projection request and result artifacts", async () => {
    const sessionId = asId<"session">("session-projection-compat");
    const request = createProjectionRequest({
      sessionId,
      prompt: "compat projection",
      hardLimitTokens: 32
    });
    const engine = new InMemoryContextEngine();
    const result = await engine.projectGraph(request);

    assert.equal(request.schemaVersion, CONTEXT_PROJECTION_SCHEMA_VERSION);
    assert.equal(result.schemaVersion, CONTEXT_PROJECTION_SCHEMA_VERSION);
    assert.deepEqual(requireSchemaVersion(request), []);
    assert.deepEqual(requireSchemaVersion(result), []);

    const unsupported = await engine.projectGraph({ ...request, schemaVersion: "999.0.0" });
    assert.equal(unsupported.status, "rejected");
    assert.equal(unsupported.budget.reason, "unsupported-schema");
  });

  it("requires schemaVersion on observability records and diagnostic bundles", async () => {
    const sink = new InMemoryObservabilitySink();
    await sink.emit({ kind: "trace", at: new Date(0).toISOString(), name: "compat", fields: { message: "compat" } });
    const [record] = await sink.drain();
    const bundle = await sink.createDiagnosticBundle({ target: "local-bundle", reason: "compat" });

    assert.equal(record?.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
    assert.equal(bundle.schemaVersion, OBSERVABILITY_SCHEMA_VERSION);
    assert.deepEqual(requireSchemaVersion(record), []);
    assert.deepEqual(requireSchemaVersion(bundle), []);
    const missingSchema: { schemaVersion?: string } = { schemaVersion: bundle.schemaVersion };
    delete missingSchema.schemaVersion;
    assert.deepEqual(requireSchemaVersion(missingSchema), ["missing schemaVersion"]);
  });
});
