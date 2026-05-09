import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeResourceScope, createSandboxRequirement, createSecretRedactionDecision, selectSandboxDecision } from "@deepseek/policy-sandbox";
import { createFakePlatformMatrix } from "@deepseek/testing-regression";

describe("secret sandbox platform matrix", () => {
  it("covers deterministic sandbox decisions across fake platform modes", async () => {
    const decisions: string[] = [];
    for (const platform of createFakePlatformMatrix()) {
      const descriptor = await platform.descriptor();
      const sideEffect = descriptor.sandbox.filesystem.readOnly ? "write" : descriptor.environmentKind === "remote" ? "process" : descriptor.sandbox.network.providerStatus === "unavailable" ? "network" : "read";
      const resourceScope = analyzeResourceScope(
        sideEffect === "process"
          ? { command: "npm", args: ["test"], workspaceRoot: "/workspace", cwd: "." }
          : sideEffect === "write"
            ? { path: "README.md", workspaceRoot: "/workspace" }
            : sideEffect === "network"
              ? { host: "api.deepseek.com" }
              : { path: "README.md", workspaceRoot: "/workspace" },
        sideEffect
      );
      const decision = selectSandboxDecision({
        subject: "matrix",
        action: `execute:${sideEffect}`,
        resource: `matrix.${sideEffect}`,
        metadata: {
          sideEffect,
          timeoutMs: 30_000,
          permissions: sideEffect === "process" ? ["process:test"] : []
        },
        platform: {
          descriptor,
          sandboxCapabilities: descriptor.sandbox,
          resourceLocks: [],
          timeoutMs: 30_000,
          environmentScope: "scoped",
          redaction: { class: "internal" }
        },
        secret: createSecretRedactionDecision("", { class: "public" }),
        resourceScope,
        sandbox: createSandboxRequirement({ sideEffect, resourceScope, timeoutMs: 30_000, permissions: [] })
      });
      decisions.push(`${descriptor.os}:${descriptor.environmentKind}:${descriptor.sandbox.filesystem.readOnly}:${descriptor.sandbox.network.providerStatus}:${decision.action}:${decision.reasonCodes.join("|")}`);
    }

    assert.equal(decisions.some((decision) => decision.includes("filesystem.read-only")), true);
    assert.equal(decisions.some((decision) => decision.includes("process.unavailable")), true);
    assert.equal(decisions.some((decision) => decision.includes("network.unavailable")), true);
    assert.equal(decisions.some((decision) => decision.includes(":allow:")), true);
  });
});
