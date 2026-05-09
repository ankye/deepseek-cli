import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { asId } from "@deepseek/platform-contracts";
import { DeterministicCodeIntelligenceService, NullCodeIntelligenceService } from "./index.js";

const workspaceRoot = "/workspace";

describe("deterministic code intelligence service", () => {
  it("indexes diagnostics, symbols, definitions, and references", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/app.ts`, "export function run() {\n  // TODO wire tests\n  throw new Error('x')\n}\nrun();\n");
    const service = new DeterministicCodeIntelligenceService(platform);
    const indexed = await service.index(workspaceRoot);

    assert.equal(indexed.ok, true);
    assert.equal(indexed.value?.metadata.provider.provider, "local-analyzer");
    assert.equal(indexed.value?.diagnostics.some((entry) => entry.code === "CODE_TODO"), true);
    assert.equal(indexed.value?.diagnostics.some((entry) => entry.code === "CODE_THROW"), true);
    assert.equal((await service.definitions("run")).length, 1);
    assert.equal((await service.references("run")).length >= 2, true);
  });

  it("creates redacted context nodes and hides secret-like diagnostics", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/secret.ts`, "// TODO DEEPSEEK_API_KEY=sk-test-secret\nexport const value = 1;\n");
    const service = new DeterministicCodeIntelligenceService(platform);
    const result = await service.contextNodes({
      sessionId: asId<"session">("session-code-intelligence"),
      root: workspaceRoot,
      includeDiagnostics: true,
      includeSymbols: true
    });
    const serialized = JSON.stringify(result);

    assert.equal(result.ok, true);
    assert.equal(result.value?.nodes.some((node) => node.source === "code-intelligence"), true);
    assert.equal(serialized.includes("sk-test-secret"), false);
    assert.match(serialized, /REDACTED/);
  });

  it("keeps provider model identifiers visible in diagnostics", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    await platform.writeFile(`${workspaceRoot}/model.ts`, "// TODO use model deepseek-v4-flash\nexport const model = 'deepseek-v4-flash';\n");
    const service = new DeterministicCodeIntelligenceService(platform);
    const result = await service.contextNodes({
      sessionId: asId<"session">("session-code-intelligence-model"),
      root: workspaceRoot,
      includeDiagnostics: true,
      includeSymbols: false
    });
    const serialized = JSON.stringify(result);

    assert.equal(result.ok, true);
    assert.equal(serialized.includes("deepseek-v4-flash"), true);
    assert.equal(serialized.includes("[REDACTED:api-key]"), false);
  });

  it("refreshes diagnostics after path-scoped invalidation", async () => {
    const platform = new FakePlatformRuntime("fake", workspaceRoot);
    const path = `${workspaceRoot}/app.ts`;
    await platform.writeFile(path, "// TODO first\nexport function run() {}\n");
    const service = new DeterministicCodeIntelligenceService(platform);
    assert.equal((await service.diagnostics(workspaceRoot)).length, 1);

    await platform.writeFile(path, "export function run() {}\n");
    await service.invalidate(path);
    assert.equal((await service.diagnostics(workspaceRoot)).length, 0);
  });

  it("keeps null provider deterministic and unavailable", async () => {
    const service = new NullCodeIntelligenceService();
    assert.equal((await service.status()).status, "unavailable");
    assert.equal((await service.contextNodes({ sessionId: asId<"session">("session-null-ci"), root: workspaceRoot })).value?.nodes.length, 0);
  });
});
