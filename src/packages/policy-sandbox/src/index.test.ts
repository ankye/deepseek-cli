import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PolicyRequest, SandboxCapabilityMatrix } from "@deepseek/platform-contracts";
import {
  analyzeResourceScope,
  classifySecretText,
  createSandboxRequirement,
  createSecretRedactionDecision,
  redactJsonSecrets,
  redactSecretText,
  selectSandboxDecision
} from "./index.js";

describe("secret and sandbox policy helpers", () => {
  it("classifies and redacts common secret fixtures deterministically", () => {
    const fixtures = [
      ["sk-live-1234567890", "api-key"],
      ["ds-1234567890abcdef", "api-key"],
      ["deepseek-1234567890abcdef12345678", "api-key"],
      ["Authorization: Bearer abcdefghijklmnop", "bearer-token"],
      ["-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----", "private-key"],
      ["DEEPSEEK_API_KEY=secret-value", "env-credential"],
      ["credentialRef:deepseek/default", "credential-ref"]
    ] as const;

    for (const [text, kind] of fixtures) {
      const classification = classifySecretText(text);
      assert.equal(classification.detected, true);
      assert.equal(classification.kind, kind);
      assert.equal(redactSecretText(text).includes("secret-value"), false);
    }
  });

  it("does not redact provider model identifiers as api keys", () => {
    const model = "deepseek-v4-flash";

    assert.equal(classifySecretText(model).detected, false);
    assert.equal(redactSecretText(model), model);
    assert.deepEqual(redactJsonSecrets({ model }), { model });
  });

  it("redacts nested JSON values and credential-like fields", () => {
    const redacted = redactJsonSecrets({
      apiKey: "plain-value",
      nested: { token: "another-value", note: "safe text" },
      output: "Bearer abcdefghijklmnop"
    }) as { apiKey?: string; nested?: { token?: string; note?: string }; output?: string };

    assert.equal(redacted.apiKey, "[REDACTED:secret]");
    assert.equal(redacted.nested?.token, "[REDACTED:secret]");
    assert.equal(redacted.nested?.note, "safe text");
    assert.equal(redacted.output, "[REDACTED:bearer-token]");
  });

  it("selects deterministic sandbox decisions for degraded platform states", async () => {
    const capabilities: SandboxCapabilityMatrix = {
      schemaVersion: "1.0.0",
      filesystem: { read: true, write: false, readOnly: true, traversalPolicy: "workspace-root", rollback: false },
      processExecution: { execute: true, providerStatus: "available" },
      shell: { execute: false, profile: "none", providerStatus: "unavailable" },
      network: { access: true, providerStatus: "available", hostScopes: [] },
      environment: { access: "scoped" },
      native: { access: false, providerStatuses: {} },
      secureStorage: { status: "degraded", scopedReferences: true },
      degraded: true,
      degradedReasons: ["FILESYSTEM_READ_ONLY"],
      redaction: { class: "internal" }
    };
    const resourceScope = analyzeResourceScope({ path: "a.txt", workspaceRoot: "/workspace" }, "write");
    const request: PolicyRequest = {
      subject: "unit",
      action: "execute:write",
      resource: "core.file.write",
      metadata: {
        sideEffect: "write",
        timeoutMs: 30_000,
        permissions: ["workspace:write"]
      },
      platform: {
        descriptor: { sandbox: capabilities, degradedReasons: capabilities.degradedReasons } as never,
        sandboxCapabilities: capabilities,
        resourceLocks: [],
        timeoutMs: 30_000,
        environmentScope: "scoped",
        redaction: { class: "internal" }
      },
      secret: createSecretRedactionDecision("", { class: "public" }),
      resourceScope,
      sandbox: createSandboxRequirement({ sideEffect: "write", resourceScope, timeoutMs: 30_000, permissions: ["workspace:write"] })
    };

    const decision = selectSandboxDecision(request);
    assert.equal(decision.action, "deny");
    assert.equal(decision.reasonCodes.includes("filesystem.read-only"), true);
  });

  it("rewrites raw secret exposure before execution", () => {
    const resourceScope = analyzeResourceScope({ prompt: "sk-live-1234567890" }, "none");
    const decision = selectSandboxDecision({
      subject: "unit",
      action: "execute:echo",
      resource: "runtime.echo",
      metadata: { sideEffect: "none", timeoutMs: 30_000 },
      secret: createSecretRedactionDecision({ prompt: "sk-live-1234567890" }),
      resourceScope,
      sandbox: createSandboxRequirement({ sideEffect: "none", resourceScope, timeoutMs: 30_000, permissions: [] })
    });

    assert.equal(decision.action, "rewrite");
    assert.equal(decision.reasonCodes.includes("secret.raw-exposure"), true);
  });
});
