import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CredentialAuthModelCredentialProvider,
  createDeepSeekCredentialAuthServiceFromEnv,
  deepSeekLiveCredentialProcessEnv
} from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider, OpenAIModelProviderTransport, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";

describe("DeepSeek auth live verification", () => {
  it("verifies live connectivity only when explicitly enabled", async (testContext) => {
    if (process.env.DEEPSEEK_LIVE_AUTH_TESTS !== "1") {
      testContext.skip("Set DEEPSEEK_LIVE_AUTH_TESTS=1 to run live auth verification.");
      return;
    }

    const auth = await createDeepSeekCredentialAuthServiceFromEnv(await deepSeekLiveCredentialProcessEnv(new NodePlatformRuntime()));
    const provider = new DeepSeekOpenAIProvider({
      credentials: new CredentialAuthModelCredentialProvider(auth),
      transport: new OpenAIModelProviderTransport(),
      timeoutMs: 90000
    });

    const result = await provider.verify?.({
      profile: {
        ...defaultDeepSeekProfile,
        providerOptions: {
          max_tokens: 8,
          stream_options: { include_usage: true }
        }
      },
      prompt: "Reply with exactly this text: ok",
      timeoutMs: 90000
    });

    if (!result || result.terminalStatus === "missing-credential") {
      testContext.skip("Set DEEPSEEK_API_KEY or DEEPSEEK_TOKEN to run live auth verification.");
      return;
    }

    assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
    assert.equal(result.eventKinds.length > 0, true);
    assert.equal(JSON.stringify(result).includes("Bearer "), false);
  });
});
