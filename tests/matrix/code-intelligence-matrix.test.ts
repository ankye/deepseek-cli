import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeterministicCodeIntelligenceService } from "@deepseek/code-intelligence";
import { createFakePlatformMatrix } from "@deepseek/testing-regression";

describe("code intelligence platform matrix", () => {
  it("indexes supported files without live IDE dependencies across fake platforms", async () => {
    for (const platform of createFakePlatformMatrix()) {
      if ((await platform.descriptor()).sandbox.filesystem.readOnly) continue;
      const root = platform.os === "windows" ? "C:/workspace/windows" : `/workspace/${platform.environmentKind}`;
      await platform.writeFile(`${root}/app.ts`, `// TODO ${platform.environmentKind}\nexport function run() {}\n`);
      const service = new DeterministicCodeIntelligenceService(platform, { maxFiles: 10 });
      const indexed = await service.index(root);

      assert.equal(indexed.ok, true);
      assert.equal(indexed.value?.metadata.provider.provider, "local-analyzer");
      assert.equal(indexed.value?.diagnostics.some((entry) => entry.code === "CODE_TODO"), true);
      assert.equal(indexed.value?.symbols.some((entry) => entry.name === "run"), true);
    }
  });
});
