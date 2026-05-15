import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";
import { asId, TOOL_FAMILY_DOMAIN_IDS, TOOL_FAMILY_IDS } from "@deepseek/platform-contracts";
import type { CapabilityExecutionContext, CoreToolResult, ExecutionEnvelope, JsonObject, SerializableResult, TraceContext } from "@deepseek/platform-contracts";
import { analyzeResourceScope, createSandboxAuditEvidence, createSandboxRequirement, createSecretRedactionDecision } from "@deepseek/policy-sandbox";
import {
  buildToolFamilyParityMatrix,
  coreCapabilityFamilyMappings,
  coreToolIds,
  coreToolManifests,
  registerCoreCodingTools,
  toolFamilyCatalog,
  validateToolFamilyCatalog
} from "./index.js";

const workspaceRoot = "/workspace";

async function invoke(
  id: (typeof coreToolIds)[keyof typeof coreToolIds],
  input: JsonObject,
  options: { readonly platform?: FakePlatformRuntime; readonly workspaceState?: InMemoryWorkspaceStateManager } = {}
): Promise<SerializableResult<CoreToolResult>> {
  const platform = options.platform ?? new FakePlatformRuntime("fake", workspaceRoot);
  const workspaceState = options.workspaceState ?? new InMemoryWorkspaceStateManager();
  const registry = new InMemoryCapabilityRegistry();
  await registerCoreCodingTools(registry, { platform, workspaceState, workspaceRoot });
  const binding = await registry.resolveExecutable(id);
  assert.ok(binding);
  return binding.execute(input, context(id)) as Promise<SerializableResult<CoreToolResult>>;
}

function context(capabilityId: (typeof coreToolIds)[keyof typeof coreToolIds]): CapabilityExecutionContext {
  const trace: TraceContext = {
    traceId: asId<"trace">("trace-core-tool"),
    spanId: asId<"span">("span-core-tool"),
    correlationId: asId<"correlation">("corr-core-tool"),
    sessionId: asId<"session">("session-core-tool")
  };
  return {
    envelope: {
      invocationId: "invocation-core-tool",
      capabilityId,
      capabilityVersion: "1.0.0",
      kind: "capability",
      caller: "unit",
      sessionId: asId<"session">("session-core-tool"),
      inputSchema: {},
      outputSchema: {},
      redactionClass: "internal",
      provenance: {},
      trust: "trusted",
      permissions: [],
      sideEffect: "read",
      policyContext: {},
      approvalRequired: false,
      resourceLocks: [],
      timeoutMs: 30_000,
      cancellation: {},
      retryPolicy: {},
      idempotency: {},
      trace,
      telemetry: {},
      replayPolicy: {},
      ...securityFields(capabilityId),
      createdAt: new Date(0).toISOString()
    } satisfies ExecutionEnvelope,
    trace,
    signal: new AbortController().signal,
    metadata: {}
  };
}

function securityFields(capabilityId: (typeof coreToolIds)[keyof typeof coreToolIds]) {
  const resourceScope = analyzeResourceScope({}, "read");
  const sandboxRequirements = createSandboxRequirement({ sideEffect: "read", resourceScope, timeoutMs: 30_000, permissions: [] });
  return {
    secretExposure: createSecretRedactionDecision("", { class: "public" }),
    resourceScope,
    sandboxRequirements,
    audit: createSandboxAuditEvidence({
      decision: "test",
      reasonCode: "test.core-tool-context",
      subject: "unit",
      resource: String(capabilityId),
      sandboxProfile: sandboxRequirements.profile
    })
  };
}

describe("core coding tool executors", () => {
  it("defines the first tool-family catalog without placeholder tools", () => {
    assert.deepEqual(validateToolFamilyCatalog(), []);
    assert.equal(toolFamilyCatalog.domains.length, TOOL_FAMILY_DOMAIN_IDS.length);
    assert.equal(toolFamilyCatalog.families.length, TOOL_FAMILY_IDS.length);
    assert.deepEqual(toolFamilyCatalog.domains.map((domain) => domain.domainId), TOOL_FAMILY_DOMAIN_IDS);
    assert.deepEqual(toolFamilyCatalog.families.map((family) => family.familyId), TOOL_FAMILY_IDS);
    assert.equal(new Set(toolFamilyCatalog.families.map((family) => family.familyId)).size, TOOL_FAMILY_IDS.length);
    for (const family of toolFamilyCatalog.families) {
      if (family.implementationState === "implemented") {
        assert.equal(family.tools.length > 0, true, `${family.familyId} should have concrete tool implementations`);
      } else {
        assert.equal(family.tools.length, 0, `${family.familyId} should not use placeholder tools`);
      }
      assert.equal(family.tools.some((tool) => tool.toolId.startsWith("catalog.")), false);
    }
  });

  it("attaches family metadata to every implemented core tool manifest", () => {
    const manifests = coreToolManifests();
    const mappedCapabilities = new Set(coreCapabilityFamilyMappings().map((item) => item.capabilityId));
    assert.equal(manifests.length, Object.values(coreToolIds).length);

    for (const manifest of manifests) {
      assert.ok(manifest.toolFamily, `${manifest.id} should include tool family metadata`);
      assert.equal(manifest.toolFamily.catalogVersion, toolFamilyCatalog.catalogVersion);
      assert.equal(mappedCapabilities.has(manifest.id), true);
    }
  });

  it("scores planned or unassessed families as zero instead of giving catalog credit", () => {
    const matrix = buildToolFamilyParityMatrix();
    const implemented = toolFamilyCatalog.families.filter((family) => family.implementationState === "implemented").length;

    assert.equal(matrix.totalFamilyCount, TOOL_FAMILY_IDS.length);
    assert.equal(matrix.implementedFamilyCount, implemented);
    assert.equal(matrix.plannedFamilyCount, TOOL_FAMILY_IDS.length - implemented);
    assert.equal(matrix.liveCoveredFamilyCount, 0);
    assert.equal(matrix.taskCoveredFamilyCount, 0);
    assert.equal(matrix.passedFamilyCount, 0);
    assert.equal(matrix.objectiveScore, 0);

    const patch = matrix.scorecards.find((scorecard) => scorecard.familyId === "patch.apply");
    assert.equal(patch?.implementationState, "implemented");
    assert.equal(patch?.toolCount, 1);
    assert.equal(patch?.objectiveScore, 0.4);

    const withEvidence = buildToolFamilyParityMatrix({
      liveCoveredFamilyIds: ["file.read"],
      taskCoveredFamilyIds: ["file.read"],
      safetyCoveredFamilyIds: ["file.read"]
    });
    assert.equal(withEvidence.passedFamilyCount, 1);
    assert.equal(withEvidence.objectiveScore, 0.016);
    assert.equal(withEvidence.scorecards.find((scorecard) => scorecard.familyId === "file.read")?.objectiveScore, 1);
  });

  it("reads, lists, searches, and bounds file evidence", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot, { searchProvider: "js" });
    await platform.writeFile(`${workspaceRoot}/README.md`, `alpha\n${"x".repeat(64)}`);

    const read = await invoke(coreToolIds.fileRead, { path: "README.md", workspaceRoot, limitBytes: 12 }, { platform });
    assert.equal(read.ok, true);
    assert.equal(read.value?.evidence.preview?.truncated, true);
    assert.deepEqual(read.value?.evidence.affectedPaths, [`${workspaceRoot}/README.md`]);

    const list = await invoke(coreToolIds.fileList, { pattern: "README", workspaceRoot }, { platform });
    assert.equal(list.ok, true);
    assert.match(list.value?.evidence.preview?.text ?? "", /README\.md/);

    const search = await invoke(coreToolIds.searchText, { pattern: "alpha", workspaceRoot }, { platform });
    assert.equal(search.ok, true);
    assert.equal(search.value?.evidence.provider?.selectedProvider, "js");
  });

  it("globs workspace files, views local assets, and reads bounded notebooks", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/src/app.ts`, "export const value = 1;");
    await platform.writeFile(`${workspaceRoot}/README.txt`, "hello asset");
    await platform.writeFile(`${workspaceRoot}/analysis.ipynb`, JSON.stringify({
      nbformat: 4,
      nbformat_minor: 5,
      cells: [
        { cell_type: "markdown", source: ["# Title\n", "body"], metadata: { safe: true, token: "redacted" } },
        { cell_type: "code", source: "print('x')", execution_count: 1, outputs: [{ output_type: "stream" }] }
      ]
    }));

    const glob = await invoke(coreToolIds.workspaceGlob, { pattern: "**/*.ts", workspaceRoot }, { platform });
    assert.equal(glob.ok, true);
    assert.match(glob.value?.evidence.preview?.text ?? "", /src\/app\.ts/);

    const asset = await invoke(coreToolIds.assetViewLocal, { path: "README.txt", workspaceRoot, limitBytes: 20 }, { platform });
    assert.equal(asset.ok, true);
    assert.equal(asset.value?.evidence.metadata.mime, "text/plain");
    assert.match(asset.value?.evidence.preview?.text ?? "", /hello asset/);

    const notebook = await invoke(coreToolIds.notebookRead, { path: "analysis.ipynb", workspaceRoot, maxCells: 1, maxSourceBytes: 8 }, { platform });
    assert.equal(notebook.ok, true);
    assert.equal(notebook.value?.evidence.metadata.cellCount, 2);
    assert.equal(notebook.value?.evidence.metadata.truncatedCells, true);

    const malformed = await invoke(coreToolIds.notebookRead, { path: "README.txt", workspaceRoot }, { platform });
    assert.equal(malformed.ok, false);
    assert.equal(malformed.error?.code, "NOTEBOOK_EXTENSION_UNSUPPORTED");

    const rejected = await invoke(coreToolIds.workspaceGlob, { pattern: "../**/*.ts", workspaceRoot }, { platform });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.error?.code, "GLOB_PATTERN_REJECTED");
  });

  it("bounds file evidence without splitting Unicode surrogate pairs", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/README.md`, `${"a".repeat(7999)}🧠tail`);

    const read = await invoke(coreToolIds.fileRead, { path: "README.md", workspaceRoot, limitBytes: 8000 }, { platform });
    const preview = read.value?.evidence.preview?.text ?? "";

    assert.equal(read.ok, true);
    assert.equal(read.value?.evidence.preview?.truncated, true);
    assert.equal(Buffer.byteLength(preview, "utf8") <= 8000, true);
    assert.equal(hasLoneSurrogate(preview), false);
  });

  it("writes and exact-edits with transactions, then rejects ambiguous edits without mutation", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const workspaceState = new InMemoryWorkspaceStateManager(platform);

    const write = await invoke(coreToolIds.fileWrite, { path: "app.ts", content: "one two one", workspaceRoot }, { platform, workspaceState });
    assert.equal(write.ok, true);

    const nestedWrite = await invoke(coreToolIds.fileWrite, { path: "generated-webpage/index.html", content: "<h1>ok</h1>", workspaceRoot }, { platform, workspaceState });
    assert.equal(nestedWrite.ok, true);
    assert.equal(await platform.readFile(`${workspaceRoot}/generated-webpage/index.html`), "<h1>ok</h1>");

    const rejected = await invoke(coreToolIds.fileEdit, { path: "app.ts", expected: "one", replacement: "three", workspaceRoot }, { platform, workspaceState });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.error?.code, "EDIT_PRECONDITION_FAILED");
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one two one");

    const edited = await invoke(coreToolIds.fileEdit, { path: "app.ts", expected: "two", replacement: "three", workspaceRoot }, { platform, workspaceState });
    assert.equal(edited.ok, true);
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one three one");
    assert.equal(workspaceState.records().length, 3);
    const checkpoint = edited.value?.evidence.metadata.checkpoint as { checkpointId?: string; beforeHash?: string; afterHash?: string } | undefined;
    assert.equal(typeof checkpoint?.checkpointId, "string");
    assert.notEqual(checkpoint?.beforeHash, checkpoint?.afterHash);
    const undo = await workspaceState.undoLatest({ path: `${workspaceRoot}/app.ts` });
    assert.equal(undo.ok, true);
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one two one");
  });

  it("applies multi-hunk patches transactionally and reverts checkpoints safely", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const workspaceState = new InMemoryWorkspaceStateManager(platform);
    await platform.writeFile(`${workspaceRoot}/app.ts`, "one\ntwo\nthree\nfour\nfive\nsix\nseven\n");

    const patch = [
      "--- a/app.ts",
      "+++ b/app.ts",
      "@@ -1,3 +1,3 @@",
      " one",
      "-two",
      "+TWO",
      " three",
      "@@ -5,3 +5,3 @@",
      " five",
      "-six",
      "+SIX",
      " seven",
      ""
    ].join("\n");
    const applied = await invoke(coreToolIds.patchApply, { patch, workspaceRoot }, { platform, workspaceState });
    assert.equal(applied.ok, true);
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one\nTWO\nthree\nfour\nfive\nSIX\nseven\n");
    assert.equal(workspaceState.checkpoints().length, 1);

    const preview = await invoke(coreToolIds.revertUndo, { path: "app.ts", workspaceRoot, dryRun: true }, { platform, workspaceState });
    assert.equal(preview.ok, true);
    assert.match(preview.value?.evidence.preview?.text ?? "", /checkpoint-/);

    const undone = await invoke(coreToolIds.revertUndo, { path: "app.ts", workspaceRoot }, { platform, workspaceState });
    assert.equal(undone.ok, true);
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "one\ntwo\nthree\nfour\nfive\nsix\nseven\n");
  });

  it("rejects failed patches without mutating target files and rejects stale undo", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const workspaceState = new InMemoryWorkspaceStateManager(platform);
    await platform.writeFile(`${workspaceRoot}/app.ts`, "alpha\nbeta\n");

    const failed = await invoke(coreToolIds.patchApply, { patch: "--- a/app.ts\n+++ b/app.ts\n@@ -1,1 +1,1 @@\n-missing\n+changed\n", workspaceRoot }, { platform, workspaceState });
    assert.equal(failed.ok, false);
    assert.equal(failed.error?.code, "PATCH_PRECONDITION_FAILED");
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "alpha\nbeta\n");

    const applied = await invoke(coreToolIds.patchApply, { patch: "--- a/app.ts\n+++ b/app.ts\n@@ -1,1 +1,1 @@\n-alpha\n+ALPHA\n", workspaceRoot }, { platform, workspaceState });
    assert.equal(applied.ok, true);
    await platform.writeFile(`${workspaceRoot}/app.ts`, "stale\n");
    const stale = await invoke(coreToolIds.revertUndo, { path: "app.ts", workspaceRoot }, { platform, workspaceState });
    assert.equal(stale.ok, false);
    assert.equal(stale.error?.code, "CHECKPOINT_STALE_FILE");
    assert.equal(await platform.readFile(`${workspaceRoot}/app.ts`), "stale\n");
  });

  it("rejects path escapes before reading or mutating", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/safe.txt`, "safe");

    const read = await invoke(coreToolIds.fileRead, { path: "../secret.txt", workspaceRoot }, { platform });
    assert.equal(read.ok, false);
    assert.equal(read.error?.code, "PATH_REJECTED");

    const write = await invoke(coreToolIds.fileWrite, { path: "../secret.txt", content: "bad", workspaceRoot }, { platform });
    assert.equal(write.ok, false);
    await assert.rejects(() => platform.readFile("/secret.txt"));
  });

  it("runs shell, git, test, and todo tools with structured evidence", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/package.json`, JSON.stringify({ scripts: { test: "node --test", lint: "eslint ." } }));

    const shell = await invoke(coreToolIds.shellRun, { command: "echo", args: ["ok"], workspaceRoot }, { platform });
    assert.equal(shell.ok, true);
    assert.equal(shell.value?.evidence.provider?.selectedProvider, "argv");

    const git = await invoke(coreToolIds.gitStatus, { workspaceRoot }, { platform });
    assert.equal(git.ok, true);
    assert.equal(git.value?.evidence.metadata.gitMode, "status");

    const history = await invoke(coreToolIds.gitHistoryBranch, { workspaceRoot, checkoutBranch: "feature/x" }, { platform });
    assert.equal(history.ok, true);
    assert.equal((history.value?.evidence.metadata.checkoutPreview as { applied?: boolean } | undefined)?.applied, false);

    const test = await invoke(coreToolIds.testRun, { command: "npm", args: ["test"], workspaceRoot, intent: "unit" }, { platform });
    assert.equal(test.ok, true);
    assert.equal(test.value?.evidence.metadata.intent, "unit");

    const scripts = await invoke(coreToolIds.packageManager, { operation: "scripts", workspaceRoot }, { platform });
    assert.equal(scripts.ok, true);
    assert.equal(scripts.value?.evidence.metadata.scriptCount, 2);

    const install = await invoke(coreToolIds.packageManager, { operation: "install", packages: ["left-pad"], manager: "pnpm", workspaceRoot }, { platform });
    assert.equal(install.ok, true);
    assert.equal(install.value?.evidence.metadata.dryRun, true);

    const repl = await invoke(coreToolIds.replExecute, { code: "const a = 2; a + 3", workspaceRoot }, { platform });
    assert.equal(repl.ok, true);
    assert.match(repl.value?.evidence.preview?.text ?? "", /=> 5/);

    const plan = await invoke(coreToolIds.todoPlan, { items: [{ id: "1", title: "ship", status: "completed" }] }, { platform });
    assert.equal(plan.ok, true);
    assert.equal(plan.value?.evidence.metadata.count, 1);

    const repairedPlan = await invoke(coreToolIds.todoPlan, { items: [{ description: "write html", done: false }] }, { platform });
    assert.equal(repairedPlan.ok, true);
    assert.match(repairedPlan.value?.evidence.preview?.text ?? "", /pending: write html/);
  });

  it("reports platform-unavailable process diagnostics", async () => {
    const platform = new FakePlatformRuntime("linux", workspaceRoot, { environmentKind: "remote", noLocalShell: true });
    const result = await invoke(coreToolIds.shellRun, { command: "echo", args: ["ok"], workspaceRoot }, { platform });
    assert.equal(result.ok, false);
    assert.equal(result.error?.code, "PROCESS_UNAVAILABLE");
  });
});

function hasLoneSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}
