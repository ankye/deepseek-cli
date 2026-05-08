import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeepSeekCredentialAuthService, InMemoryCredentialStorageAdapter } from "@deepseek/credential-auth-management";
import { asId } from "@deepseek/platform-contracts";
import type { ConfigDocument, ModelLiveVerificationResult, ReadinessLiveCheckInput } from "@deepseek/platform-contracts";

const fakeSecret = "sk-live-secret-value";

describe("persistent config and auth contracts", () => {
  it("serializes config documents without raw credential fields", () => {
    const document: ConfigDocument = {
      schemaVersion: "1.0.0",
      profile: "default",
      values: { model: "deepseek-v4-flash", credentialRef: asId<"credentialRef">("credential-deepseek-api-key") },
      source: { scope: "workspace", priority: 2, path: "/repo/.deepseek/config.json" },
      redaction: { class: "internal", fields: ["values.*secret*"] },
      migration: { schemaVersion: "1.0.0" }
    };

    assert.equal(JSON.stringify(document).includes(fakeSecret), false);
    assert.equal(document.values.credentialRef, "credential-deepseek-api-key");
  });

  it("stores credential references while keeping raw secret out of reference JSON", async () => {
    const service = new DeepSeekCredentialAuthService(new InMemoryCredentialStorageAdapter());
    const stored = await service.storeDeepSeekCredential({ value: fakeSecret, source: "test" });

    assert.equal(stored.ok, true);
    assert.equal(stored.value?.available, true);
    assert.equal(JSON.stringify(stored).includes(fakeSecret), false);
  });

  it("defines readiness live-check and live verification result shapes", () => {
    const input: ReadinessLiveCheckInput = { enabled: true, timeoutMs: 1000 };
    const result: ModelLiveVerificationResult = {
      ok: true,
      provider: { provider: "deepseek", protocol: "openai-chat-completions", model: "deepseek-v4-flash" },
      reachable: true,
      terminalStatus: "completed",
      eventKinds: ["delta", "finish", "done"],
      diagnostics: [],
      redaction: { class: "internal" }
    };

    assert.equal(input.enabled, true);
    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(result).includes(fakeSecret), false);
  });
});
