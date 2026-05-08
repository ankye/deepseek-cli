import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeepSeekOpenAIProvider, FixtureModelProviderTransport, StaticCredentialProvider, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import type { ModelStreamEvent } from "@deepseek/platform-contracts";

async function collect(iterable: AsyncIterable<ModelStreamEvent>): Promise<readonly ModelStreamEvent[]> {
  const events: ModelStreamEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

function normalize(events: readonly ModelStreamEvent[]): readonly unknown[] {
  return events.map((event) => {
    if (event.kind === "reasoning") {
      return { kind: event.kind, text: event.text, redaction: event.redaction.class, provider: event.provider?.provider };
    }
    if (event.kind === "delta") {
      return { kind: event.kind, text: event.text, provider: event.provider?.provider };
    }
    if (event.kind === "tool-call") {
      return { kind: event.kind, id: event.id, name: event.name, input: event.input, provider: event.provider?.provider };
    }
    if (event.kind === "finish") {
      return { kind: event.kind, reason: event.reason, provider: event.provider?.provider };
    }
    if (event.kind === "usage") {
      return { kind: event.kind, inputTokens: event.inputTokens, outputTokens: event.outputTokens, reasoningTokens: event.metadata?.reasoningTokens, cache: event.metadata?.cache };
    }
    if (event.kind === "error") {
      return { kind: event.kind, code: event.error.code, retryable: event.error.retryable };
    }
    return { kind: event.kind, provider: event.provider?.provider };
  });
}

describe("DeepSeek provider golden trace", () => {
  it("replays normalized provider event order from fake transport", async () => {
    const provider = new DeepSeekOpenAIProvider({
      credentials: new StaticCredentialProvider("sk-test"),
      transport: new FixtureModelProviderTransport([
        {
          data: {
            id: "chatcmpl-golden",
            choices: [
              {
                delta: {
                  reasoning_content: "Plan the answer.",
                  content: "Result",
                  tool_calls: [
                    {
                      id: "call-golden",
                      function: {
                        name: "inspect",
                        arguments: "{\"target\":\"src\"}"
                      }
                    }
                  ]
                },
                finish_reason: "tool_calls"
              }
            ],
            usage: {
              prompt_tokens: 12,
              completion_tokens: 8,
              prompt_cache_hit_tokens: 5,
              prompt_cache_miss_tokens: 7,
              completion_tokens_details: {
                reasoning_tokens: 3
              }
            }
          }
        }
      ])
    });

    const trace = normalize(await collect(provider.stream({ profile: defaultDeepSeekProfile, prompt: "golden" })));

    assert.deepEqual(trace, [
      { kind: "reasoning", text: "Plan the answer.", redaction: "internal", provider: "deepseek" },
      { kind: "delta", text: "Result", provider: "deepseek" },
      { kind: "tool-call", id: "call-golden", name: "inspect", input: { target: "src" }, provider: "deepseek" },
      { kind: "finish", reason: "tool-call", provider: "deepseek" },
      { kind: "usage", inputTokens: 12, outputTokens: 8, reasoningTokens: 3, cache: { hitTokens: 5, missTokens: 7 } },
      { kind: "done", provider: "deepseek" }
    ]);
  });
});
