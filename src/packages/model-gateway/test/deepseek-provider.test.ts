import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createModelGatewayFamilyCapabilities,
  DeepSeekOpenAIProvider,
  DeterministicMockModelGateway,
  FetchModelProviderTransport,
  FixtureModelProviderTransport,
  StaticCredentialProvider,
  defaultDeepSeekProfile,
  normalizeDeepSeekChunk
} from "../src/index.js";
import { asId } from "@deepseek/platform-contracts";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import type { CredentialRef, ModelRequest, ModelStreamEvent } from "@deepseek/platform-contracts";

async function collect(iterable: AsyncIterable<ModelStreamEvent>): Promise<readonly ModelStreamEvent[]> {
  const events: ModelStreamEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

describe("DeepSeek OpenAI provider", () => {
  it("fails closed when transport is not configured", async () => {
    const provider = new DeepSeekOpenAIProvider({ credentials: new StaticCredentialProvider("sk-test") });
    const events = await collect(provider.stream({ profile: defaultDeepSeekProfile, prompt: "hello" }));

    assert.equal(events.length, 1);
    assert.equal(events[0]?.kind, "error");
    assert.equal(events[0]?.kind === "error" ? events[0].error.code : "", "PROVIDER_TRANSPORT_NOT_CONFIGURED");
  });

  it("fails closed when credential is missing", async () => {
    const transport = new FixtureModelProviderTransport([]);
    const provider = new DeepSeekOpenAIProvider({ transport });
    const events = await collect(provider.stream({ profile: defaultDeepSeekProfile, prompt: "hello" }));

    assert.equal(events.length, 1);
    assert.equal(events[0]?.kind, "error");
    assert.equal(events[0]?.kind === "error" ? events[0].error.code : "", "PROVIDER_CREDENTIAL_MISSING");
    assert.equal(transport.requests.length, 0);
  });

  it("builds a DeepSeek chat-completions request with injected credential and options", async () => {
    const transport = new FixtureModelProviderTransport([]);
    const provider = new DeepSeekOpenAIProvider({ transport, credentials: new StaticCredentialProvider("sk-test"), timeoutMs: 1234 });
    const events = await collect(provider.stream({
      profile: { ...defaultDeepSeekProfile, temperature: 0.2 },
      prompt: "write tests",
      reasoning: { enabled: true, effort: "high" },
      tools: [
        {
          type: "function",
          function: {
            name: "search",
            parameters: { type: "object" }
          }
        }
      ]
    }));

    assert.equal(events.at(-1)?.kind, "done");
    assert.equal(transport.requests.length, 1);
    const request = transport.requests[0];
    assert.equal(request?.url, "https://api.deepseek.com/chat/completions");
    assert.equal(request?.method, "POST");
    assert.equal(request?.headers.authorization, "Bearer sk-test");
    assert.equal(request?.timeoutMs, 1234);
    assert.equal(request?.body.model, "deepseek-v4-flash");
    assert.equal(request?.body.temperature, 0.2);
    assert.equal(Array.isArray(request?.body.messages), true);
    assert.equal((request?.body.messages as readonly { readonly content: string }[])[0]?.content, "write tests");
    assert.equal(Array.isArray(request?.body.tools), true);
    assert.deepEqual(request?.body.thinking, { type: "enabled" });
    assert.equal(request?.body.reasoning_effort, "high");
  });

  it("preserves provider tool names and downgrades unpaired internal tool feedback", async () => {
    const transport = new FixtureModelProviderTransport([]);
    const provider = new DeepSeekOpenAIProvider({ transport, credentials: new StaticCredentialProvider("sk-test") });
    await collect(provider.stream({
      profile: defaultDeepSeekProfile,
      prompt: "read",
      messages: [
        { role: "user", content: "read" },
        { role: "assistant", content: "", toolCalls: [{ id: "call-1", name: "core_file_read", input: { path: "README.md" } }] },
        { role: "tool", content: "read result", toolCallId: "call-1", toolName: "core.file.read" },
        { role: "tool", content: "repair feedback", toolCallId: "repair-1", toolName: "agent.self-repair" }
      ]
    }));

    const messages = transport.requests[0]?.body.messages as readonly {
      readonly role: string;
      readonly content?: string | null;
      readonly tool_call_id?: string;
      readonly tool_calls?: readonly { readonly function?: { readonly name?: string } }[];
    }[] | undefined;
    assert.equal(messages?.[1]?.role, "assistant");
    assert.equal(messages?.[1]?.content, null);
    assert.equal(messages?.[1]?.tool_calls?.[0]?.function?.name, "core_file_read");
    assert.equal(messages?.[2]?.role, "tool");
    assert.equal(messages?.[2]?.tool_call_id, "call-1");
    assert.equal(messages?.[3]?.role, "user");
    assert.match(messages?.[3]?.content ?? "", /Internal tool feedback \(agent\.self-repair\)/);
  });

  it("normalizes reasoning, text, tool calls, usage/cache, finish, and done", async () => {
    const transport = new FixtureModelProviderTransport([
      {
        data: {
          id: "req-1",
          choices: [
            {
              delta: {
                reasoning_content: "I should inspect context.",
                content: "Done",
                tool_calls: [
                  {
                    id: "call-1",
                    type: "function",
                    function: {
                      name: "read_file",
                      arguments: "{\"path\":\"package.json\"}"
                    }
                  }
                ]
              },
              finish_reason: "tool_calls"
            }
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            prompt_cache_hit_tokens: 7,
            prompt_cache_miss_tokens: 3,
            completion_tokens_details: {
              reasoning_tokens: 2
            }
          }
        }
      }
    ]);
    const provider = new DeepSeekOpenAIProvider({ transport, credentials: new StaticCredentialProvider("sk-test") });
    const events = await collect(provider.stream({ profile: defaultDeepSeekProfile, prompt: "hello" }));

    assert.deepEqual(events.map((event) => event.kind), ["reasoning", "delta", "tool-call", "finish", "usage", "done"]);
    const reasoning = events[0];
    assert.equal(reasoning?.kind === "reasoning" ? reasoning.text : "", "I should inspect context.");
    assert.equal(reasoning?.kind === "reasoning" ? reasoning.redaction.class : "", "internal");
    const delta = events[1];
    assert.equal(delta?.kind === "delta" ? delta.text : "", "Done");
    const toolCall = events[2];
    assert.equal(toolCall?.kind === "tool-call" ? toolCall.id : "", "call-1");
    assert.equal(toolCall?.kind === "tool-call" ? toolCall.name : "", "read_file");
    assert.deepEqual(toolCall?.kind === "tool-call" ? toolCall.input : {}, { path: "package.json" });
    const finish = events[3];
    assert.equal(finish?.kind === "finish" ? finish.reason : "", "tool-call");
    const usage = events[4];
    assert.equal(usage?.kind === "usage" ? usage.inputTokens : 0, 10);
    assert.equal(usage?.kind === "usage" ? usage.outputTokens : 0, 5);
    assert.deepEqual(usage?.kind === "usage" ? usage.metadata?.cache : undefined, { hitTokens: 7, missTokens: 3 });
    assert.equal(usage?.kind === "usage" ? usage.metadata?.reasoningTokens : undefined, 2);
    assert.equal(events.every((event) => event.kind !== "tool-call" || event.provider?.provider === "deepseek"), true);
  });

  it("normalizes provider error chunks and transport failures", async () => {
    const errorEvents = normalizeDeepSeekChunk(
      {
        data: {
          error: {
            code: "invalid_request_error",
            message: "bad request"
          }
        }
      },
      { provider: "deepseek", protocol: "openai-chat-completions", model: "deepseek-v4-flash" }
    );
    assert.equal(errorEvents[0]?.kind, "error");
    assert.equal(errorEvents[0]?.kind === "error" ? errorEvents[0].error.code : "", "invalid_request_error");

    const provider = new DeepSeekOpenAIProvider({
      transport: new FixtureModelProviderTransport([], new Error("network down")),
      credentials: new StaticCredentialProvider("sk-test")
    });
    const events = await collect(provider.stream({ profile: defaultDeepSeekProfile, prompt: "hello" }));
    assert.equal(events[0]?.kind, "error");
    assert.equal(events[0]?.kind === "error" ? events[0].error.code : "", "PROVIDER_TRANSPORT_FAILED");
  });

  it("parses OpenAI-style SSE chunks through fetch transport", async () => {
    const originalFetch = globalThis.fetch;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode("data: {\"choices\":[{\"delta\":{\"content\":\"Hi\"}}]}\n\n"));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    });
    globalThis.fetch = async () => new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
    try {
      const transport = new FetchModelProviderTransport();
      const chunks = [];
      for await (const chunk of transport.stream({
        url: "https://api.deepseek.com/chat/completions",
        method: "POST",
        headers: { authorization: "Bearer sk-test" },
        body: { model: "deepseek-v4-flash", messages: [] }
      })) {
        chunks.push(chunk);
      }

      assert.deepEqual(chunks, [{ data: { choices: [{ delta: { content: "Hi" } }] } }]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("normalizes OpenAI SDK non-stream completion shape", () => {
    const events = normalizeDeepSeekChunk(
      {
        data: {
          id: "chatcmpl-sdk",
          choices: [
            {
              message: {
                content: "ok"
              },
              finish_reason: "stop"
            }
          ],
          usage: {
            prompt_tokens: 3,
            completion_tokens: 1
          }
        }
      },
      { provider: "deepseek", protocol: "openai-chat-completions", model: "deepseek-v4-pro" }
    );

    assert.deepEqual(events.map((event) => event.kind), ["delta", "finish", "usage"]);
    assert.equal(events[0]?.kind === "delta" ? events[0].text : "", "ok");
  });

  it("keeps deterministic mock gateway behavior available", async () => {
    const gateway = new DeterministicMockModelGateway();
    const events = await collect(gateway.stream({ profile: defaultDeepSeekProfile, prompt: "hello world" }));

    assert.deepEqual(events.map((event) => event.kind), ["delta", "usage", "finish", "done"]);
    assert.equal(events[1]?.kind === "usage" ? events[1].inputTokens : 0, 2);
  });

  it("passes live verification credential and timeout controls to provider requests", async () => {
    const transport = new FixtureModelProviderTransport([{ data: { choices: [{ delta: { content: "ok" }, finish_reason: "stop" }] } }]);
    const requestedRef = asId<"credentialRef">("credential-deepseek-custom");
    const provider = new DeepSeekOpenAIProvider({
      transport,
      credentials: {
        async resolve(ref: CredentialRef, _request: ModelRequest) {
          return { ref, value: ref === requestedRef ? "sk-custom" : "sk-wrong", redaction: { class: "secret" } };
        }
      }
    });

    const result = await provider.verify?.({ profile: defaultDeepSeekProfile, credentialRef: requestedRef, prompt: "ok", timeoutMs: 4321 });

    assert.equal(result?.ok, true);
    assert.equal(transport.requests[0]?.headers.authorization, "Bearer sk-custom");
    assert.equal(transport.requests[0]?.timeoutMs, 4321);
  });

  it("exposes fake-first web/data and image family capabilities without provider-native claims", async () => {
    const capabilities = createModelGatewayFamilyCapabilities({ maxItems: 3 });
    const registry = new InMemoryCapabilityRegistry();
    for (const capability of capabilities) await registry.register(capability.manifest, capability.execute);

    const media = await registry.listModelVisible({ allowedDomainIds: ["media-images"], allowedProviderSupport: ["fake"] });
    assert.deepEqual(media.map((entry) => entry.toolFamily?.familyId).sort(), ["image.edit", "image.generate", "image.inspect", "image.search-stock"]);

    const extract = await capabilities.find((entry) => entry.manifest.toolFamily?.familyId === "web.extract")?.execute({
      url: "https://example.test",
      html: "<html><title>Docs</title><body><a href=\"/a\">A TOKEN=supersecret</a><p>Hello sk-testsecret</p></body></html>"
    }, {} as never);
    const serializedExtract = JSON.stringify(extract);
    assert.equal(extract?.ok, true);
    assert.equal(serializedExtract.includes("supersecret"), false);
    assert.match(serializedExtract, /REDACTED/);

    const data = await capabilities.find((entry) => entry.manifest.toolFamily?.familyId === "web.data-lookup")?.execute({ namespace: "weather", query: "seattle" }, {} as never);
    assert.equal(data?.value?.noNetwork, true);
    assert.equal((data?.value?.rows as readonly unknown[] | undefined)?.length, 1);

    const image = await capabilities.find((entry) => entry.manifest.toolFamily?.familyId === "image.generate")?.execute({ prompt: "logo", width: 64, height: 32 }, {} as never);
    assert.equal(image?.value?.providerNativeSupport, "unsupported");
    assert.match(String((image?.value?.artifact as { artifactId?: string } | undefined)?.artifactId), /^artifact:image\.generate:/);

    const png1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ";
    const inspect = await capabilities.find((entry) => entry.manifest.toolFamily?.familyId === "image.inspect")?.execute({ bytesBase64: png1x1 }, {} as never);
    assert.equal((inspect?.value?.metadata as { width?: number } | undefined)?.width, 1);
    assert.equal((inspect?.value?.metadata as { height?: number } | undefined)?.height, 1);
  });
});
