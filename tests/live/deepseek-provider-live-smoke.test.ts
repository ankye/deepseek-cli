import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DeepSeekOpenAIProvider,
  OpenAIModelProviderTransport,
  defaultDeepSeekProfile,
  StaticCredentialProvider
} from "@deepseek/model-gateway";
import type { ModelStreamEvent } from "@deepseek/platform-contracts";

async function collect(iterable: AsyncIterable<ModelStreamEvent>): Promise<readonly ModelStreamEvent[]> {
  const events: ModelStreamEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

function redactEvents(events: readonly ModelStreamEvent[]): readonly unknown[] {
  return events.map((event) => {
    if (event.kind === "delta") return { kind: event.kind, textLength: event.text.length, provider: event.provider?.provider, model: event.provider?.model };
    if (event.kind === "reasoning") return { kind: event.kind, textLength: event.text.length, redaction: event.redaction.class, provider: event.provider?.provider };
    if (event.kind === "usage") return { kind: event.kind, inputTokens: event.inputTokens, outputTokens: event.outputTokens };
    if (event.kind === "finish") return { kind: event.kind, reason: event.reason, provider: event.provider?.provider };
    if (event.kind === "error") return { kind: event.kind, code: event.error.code, retryable: event.error.retryable };
    return { kind: event.kind, provider: event.provider?.provider };
  });
}

function loadLiveToken(): string | undefined {
  return firstNonEmpty(process.env.DEEPSEEK_API_KEY, process.env.DEEPSEEK_TOKEN, readEnvFile(".env").DEEPSEEK_API_KEY, readEnvFile(".env").DEEPSEEK_TOKEN);
}

function readEnvFile(filePath: string): Record<string, string> {
  let content = "";
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return {};
  }

  const values: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    values[key] = unquoteEnvValue(rawValue);
  }
  return values;
}

function unquoteEnvValue(value: string): string {
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function firstNonEmpty(...values: readonly (string | undefined)[]): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

describe("DeepSeek live provider smoke", () => {
  it("streams a real response only when explicitly enabled", async (testContext) => {
    if (process.env.DEEPSEEK_LIVE_TESTS !== "1") {
      testContext.skip("Set DEEPSEEK_LIVE_TESTS=1 to run live DeepSeek provider smoke.");
      return;
    }

    const token = loadLiveToken();
    if (!token) {
      testContext.skip("Set DEEPSEEK_API_KEY or DEEPSEEK_TOKEN in environment or .env to run live smoke.");
      return;
    }

    const provider = new DeepSeekOpenAIProvider({
      credentials: new StaticCredentialProvider(token),
      transport: new OpenAIModelProviderTransport(),
      timeoutMs: 90000
    });

    const events = await collect(provider.stream({
      profile: {
        ...defaultDeepSeekProfile,
        providerOptions: {
          max_tokens: 8,
          stream_options: { include_usage: true }
        }
      },
      prompt: "Reply with exactly this text: ok",
      reasoning: { enabled: false }
    }));
    const redacted = redactEvents(events);

    assert.equal(events.some((event) => event.kind === "delta" && event.text.trim().length > 0), true, JSON.stringify(redacted));
    assert.equal(events.some((event) => event.kind === "finish" || event.kind === "done"), true, JSON.stringify(redacted));
    assert.equal(events.some((event) => event.kind === "error"), false, JSON.stringify(redacted));
    assert.equal(JSON.stringify(redacted).includes("Bearer "), false);
    assert.equal(JSON.stringify(redacted).includes(token), false);
  });
});
