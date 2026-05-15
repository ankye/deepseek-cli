import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  SKILL_SCHEMA_VERSION,
  asId,
  type AgentContinueRequest,
  type AgentContinueResult,
  type AgentSpawnRequest,
  type AgentSpawnResult,
  type AgentSpawner,
  type AgentStopRequest,
  type AgentStopResult,
  type CapabilityId,
  type CapabilityManifest,
  type JsonObject,
  type ModelStreamEvent,
  type PolicyDecision,
  type PolicyEngine,
  type PolicyRequest,
  type RuntimeDependencies,
  type RuntimeEvent,
  type WebSearchProvider
} from "@deepseek/platform-contracts";
import { deepSeekLiveCredentialProcessEnv } from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider, OpenAIModelProviderTransport, StaticCredentialProvider, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createLiveCliDependencies } from "@deepseek/testing-regression";
import {
  liveToolCoverageEvidencePath,
  liveToolCoverageKind,
  liveToolCoverageSchemaVersion,
  liveToolCoverageTargets,
  safeToolName
} from "../src/apps/cli/src/diagnostics/tool-live-coverage.js";

interface ToolRunState {
  workspaceRoot?: string;
  backgroundTaskId?: string;
  workerInstanceId?: string;
}

interface CoverageRecord extends JsonObject {
  readonly toolId: string;
  readonly safeName: string;
  readonly status: "pass" | "fail";
  readonly model: JsonObject;
  readonly preflight: JsonObject;
  readonly execution: JsonObject;
  readonly continuation: JsonObject;
  readonly diagnostics: readonly string[];
}

const platform = new NodePlatformRuntime();

async function main(): Promise<void> {
  const credentialEnv = await deepSeekLiveCredentialProcessEnv(platform);
  const token = credentialEnv.DEEPSEEK_API_KEY ?? credentialEnv.DEEPSEEK_TOKEN;
  if (!token) {
    throw new Error("Missing DEEPSEEK_API_KEY or DEEPSEEK_TOKEN in environment or .env.");
  }

  const workspaceRoot = await platform.createTempDirectory("tool-coverage-");
  await prepareWorkspace(workspaceRoot);

  const deps = await createCoverageDependencies(workspaceRoot, token);
  await registerRuntimeCoreTools(deps, workspaceRoot);
  const kernel = await createDefaultRuntimeKernel(deps);
  const provider = new DeepSeekOpenAIProvider({
    credentials: new StaticCredentialProvider(token),
    transport: new OpenAIModelProviderTransport(),
    timeoutMs: 90_000
  });
  const descriptor = await platform.descriptor();
  const state: ToolRunState = { workspaceRoot };
  const records: CoverageRecord[] = [];

  for (const target of liveToolCoverageTargets) {
    const manifest = await deps.capabilities.get(asId<"capability">(target.toolId));
    if (!manifest) {
      records.push(failedRecord(target.toolId, ["manifest_missing"], {}, {}, {}, {}));
      continue;
    }
    const record = await runToolCoverage({
      deps,
      kernel,
      provider,
      manifest,
      toolId: target.toolId,
      workspaceRoot,
      platformKind: descriptor.os === "macos" || descriptor.os === "windows" || descriptor.os === "linux" ? descriptor.os : "linux",
      state
    });
    records.push(record);
  }

  await kernel.shutdown("live-tool-coverage");

  const passed = records.filter((record) => record.status === "pass").length;
  const evidence = {
    schemaVersion: liveToolCoverageSchemaVersion,
    kind: liveToolCoverageKind,
    generatedAt: new Date().toISOString(),
    provider: "deepseek",
    model: defaultDeepSeekProfile.model,
    summary: {
      totalToolCount: records.length,
      passedToolCount: passed,
      failedToolCount: records.length - passed,
      coverageRate: roundRatio(passed / records.length)
    },
    records,
    redaction: {
      class: "internal",
      fields: [
        "workspaceRoot",
        "records.model.input",
        "records.execution.preview",
        "records.continuation.preview"
      ]
    }
  };
  const outputPath = join(process.cwd(), liveToolCoverageEvidencePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath, ...evidence.summary }));
}

async function runToolCoverage(input: {
  readonly deps: RuntimeDependencies;
  readonly kernel: Awaited<ReturnType<typeof createDefaultRuntimeKernel>>;
  readonly provider: DeepSeekOpenAIProvider;
  readonly manifest: CapabilityManifest;
  readonly toolId: string;
  readonly workspaceRoot: string;
  readonly platformKind: "macos" | "windows" | "linux" | "fake";
  readonly state: ToolRunState;
}): Promise<CoverageRecord> {
  const diagnostics: string[] = [];
  const modelInputPrompt = promptForTool(input.toolId, input.state);
  const schema = modelToolSchema(input.manifest);
  const modelEvents = await collectModelEvents(input.provider.stream({
    profile: {
      ...defaultDeepSeekProfile,
      providerOptions: {
        max_tokens: 192,
        stream_options: { include_usage: true }
      }
    },
    prompt: modelInputPrompt,
    tools: [schema],
    toolChoice: { type: "function", name: safeToolName(input.toolId) },
    reasoning: { enabled: false }
  }));
  const toolCall = modelEvents.find((event) => event.kind === "tool-call");
  if (!toolCall || toolCall.kind !== "tool-call") diagnostics.push("model_tool_call_missing");
  const model = {
    called: Boolean(toolCall),
    eventKinds: modelEvents.map((event) => event.kind),
    ...(toolCall ? { name: toolCall.name, inputKeys: Object.keys(toolCall.input).sort() } : {}),
    errors: modelEvents.filter((event) => event.kind === "error").map((event) => event.kind === "error" ? event.error.code : "")
  };
  if (!toolCall || toolCall.kind !== "tool-call") return failedRecord(input.toolId, diagnostics, model, {}, {}, {});

  const preflight = await input.deps.toolIntentPreflight.check({
    intent: {
      name: toolCall.name,
      input: toolCall.input,
      source: "model"
    },
    workspaceRoot: input.workspaceRoot,
    platform: input.platformKind,
    modelVisibleCapabilities: [asId<"capability">(input.toolId)],
    providerId: defaultDeepSeekProfile.providerId,
    profileId: defaultDeepSeekProfile.id
  });
  if (preflight.status === "rejected" || !preflight.capabilityId) diagnostics.push("preflight_rejected");
  const preflightSummary = {
    status: preflight.status,
    capabilityId: preflight.capabilityId,
    repairKinds: preflight.repairs.map((repair) => repair.kind),
    diagnosticCodes: preflight.diagnostics.map((diagnostic) => diagnostic.code)
  };
  if (preflight.status === "rejected" || !preflight.capabilityId) return failedRecord(input.toolId, diagnostics, model, preflightSummary, {}, {});

  const executionEvents = await collectRuntimeEvents(input.kernel.execute({
    capabilityId: preflight.capabilityId,
    input: preflight.repaired?.input ?? toolCall.input,
    caller: "live.tool.coverage",
    timeoutMs: 45_000
  }));
  const terminal = lastTerminalEvent(executionEvents);
  if (terminal?.kind !== "capability.completed") diagnostics.push("execution_not_completed");
  const execution = {
    terminalKind: terminal?.kind ?? "missing",
    errorCode: terminal?.error?.code,
    previewBytes: Buffer.byteLength(outputPreview(terminal), "utf8"),
    eventKinds: executionEvents.map((event) => event.kind)
  };
  updateStateFromExecution(input.toolId, terminal, input.state);
  if (terminal?.kind !== "capability.completed") return failedRecord(input.toolId, diagnostics, model, preflightSummary, execution, {});

  const continuationEvents = await collectModelEvents(input.provider.stream({
    profile: {
      ...defaultDeepSeekProfile,
      providerOptions: {
        max_tokens: 96,
        stream_options: { include_usage: true }
      }
    },
    prompt: modelInputPrompt,
    messages: [
      { role: "user", content: modelInputPrompt },
      { role: "assistant", content: "", toolCalls: [{ id: toolCall.id ?? `call-${safeToolName(input.toolId)}`, name: toolCall.name, input: toolCall.input }] },
      { role: "tool", content: outputPreview(terminal), toolCallId: toolCall.id ?? `call-${safeToolName(input.toolId)}`, toolName: toolCall.name }
    ],
    tools: [schema],
    reasoning: { enabled: false }
  }));
  const continuationErrors = continuationEvents.filter((event) => event.kind === "error");
  const continuationOk = continuationErrors.length === 0 && continuationEvents.some((event) => event.kind === "delta" || event.kind === "finish" || event.kind === "done");
  if (!continuationOk) diagnostics.push("continuation_failed");
  const continuation = {
    status: continuationOk ? "completed" : "failed",
    eventKinds: continuationEvents.map((event) => event.kind),
    errorCodes: continuationErrors.map((event) => event.kind === "error" ? event.error.code : "")
  };
  return {
    toolId: input.toolId,
    safeName: safeToolName(input.toolId),
    status: diagnostics.length === 0 ? "pass" : "fail",
    model,
    preflight: preflightSummary,
    execution,
    continuation,
    diagnostics,
    redaction: { class: "internal", fields: ["model.input", "execution.preview", "continuation.preview"] }
  };
}

async function createCoverageDependencies(workspaceRoot: string, token: string): Promise<RuntimeDependencies> {
  const base = createLiveCliDependencies({
    workspaceRoot,
    credentials: new StaticCredentialProvider(token),
    transport: new OpenAIModelProviderTransport(),
    timeoutMs: 90_000,
    allowWorkspaceWrites: true
  });
  await registerCoverageSkill(base);
  return {
    ...base,
    policy: new CoveragePolicyEngine(),
    webSearch: coverageWebSearchProvider(),
    agentSpawner: new CoverageAgentSpawner()
  };
}

async function registerCoverageSkill(deps: RuntimeDependencies): Promise<void> {
  const maybeRegister = deps.skills as unknown as {
    registerSkill?: (manifest: JsonObject) => Promise<unknown>;
  };
  await maybeRegister.registerSkill?.({
    schemaVersion: SKILL_SCHEMA_VERSION,
    id: asId<"skill">("skill-live-tool-coverage"),
    name: "coverage-skill",
    version: "1.0.0",
    source: "built-in",
    trust: "trusted",
    activation: ["coverage-skill"],
    executionModes: ["context"],
    permissions: [],
    metadata: {
      instructions: ["This skill exists only for live tool coverage verification."]
    },
    redaction: { class: "internal", fields: ["metadata"] }
  });
}

async function prepareWorkspace(workspaceRoot: string): Promise<void> {
  await platform.ensureDirectory(workspaceRoot);
  await platform.writeFile(join(workspaceRoot, "README.md"), "DeepSeek live tool coverage fixture.\ncoverage marker\n");
  await platform.writeFile(join(workspaceRoot, "app.ts"), "before\n");
  await platform.writeFile(join(workspaceRoot, "notes.md"), "coverage searchable note\n");
  await platform.writeFile(join(workspaceRoot, "package.json"), JSON.stringify({ scripts: { test: "node -e \"process.exit(0)\"" } }, null, 2));
  await platform.ensureDirectory(join(workspaceRoot, "work"));
  await platform.runProcess("git", ["init"], { cwd: workspaceRoot, timeoutMs: 30_000 }).catch(() => undefined);
  await platform.runProcess("git", ["config", "user.email", "coverage@example.invalid"], { cwd: workspaceRoot, timeoutMs: 30_000 }).catch(() => undefined);
  await platform.runProcess("git", ["config", "user.name", "Coverage"], { cwd: workspaceRoot, timeoutMs: 30_000 }).catch(() => undefined);
  await platform.runProcess("git", ["add", "README.md", "app.ts", "notes.md", "package.json"], { cwd: workspaceRoot, timeoutMs: 30_000 }).catch(() => undefined);
  await platform.runProcess("git", ["commit", "-m", "coverage fixture"], { cwd: workspaceRoot, timeoutMs: 30_000 }).catch(() => undefined);
  await platform.writeFile(join(workspaceRoot, "README.md"), "DeepSeek live tool coverage fixture.\ncoverage marker changed\n");
}

function promptForTool(toolId: string, state: ToolRunState): string {
  const exactInput = inputForTool(toolId, state);
  return [
    `Call exactly the ${safeToolName(toolId)} tool once.`,
    "Use exactly this JSON object as the tool arguments:",
    JSON.stringify(exactInput),
    "Do not answer in text before calling the tool."
  ].join("\n");
}

function inputForTool(toolId: string, state: ToolRunState): JsonObject {
  switch (toolId) {
    case "core.file.read":
      return { path: "README.md", limitBytes: 2000 };
    case "core.file.write":
      return { path: "generated/live-tool-write.txt", content: "live tool coverage write\n", limitBytes: 2000 };
    case "core.file.edit":
      return { path: "app.ts", expected: "before", replacement: "after", limitBytes: 2000 };
    case "core.file.list":
      return { path: ".", pattern: ".md", limit: 20, sort: "alpha" };
    case "core.search.text":
      return { pattern: "coverage", limit: 20, outputMode: "files_with_matches" };
    case "core.shell.run":
      return { command: "node", args: ["-e", "setTimeout(()=>{}, 60000)"], cwd: "work", workspaceRoot: state.workspaceRoot, runInBackground: true, limitBytes: 2000 };
    case "core.shell.output":
      return { taskId: state.backgroundTaskId ?? "missing-task", workspaceRoot: state.workspaceRoot, limitBytes: 2000 };
    case "core.shell.kill":
      return { taskId: state.backgroundTaskId ?? "missing-task", workspaceRoot: state.workspaceRoot };
    case "core.git.status":
      return { limitBytes: 2000 };
    case "core.git.diff":
      return { limitBytes: 4000 };
    case "core.test.run":
      return { command: "node", args: ["-e", "process.exit(0)"], cwd: "work", workspaceRoot: state.workspaceRoot, intent: "live-tool-coverage", limitBytes: 2000 };
    case "core.todo.plan":
      return { items: [{ id: "1", title: "cover live tools", status: "completed" }] };
    case "core.web.fetch":
      return { url: "https://example.com", limitBytes: 4000, followRedirects: 2 };
    case "core.web.search":
      return { query: "DeepSeek CLI", limit: 2 };
    case "core.agent.spawn":
      return { prompt: "Return live tool coverage worker ok.", agentMode: "worker", toolProjection: "read-only", reason: "live tool coverage", workspaceRoot: state.workspaceRoot };
    case "core.agent.continue":
      return { workerInstanceId: state.workerInstanceId ?? "worker-live-tool-coverage", prompt: "Continue live tool coverage worker.", reason: "live tool coverage", workspaceRoot: state.workspaceRoot };
    case "core.agent.stop":
      return { workerInstanceId: state.workerInstanceId ?? "worker-live-tool-coverage", stopReason: "completed", reason: "live tool coverage", workspaceRoot: state.workspaceRoot };
    case "core.hook.list":
      return { limit: 20 };
    case "core.skill.list":
      return {};
    case "core.skill.activate":
      return { name: "coverage-skill" };
    default:
      return {};
  }
}

function updateStateFromExecution(toolId: string, terminal: RuntimeEvent | undefined, state: ToolRunState): void {
  const metadata = terminal?.data.output && typeof terminal.data.output === "object"
    ? ((terminal.data.output as { evidence?: { metadata?: JsonObject } }).evidence?.metadata ?? {})
    : {};
  if (toolId === "core.shell.run" && typeof metadata.taskId === "string") state.backgroundTaskId = metadata.taskId;
  if ((toolId === "core.agent.spawn" || toolId === "core.agent.continue") && typeof metadata.workerInstanceId === "string") {
    state.workerInstanceId = metadata.workerInstanceId;
  }
}

function modelToolSchema(manifest: CapabilityManifest): JsonObject {
  return {
    type: "function",
    function: {
      name: safeToolName(String(manifest.id)),
      description: manifest.description ?? manifest.name,
      parameters: manifest.inputSchema
    }
  };
}

async function collectModelEvents(iterable: AsyncIterable<ModelStreamEvent>): Promise<readonly ModelStreamEvent[]> {
  const events: ModelStreamEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

async function collectRuntimeEvents(iterable: AsyncIterable<RuntimeEvent>): Promise<readonly RuntimeEvent[]> {
  const events: RuntimeEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

function lastTerminalEvent(events: readonly RuntimeEvent[]): RuntimeEvent | undefined {
  return [...events].reverse().find((event) => event.kind === "capability.completed" || event.kind === "capability.failed" || event.kind === "execution.rejected" || event.kind === "capability.cancelled");
}

function outputPreview(event: RuntimeEvent | undefined): string {
  const output = event?.data.output;
  if (output && typeof output === "object") {
    const evidence = (output as { evidence?: { preview?: { text?: unknown } } }).evidence;
    const text = evidence?.preview?.text;
    if (typeof text === "string") return text.slice(0, 4000);
  }
  return event?.error?.message ?? event?.kind ?? "";
}

function failedRecord(toolId: string, diagnostics: readonly string[], model: JsonObject, preflight: JsonObject, execution: JsonObject, continuation: JsonObject): CoverageRecord {
  return {
    toolId,
    safeName: safeToolName(toolId),
    status: "fail",
    model,
    preflight,
    execution,
    continuation,
    diagnostics,
    redaction: { class: "internal", fields: ["model.input", "execution.preview", "continuation.preview"] }
  };
}

function coverageWebSearchProvider(): WebSearchProvider {
  return {
    name: "coverage-web-search",
    async search(input) {
      return [{
        title: `Coverage result for ${input.query}`,
        url: "https://example.com/deepseek-cli",
        snippet: "Synthetic web search provider result used by live tool coverage."
      }];
    }
  };
}

class CoverageAgentSpawner implements AgentSpawner {
  async spawn(_input: AgentSpawnRequest): Promise<AgentSpawnResult> {
    return {
      childSessionId: asId<"session">("session-live-tool-worker"),
      workerAgentId: asId<"agent">("agent-live-tool-worker"),
      workerInstanceId: asId<"agentInstance">("worker-live-tool-coverage"),
      workOrderId: "work-order-live-tool-coverage",
      agentMode: "worker",
      terminalStatus: "completed",
      assistantText: "worker ok",
      iterations: 1,
      toolCalls: 0,
      usage: {},
      resultProvenance: { source: "live-tool-coverage" },
      verifierStatus: "not-run",
      diagnostics: []
    };
  }

  async continue(input: AgentContinueRequest): Promise<AgentContinueResult> {
    return {
      childSessionId: asId<"session">("session-live-tool-worker-continue"),
      workerAgentId: asId<"agent">("agent-live-tool-worker"),
      workerInstanceId: input.workerInstanceId,
      continuationOf: input.workerInstanceId,
      workOrderId: input.workOrderId ?? "work-order-live-tool-coverage",
      agentMode: "worker",
      terminalStatus: "completed",
      assistantText: "worker continued",
      iterations: 1,
      toolCalls: 0,
      usage: {},
      resultProvenance: { source: "live-tool-coverage" },
      verifierStatus: "not-run",
      diagnostics: []
    };
  }

  async stop(input: AgentStopRequest): Promise<AgentStopResult> {
    return {
      workerInstanceId: input.workerInstanceId,
      workerSessionId: asId<"session">("session-live-tool-worker"),
      workerAgentId: asId<"agent">("agent-live-tool-worker"),
      workOrderId: input.workOrderId ?? "work-order-live-tool-coverage",
      lifecycleState: "stopped",
      status: "stopped",
      stopReason: input.stopReason ?? "completed",
      usage: {},
      resultProvenance: { source: "live-tool-coverage" },
      workerResult: {
        schemaVersion: "1.0.0",
        workerInstanceId: input.workerInstanceId,
        status: "completed",
        summary: "worker stopped",
        evidenceIds: [],
        diagnostics: [],
        redaction: { class: "internal" }
      },
      diagnostics: []
    };
  }
}

class CoveragePolicyEngine implements PolicyEngine {
  async decide(_request: PolicyRequest): Promise<PolicyDecision> {
    return {
      action: "allow",
      reason: "Allowed by live tool coverage policy.",
      audit: { policy: "live-tool-coverage" },
      sandboxProfile: "coverage"
    };
  }
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

await main();
