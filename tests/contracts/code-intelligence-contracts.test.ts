import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { CODE_INTELLIGENCE_SCHEMA_VERSION, asId, type CodeIntelligenceIndexResult } from "@deepseek/platform-contracts";
import { DeterministicCodeIntelligenceService } from "@deepseek/code-intelligence";

describe("code intelligence contracts", () => {
  it("emits versioned serializable analyzer DTOs", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    await platform.writeFile("/workspace/app.ts", "export class Runner {}\nRunner;\n");
    const service = new DeterministicCodeIntelligenceService(platform);
    const indexed = await service.index("/workspace");
    assert.equal(indexed.ok, true);
    const value: CodeIntelligenceIndexResult = indexed.value!;

    assert.equal(value.schemaVersion, CODE_INTELLIGENCE_SCHEMA_VERSION);
    assert.equal(value.metadata.schemaVersion, CODE_INTELLIGENCE_SCHEMA_VERSION);
    assert.equal(value.metadata.provider.provider, "local-analyzer");
    assert.equal(value.symbols[0]?.schemaVersion, CODE_INTELLIGENCE_SCHEMA_VERSION);
    assert.doesNotThrow(() => JSON.stringify(value));
  });

  it("projects host-neutral context graph nodes", async () => {
    const platform = new FakePlatformRuntime("fake", "/workspace");
    await platform.writeFile("/workspace/app.ts", "// FIXME fix contract\nexport const answer = 42;\n");
    const service = new DeterministicCodeIntelligenceService(platform);
    const result = await service.contextNodes({ sessionId: asId<"session">("session-ci-contract"), root: "/workspace" });

    assert.equal(result.ok, true);
    assert.equal(result.value?.nodes[0]?.source, "code-intelligence");
    assert.equal(result.value?.nodes[0]?.compatibility.schemaVersion, CODE_INTELLIGENCE_SCHEMA_VERSION);
    assert.equal(result.value?.nodes[0]?.redaction.fields?.includes("content"), true);
  });
});
