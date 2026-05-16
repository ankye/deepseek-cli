import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CredentialAuthModelCredentialProvider,
  createDeepSeekCredentialAuthServiceFromEnv,
  deepSeekLiveCredentialProcessEnv
} from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider, OpenAIModelProviderTransport, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import type { RuntimeDependencies } from "@deepseek/platform-contracts";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("DeepSeek live agent loop smoke", () => {
  it("runs the runtime-owned agent loop only when explicitly enabled", async (testContext) => {
    if (process.env.DEEPSEEK_LIVE_AGENT_LOOP_TESTS !== "1") {
      testContext.skip("Set DEEPSEEK_LIVE_AGENT_LOOP_TESTS=1 to run live DeepSeek agent-loop smoke.");
      return;
    }

    if (!loadLiveToken()) {
      testContext.skip("Set DEEPSEEK_API_KEY or DEEPSEEK_TOKEN in environment or .env to run live agent-loop smoke.");
      return;
    }

    const credentialAuth = await createDeepSeekCredentialAuthServiceFromEnv(await deepSeekLiveCredentialProcessEnv(new NodePlatformRuntime()));
    const deps: RuntimeDependencies = {
      ...createDeterministicRuntimeDependencies(),
      models: new DeepSeekOpenAIProvider({
        credentials: new CredentialAuthModelCredentialProvider(credentialAuth),
        transport: new OpenAIModelProviderTransport(),
        timeoutMs: 90_000
      })
    };
    await registerRuntimeCoreTools(deps, process.cwd());
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = [];
    for await (const event of runAgentLoop(deps, kernel, {
      prompt: "Reply with exactly this text: ok",
      caller: "live.agent-loop.test",
      workspaceRoot: process.cwd(),
      outputMode: "jsonl",
      profile: {
        ...defaultDeepSeekProfile,
        providerOptions: {
          max_tokens: 16,
          stream_options: { include_usage: true }
        }
      },
      reasoning: { enabled: false },
      live: true,
      timeoutMs: 90_000
    })) {
      events.push(event);
    }
    await kernel.shutdown("live-agent-loop-smoke");

    const redacted = JSON.stringify(events.map((event) => ({
      kind: event.kind,
      provider: typeof event.data.provider === "object" && event.data.provider ? event.data.provider : undefined,
      status: event.data.status,
      error: event.error ? { code: event.error.code, retryable: event.error.retryable } : undefined
    })));
    const token = loadLiveToken();
    assert.equal(events.some((event) => event.kind === "model.delta"), true, redacted);
    assert.equal(events.some((event) => event.kind === "agent.loop.completed"), true, redacted);
    assert.equal(events.some((event) => event.kind === "agent.loop.failed"), false, redacted);
    assert.equal(token ? redacted.includes(token) : false, false);
    assert.equal(redacted.includes("Bearer "), false);
  });
});

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
