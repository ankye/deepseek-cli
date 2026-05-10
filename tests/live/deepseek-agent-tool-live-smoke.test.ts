import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CredentialAuthModelCredentialProvider,
  createDeepSeekCredentialAuthServiceFromEnv
} from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider, OpenAIModelProviderTransport, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import type { RuntimeDependencies, ToolResultFeedback } from "@deepseek/platform-contracts";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

describe("DeepSeek live agent tool-loop smoke", () => {
  it("runs a live DeepSeek tool turn only when explicitly enabled", async (testContext) => {
    if (process.env.DEEPSEEK_LIVE_AGENT_TOOL_TESTS !== "1") {
      testContext.skip("Set DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 to run live DeepSeek agent-tool smoke.");
      return;
    }

    if (!loadLiveToken()) {
      testContext.skip("Set DEEPSEEK_API_KEY or DEEPSEEK_TOKEN in environment or .env to run live agent-tool smoke.");
      return;
    }

    const credentialAuth = await createDeepSeekCredentialAuthServiceFromEnv();
    const deps: RuntimeDependencies = {
      ...createDeterministicRuntimeDependencies(),
      models: new DeepSeekOpenAIProvider({
        credentials: new CredentialAuthModelCredentialProvider(credentialAuth),
        transport: new OpenAIModelProviderTransport(),
        timeoutMs: 90_000
      })
    };
    const workspaceRoot = process.cwd();
    await registerRuntimeCoreTools(deps, workspaceRoot);
    const kernel = await createDefaultRuntimeKernel(deps);
    const events = [];
    for await (const event of runAgentLoop(deps, kernel, {
      prompt: "Use the core.file.read tool to read README.md and reply with a short summary.",
      caller: "live.agent-tool.test",
      workspaceRoot,
      outputMode: "jsonl",
      profile: {
        ...defaultDeepSeekProfile,
        providerOptions: {
          max_tokens: 256,
          stream_options: { include_usage: true }
        }
      },
      reasoning: { enabled: false },
      live: true,
      timeoutMs: 90_000,
      limits: { maxModelIterations: 3, maxToolCalls: 3 }
    })) {
      events.push(event);
    }
    await kernel.shutdown("live-agent-tool-smoke");

    const kinds = events.map((event) => event.kind);
    const feedback = events
      .find((event) => event.kind === "model.tool.result")
      ?.data as { feedback?: ToolResultFeedback } | undefined;
    const redactedKinds = JSON.stringify(kinds);
    assert.equal(kinds.includes("model.requested"), true, redactedKinds);
    assert.equal(kinds.includes("agent.loop.completed") || kinds.includes("agent.loop.failed"), true, redactedKinds);
    if (feedback?.feedback) {
      assert.equal(["success", "repaired", "rejected", "denied", "timeout", "cancelled", "failed"].includes(feedback.feedback.status), true);
      assert.equal(feedback.feedback.schemaVersion, "1.0.0");
      assert.equal(typeof feedback.feedback.trace.traceId, "string");
    }
    const token = loadLiveToken();
    const serialised = JSON.stringify(events);
    assert.equal(token ? serialised.includes(token) : false, false);
    assert.equal(serialised.includes("Bearer "), false);
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
