import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DeepSeekOpenAIProvider,
  FixtureModelProviderTransport,
  StaticCredentialProvider,
  defaultDeepSeekProfile
} from "../src/index.js";
import type { ModelChatMessage } from "@deepseek/platform-contracts";

describe("DeepSeek thinking-mode reasoning continuation serialization", () => {
  it("echoes reasoningContent as reasoning_content on the outgoing assistant message", () => {
    const gateway = new DeepSeekOpenAIProvider({
      transport: new FixtureModelProviderTransport([]),
      credentials: new StaticCredentialProvider("sk-test")
    });
    const assistantMessage: ModelChatMessage = {
      role: "assistant",
      content: "",
      reasoningContent: "Let me plan the read carefully.",
      reasoningRedaction: { class: "internal" },
      toolCalls: [
        { id: "call-1", name: "core_file_read", input: { path: "README.md" } }
      ]
    };
    const request = gateway.buildProviderRequest({
      profile: defaultDeepSeekProfile,
      prompt: "summarize readme",
      messages: [
        { role: "user", content: "summarize readme" },
        assistantMessage
      ]
    }, "sk-test");
    const body = request.body as { messages: readonly Record<string, unknown>[] };
    const assistant = body.messages[1];
    assert.equal(assistant?.role, "assistant");
    assert.equal(assistant?.reasoning_content, "Let me plan the read carefully.");
    assert.ok(Array.isArray(assistant?.tool_calls));
  });

  it("omits reasoning_content entirely when reasoningContent is missing", () => {
    const gateway = new DeepSeekOpenAIProvider({
      transport: new FixtureModelProviderTransport([]),
      credentials: new StaticCredentialProvider("sk-test")
    });
    const request = gateway.buildProviderRequest({
      profile: defaultDeepSeekProfile,
      prompt: "plain",
      messages: [
        { role: "user", content: "plain" },
        { role: "assistant", content: "ok" }
      ]
    }, "sk-test");
    const body = request.body as { messages: readonly Record<string, unknown>[] };
    const assistant = body.messages[1];
    assert.equal("reasoning_content" in (assistant ?? {}), false);
  });

  it("omits reasoning_content when reasoningContent is the empty string", () => {
    const gateway = new DeepSeekOpenAIProvider({
      transport: new FixtureModelProviderTransport([]),
      credentials: new StaticCredentialProvider("sk-test")
    });
    const request = gateway.buildProviderRequest({
      profile: defaultDeepSeekProfile,
      prompt: "plain",
      messages: [
        { role: "user", content: "plain" },
        { role: "assistant", content: "ok", reasoningContent: "" }
      ]
    }, "sk-test");
    const body = request.body as { messages: readonly Record<string, unknown>[] };
    const assistant = body.messages[1];
    assert.equal("reasoning_content" in (assistant ?? {}), false);
  });
});
