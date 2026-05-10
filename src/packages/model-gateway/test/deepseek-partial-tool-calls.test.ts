import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DeepSeekOpenAIProvider,
  FixtureModelProviderTransport,
  StaticCredentialProvider,
  createToolCallAccumulator,
  defaultDeepSeekProfile,
  formatToolChoice,
  normalizeDeepSeekChunk
} from "../src/index.js";
import type { JsonObject, ModelProviderEventMetadata, ModelProviderResponseChunk, ModelStreamEvent } from "@deepseek/platform-contracts";

const provider: ModelProviderEventMetadata = {
  provider: "deepseek",
  protocol: "openai-chat-completions",
  model: "deepseek-v4-flash"
};

async function collect(iterable: AsyncIterable<ModelStreamEvent>): Promise<readonly ModelStreamEvent[]> {
  const events: ModelStreamEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

function deltaChunk(toolCall: JsonObject): ModelProviderResponseChunk {
  return {
    data: {
      choices: [
        {
          delta: { tool_calls: [toolCall] }
        }
      ]
    }
  };
}

function finishChunk(): ModelProviderResponseChunk {
  return {
    data: {
      choices: [
        {
          delta: {},
          finish_reason: "tool_calls"
        }
      ]
    }
  };
}

describe("DeepSeek partial tool-call normalization", () => {
  it("assembles a tool call whose arguments span multiple chunks", async () => {
    const transport = new FixtureModelProviderTransport([
      deltaChunk({ index: 0, id: "call-partial", type: "function", function: { name: "core.file.read", arguments: "{\"pa" } }),
      deltaChunk({ index: 0, function: { arguments: "th\":\"READ" } }),
      deltaChunk({ index: 0, function: { arguments: "ME.md\"}" } }),
      finishChunk()
    ]);
    const gateway = new DeepSeekOpenAIProvider({ transport, credentials: new StaticCredentialProvider("sk-test") });
    const events = await collect(gateway.stream({ profile: defaultDeepSeekProfile, prompt: "read readme" }));
    const toolEvents = events.filter((event) => event.kind === "tool-call");
    assert.equal(toolEvents.length, 1, JSON.stringify(events));
    const [toolEvent] = toolEvents;
    assert.equal(toolEvent?.kind === "tool-call" ? toolEvent.id : "", "call-partial");
    assert.equal(toolEvent?.kind === "tool-call" ? toolEvent.name : "", "core.file.read");
    assert.deepEqual(toolEvent?.kind === "tool-call" ? toolEvent.input : {}, { path: "README.md" });
    const kinds = events.map((event) => event.kind);
    assert.equal(kinds.indexOf("tool-call") < kinds.indexOf("finish"), true, kinds.join(","));
  });

  it("captures two interleaved tool calls by index without mixing arguments", async () => {
    const transport = new FixtureModelProviderTransport([
      deltaChunk({ index: 0, id: "call-a", type: "function", function: { name: "core.file.read", arguments: "{\"path\":\"" } }),
      deltaChunk({ index: 1, id: "call-b", type: "function", function: { name: "core.file.list", arguments: "{\"pattern\":\"" } }),
      deltaChunk({ index: 0, function: { arguments: "a.txt\"}" } }),
      deltaChunk({ index: 1, function: { arguments: "**/*.ts\"}" } }),
      finishChunk()
    ]);
    const gateway = new DeepSeekOpenAIProvider({ transport, credentials: new StaticCredentialProvider("sk-test") });
    const events = await collect(gateway.stream({ profile: defaultDeepSeekProfile, prompt: "two tools" }));
    const toolEvents = events.filter((event) => event.kind === "tool-call");
    assert.equal(toolEvents.length, 2);
    const a = toolEvents.find((event) => event.kind === "tool-call" && event.id === "call-a");
    const b = toolEvents.find((event) => event.kind === "tool-call" && event.id === "call-b");
    assert.deepEqual(a?.kind === "tool-call" ? a.input : {}, { path: "a.txt" });
    assert.deepEqual(b?.kind === "tool-call" ? b.input : {}, { pattern: "**/*.ts" });
  });

  it("preserves raw arguments when the streamed JSON never parses", async () => {
    const transport = new FixtureModelProviderTransport([
      deltaChunk({ index: 0, id: "call-bad", type: "function", function: { name: "core.file.read", arguments: "{not-json" } }),
      finishChunk()
    ]);
    const gateway = new DeepSeekOpenAIProvider({ transport, credentials: new StaticCredentialProvider("sk-test") });
    const events = await collect(gateway.stream({ profile: defaultDeepSeekProfile, prompt: "broken json" }));
    const toolEvent = events.find((event) => event.kind === "tool-call");
    assert.equal(toolEvent?.kind === "tool-call" ? toolEvent.input.raw : "", "{not-json");
  });

  it("flushes pending tool calls even when finish_reason is missing", () => {
    const accumulator = createToolCallAccumulator();
    normalizeDeepSeekChunk(deltaChunk({ index: 0, id: "call-hanging", function: { name: "core.file.read", arguments: "{\"path\":\"x.md\"}" } }), provider, accumulator);
    const flushed = accumulator.flush(provider);
    assert.equal(flushed.length, 1);
    assert.equal(flushed[0]?.kind === "tool-call" ? flushed[0].name : "", "core.file.read");
  });

  it("formats tool_choice into OpenAI chat-completions shape", () => {
    assert.equal(formatToolChoice("auto"), "auto");
    assert.equal(formatToolChoice("required"), "required");
    assert.equal(formatToolChoice("none"), "none");
    assert.deepEqual(formatToolChoice({ type: "function", name: "core.file.read" }), {
      type: "function",
      function: { name: "core.file.read" }
    });
  });

  it("includes tool_choice in the built provider request body when provided", () => {
    const gateway = new DeepSeekOpenAIProvider({ transport: new FixtureModelProviderTransport([]), credentials: new StaticCredentialProvider("sk-test") });
    const request = gateway.buildProviderRequest({
      profile: defaultDeepSeekProfile,
      prompt: "choose one tool",
      tools: [{ type: "function", function: { name: "core.file.read", parameters: { type: "object" } } }],
      toolChoice: { type: "function", name: "core.file.read" }
    }, "sk-test");
    const body = request.body as Record<string, unknown>;
    assert.deepEqual(body.tool_choice, { type: "function", function: { name: "core.file.read" } });
  });

  it("omits tool_choice when not specified", () => {
    const gateway = new DeepSeekOpenAIProvider({ transport: new FixtureModelProviderTransport([]), credentials: new StaticCredentialProvider("sk-test") });
    const request = gateway.buildProviderRequest({
      profile: defaultDeepSeekProfile,
      prompt: "free form"
    }, "sk-test");
    const body = request.body as Record<string, unknown>;
    assert.equal("tool_choice" in body, false);
  });
});
