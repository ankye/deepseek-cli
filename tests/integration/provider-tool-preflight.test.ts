import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeepSeekOpenAIProvider, FixtureModelProviderTransport, StaticCredentialProvider, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { DeterministicToolIntentPreflight } from "@deepseek/tool-intent-preflight";
import { asId, type ModelStreamEvent } from "@deepseek/platform-contracts";

async function collect(iterable: AsyncIterable<ModelStreamEvent>): Promise<readonly ModelStreamEvent[]> {
  const events: ModelStreamEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

describe("provider tool intent preflight integration", () => {
  it("repairs normalized provider tool-call paths before governed execution", async () => {
    const provider = new DeepSeekOpenAIProvider({
      credentials: new StaticCredentialProvider("sk-test"),
      transport: new FixtureModelProviderTransport([
        {
          data: {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      id: "call-read",
                      function: {
                        name: "read_file",
                        arguments: "{\"path\":\"./src\\\\packages\\\\model-gateway\\\\src\\\\index.ts\"}"
                      }
                    }
                  ]
                },
                finish_reason: "tool_calls"
              }
            ]
          }
        }
      ])
    });
    const toolCall = (await collect(provider.stream({ profile: defaultDeepSeekProfile, prompt: "read file" }))).find((event) => event.kind === "tool-call");
    assert.equal(toolCall?.kind, "tool-call");

    const preflight = new DeterministicToolIntentPreflight();
    const result = await preflight.check({
      intent: {
        ...(toolCall?.kind === "tool-call" && toolCall.id ? { toolCallId: toolCall.id } : {}),
        name: toolCall?.kind === "tool-call" ? toolCall.name : "",
        input: toolCall?.kind === "tool-call" ? toolCall.input : {},
        source: "model"
      },
      providerId: asId<"modelProvider">("provider-deepseek"),
      workspaceRoot: "/repo",
      platform: "linux",
      modelVisibleCapabilities: [asId<"capability">("read_file")]
    });

    assert.equal(result.status, "repaired");
    assert.deepEqual(result.repaired?.input, { path: "/repo/src/packages/model-gateway/src/index.ts" });
    assert.equal(result.repairs.some((repair) => repair.kind === "path-separator-normalized"), true);
  });
});
