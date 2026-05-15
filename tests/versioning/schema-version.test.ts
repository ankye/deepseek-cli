import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONTEXT_PROJECTION_SCHEMA_VERSION, EVIDENCE_FIRST_COMPATIBILITY, EVIDENCE_FIRST_SCHEMA_VERSION, HOOK_SCHEMA_VERSION, MCP_SCHEMA_VERSION, OBSERVABILITY_SCHEMA_VERSION, SELF_REPAIR_COMPATIBILITY, SELF_REPAIR_SCHEMA_VERSION, SESSION_SCHEMA_VERSION, SKILL_SCHEMA_VERSION, asId, type EvidenceManifest, type SelfRepairModelHypothesis, type SelfRepairOutcomeSummary } from "@deepseek/platform-contracts";
import { createProjectionRequest, InMemoryContextEngine } from "@deepseek/context-engine";
import { createHookOutput, InMemoryHookSystem } from "@deepseek/hook-system";
import { InMemoryMcpGateway } from "@deepseek/mcp-gateway";
import { InMemoryObservabilitySink } from "@deepseek/observability";
import { InMemorySkillSystem } from "@deepseek/skill-system";
import { requireSchemaVersion } from "@deepseek/testing-regression";

describe("versioning checks", () => {
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

  it("requires schemaVersion on skill manifests, activation results, summaries, and context segments", async () => {
    const skills = new InMemorySkillSystem();
    await skills.registerSkill({
      id: asId<"skill">("skill-compat"),
      name: "compat-skill",
      version: "1.0.0",
      source: "built-in",
      trust: "trusted",
      activation: ["compat"],
      executionModes: ["context"],
      permissions: [],
      metadata: { instructions: ["compat instruction"] }
    });
    const [summary] = await skills.listSummaries();
    const activation = await skills.activateSkill({ schemaVersion: SKILL_SCHEMA_VERSION, name: "compat-skill", trigger: "explicit", context: {} });
    const projection = await skills.projectContext({
      schemaVersion: SKILL_SCHEMA_VERSION,
      name: "compat-skill",
      trigger: "explicit",
      sessionId: asId<"session">("session-skill-compat")
    });

    assert.equal(summary?.schemaVersion, SKILL_SCHEMA_VERSION);
    assert.equal(activation.schemaVersion, SKILL_SCHEMA_VERSION);
    assert.equal(activation.contextSegments[0]?.schemaVersion, SKILL_SCHEMA_VERSION);
    assert.equal(projection.schemaVersion, SKILL_SCHEMA_VERSION);
    assert.deepEqual(requireSchemaVersion(summary), []);
    assert.deepEqual(requireSchemaVersion(activation), []);
    assert.deepEqual(requireSchemaVersion(activation.contextSegments[0]), []);
    assert.equal((await skills.validateManifest({ ...activation.manifest, schemaVersion: "999.0.0" } as never)).ok, false);
  });

  it("requires schemaVersion on hook manifests, summaries, invocation results, and output records", async () => {
    const hooks = new InMemoryHookSystem();
    await hooks.registerHook(
      {
        id: asId<"hook">("hook-compat"),
        name: "compat-hook",
        version: "1.0.0",
        point: "user-input.before",
        source: "built-in",
        trust: "trusted",
        ordering: { priority: 1 },
        timeoutMs: 100,
        failurePolicy: "continue",
        isolation: "in-process-observe-only",
        permissions: [],
        inputSchema: {},
        outputSchema: {}
      },
      async () => ({ ok: true, value: createHookOutput(asId<"hook">("hook-compat"), "observation", { ok: true }) })
    );
    const [summary] = await hooks.listHooks();
    const order = await hooks.projectOrder({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before" });
    const invocation = await hooks.invokeHooks({ schemaVersion: HOOK_SCHEMA_VERSION, point: "user-input.before", input: {} });

    assert.equal(summary?.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.equal(order.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.equal(invocation.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.equal(invocation.executions[0]?.outputs[0]?.schemaVersion, HOOK_SCHEMA_VERSION);
    assert.deepEqual(requireSchemaVersion(summary), []);
    assert.deepEqual(requireSchemaVersion(order), []);
    assert.deepEqual(requireSchemaVersion(invocation), []);
    assert.deepEqual(requireSchemaVersion(invocation.executions[0]?.outputs[0]), []);
    assert.equal((await hooks.validateManifest({
      id: asId<"hook">("hook-unsupported-compat"),
      name: "unsupported",
      version: "1.0.0",
      point: "user-input.before",
      source: "built-in",
      trust: "trusted",
      ordering: { priority: 1 },
      timeoutMs: 100,
      failurePolicy: "continue",
      isolation: "in-process-observe-only",
      permissions: [],
      inputSchema: {},
      outputSchema: {},
      schemaVersion: "999.0.0"
    })).ok, false);
  });

  it("requires schemaVersion on MCP manifests, summaries, calls, and resource reads", async () => {
    const mcp = new InMemoryMcpGateway();
    await mcp.connectServer(
      {
        id: asId<"mcpServer">("mcp-compat"),
        name: "compat",
        version: "1.0.0",
        namespace: "compat",
        source: "built-in",
        trust: "trusted",
        transport: { kind: "fake" },
        permissions: [],
        timeoutMs: 100,
        tools: [{ name: "lookup", inputSchema: {}, permissions: [] }],
        resources: [{ uri: "mcp://compat/resource", name: "resource", permissions: [], cachePolicy: "no-store" }],
        prompts: [{ name: "prompt" }]
      },
      {
        toolHandlers: {
          lookup: async () => ({ ok: true, value: { ok: true } })
        },
        resourceHandlers: {
          "mcp://compat/resource": async () => ({ ok: true, value: { content: "ok" } })
        }
      }
    );
    const [server] = await mcp.listServers({ schemaVersion: MCP_SCHEMA_VERSION });
    const [tool] = await mcp.listTools({ schemaVersion: MCP_SCHEMA_VERSION });
    const [resource] = await mcp.listResources({ schemaVersion: MCP_SCHEMA_VERSION });
    const [prompt] = await mcp.listPrompts({ schemaVersion: MCP_SCHEMA_VERSION });
    const call = await mcp.callTool({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-compat"), name: "lookup", caller: "test", input: {} });
    const read = await mcp.readResource({ schemaVersion: MCP_SCHEMA_VERSION, serverId: asId<"mcpServer">("mcp-compat"), uri: "mcp://compat/resource", caller: "test" });

    assert.ok(server);
    assert.ok(tool);
    assert.ok(resource);
    assert.ok(prompt);
    for (const subject of [server, tool, resource, prompt, call, read]) {
      assert.deepEqual(requireSchemaVersion(subject), []);
    }
    const unsupported = await mcp.callTool({ schemaVersion: "999.0.0", serverId: asId<"mcpServer">("mcp-compat"), name: "lookup", caller: "test", input: {} });
    assert.equal(unsupported.status, "rejected");
    assert.equal(unsupported.diagnostics.some((item) => item.code === "MCP_SCHEMA_VERSION_UNSUPPORTED"), true);
  });

  it("requires schemaVersion on evidence-first manifests and unsupported claim diagnostics", () => {
    const manifest: EvidenceManifest = {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      manifestId: "evidence-manifest:compat",
      artifactId: "generated-webpage",
      artifactKind: "webpage",
      status: "passed",
      generatedAt: "1970-01-01T00:00:00.000Z",
      sourceCoverage: [{
        schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
        sourceGroup: "package-metadata",
        covered: true,
        itemCount: 1,
        factClasses: ["package"],
        fingerprints: ["sha256:package-json"],
        missingFactClasses: [],
        compatibility: EVIDENCE_FIRST_COMPATIBILITY,
        redaction: { class: "internal", fields: ["fingerprints"] }
      }],
      evidenceItems: [{
        schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
        evidenceId: "evidence:package-json",
        sourceGroup: "package-metadata",
        sourcePath: "src/apps/cli/package.json",
        sourceLabel: "CLI package metadata",
        factClasses: ["package"],
        preview: "name deepseek-agent-cli",
        fingerprint: "sha256:package-json",
        freshness: { status: "current" },
        trace: {},
        compatibility: EVIDENCE_FIRST_COMPATIBILITY,
        redaction: { class: "internal", fields: ["preview"] }
      }],
      claimGroundings: [{
        schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
        claimId: "claim:package",
        claimPreview: "Package name is deepseek-agent-cli.",
        claimFingerprint: "claim:package",
        factClass: "package",
        certainty: "verified",
        evidenceIds: ["evidence:package-json"],
        outputScope: "generated-webpage/index.html",
        compatibility: EVIDENCE_FIRST_COMPATIBILITY,
        redaction: { class: "internal", fields: ["claimPreview"] }
      }],
      assumptions: [],
      unsupportedClaims: [{
        schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
        diagnosticId: "unsupported:command",
        code: "unsupported-command",
        severity: "error",
        claimFingerprint: "claim:npx-deepseek-cli-init",
        claimPreview: "npx deepseek-cli init",
        missingFactClass: "command",
        artifactId: "generated-webpage",
        remediationHint: "Use evidence-backed commands.",
        compatibility: EVIDENCE_FIRST_COMPATIBILITY,
        redaction: { class: "internal", fields: ["claimPreview", "remediationHint"] }
      }],
      unsupportedClaimCount: 1,
      trace: {},
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["evidenceItems.preview", "claimGroundings.claimPreview"] }
    };

    assert.deepEqual(requireSchemaVersion(manifest), []);
    assert.ok(manifest.evidenceItems[0]);
    assert.ok(manifest.claimGroundings[0]);
    assert.ok(manifest.unsupportedClaims[0]);
    assert.deepEqual(requireSchemaVersion(manifest.evidenceItems[0]), []);
    assert.deepEqual(requireSchemaVersion(manifest.claimGroundings[0]), []);
    assert.deepEqual(requireSchemaVersion(manifest.unsupportedClaims[0]), []);
    const missingSchema = { ...manifest } as { schemaVersion?: string };
    delete missingSchema.schemaVersion;
    assert.deepEqual(requireSchemaVersion(missingSchema), ["missing schemaVersion"]);
  });

  it("requires schemaVersion on self-repair evidence schemas", () => {
    const trace = {
      traceId: asId<"trace">("trace-repair-version"),
      spanId: asId<"span">("span-repair-version"),
      correlationId: asId<"correlation">("corr-repair-version")
    };
    const outcome: SelfRepairOutcomeSummary = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      enabled: true,
      activated: true,
      attemptCount: 1,
      successCount: 1,
      repeatedNoopCount: 0,
      stopReason: "completed",
      classifications: [{
        schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
        classificationId: "repair-classification:version",
        failureSource: "tool-error",
        status: "classified",
        repairability: "repairable",
        safetyClass: "safe-read",
        affectedScope: "tool",
        severity: "error",
        evidenceFingerprints: ["repair:h1"],
        diagnostics: [],
        trace,
        compatibility: SELF_REPAIR_COMPATIBILITY,
        redaction: { class: "internal" }
      }],
      attempts: [],
      verification: [],
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal" }
    };
    const hypothesis: SelfRepairModelHypothesis = {
      schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
      hypothesisId: "repair-hypothesis:version",
      classificationId: "repair-classification:version",
      status: "accepted",
      hypothesisPreview: "tool input mismatch",
      proposedActionType: "model-feedback",
      evidenceFingerprints: ["repair:h1"],
      diagnostics: [],
      trace,
      compatibility: SELF_REPAIR_COMPATIBILITY,
      redaction: { class: "internal", fields: ["hypothesisPreview"] }
    };

    assert.deepEqual(requireSchemaVersion(outcome), []);
    assert.ok(outcome.classifications[0]);
    assert.deepEqual(requireSchemaVersion(outcome.classifications[0]), []);
    assert.deepEqual(requireSchemaVersion(hypothesis), []);
  });
});
