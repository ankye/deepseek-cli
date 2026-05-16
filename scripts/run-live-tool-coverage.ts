import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
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
  type CapabilityExecutorBinding,
  type CapabilityManifest,
  type JsonObject,
  type JsonValue,
  type McpServerManifest,
  type ModelProviderRequest,
  type ModelProviderResponseChunk,
  type ModelProviderTransport,
  type ModelStreamEvent,
  type PolicyDecision,
  type PolicyEngine,
  type PolicyRequest,
  type RuntimeDependencies,
  type RuntimeEvent,
  type ToolFamilyId,
  type WebFetchProvider,
  type WebSearchProvider
} from "@deepseek/platform-contracts";
import { deepSeekLiveCredentialProcessEnv } from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider, StaticCredentialProvider, createModelGatewayFamilyCapabilities, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { InMemoryMcpGateway, createMcpGatewayFamilyCapabilities, createRealMcpAdapter } from "@deepseek/mcp-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { HeadlessApprovalBroker } from "@deepseek/policy-sandbox";
import { createDefaultRuntimeKernel, registerRuntimeCoreTools } from "@deepseek/runtime";
import { createLiveCliDependencies } from "@deepseek/testing-regression";
import {
  liveFamilyCoverageTargets,
  liveToolCoverageEvidencePath,
  liveToolCoverageKind,
  liveToolCoverageSchemaVersion,
  safeToolName
} from "../src/apps/cli/src/diagnostics/tool-live-coverage.js";
import { collectToolFamilyParityMatrix } from "../src/apps/cli/src/diagnostics/evaluation.js";
import { collectModeMatrix } from "../src/apps/cli/src/diagnostics/mode-matrix.js";
import { collectDeliveryCapabilitySummary } from "../src/apps/cli/src/diagnostics/delivery-capability.js";
import { collectPackageScorecards } from "../src/apps/cli/src/diagnostics/package-scorecard.js";

interface ToolRunState {
  workspaceRoot?: string;
  backgroundTaskId?: string;
  workerInstanceId?: string;
}

interface CoverageRecord extends JsonObject {
  readonly toolId: string;
  readonly familyId?: ToolFamilyId;
  readonly safeName: string;
  readonly status: "pass" | "fail";
  readonly model: JsonObject;
  readonly preflight: JsonObject;
  readonly policy: JsonObject;
  readonly execution: JsonObject;
  readonly continuation: JsonObject;
  readonly taskOutcome: JsonObject;
  readonly safetyOutcome: JsonObject;
  readonly providerNative: JsonObject;
  readonly diagnostics: readonly string[];
}

const platform = new NodePlatformRuntime();
const toolFamilyDeliveryCapabilityEvidencePath = "tests/acceptance/latest/tool-family-delivery-capability-score.json";
const overallDeliveryCapabilityEvidencePath = "tests/acceptance/latest/overall-delivery-capability-score.json";
const providerResponseCachePath = "tests/acceptance/latest/deepseek-provider-response-cache.json";
const replayCoverageEvidencePath = "tests/acceptance/latest/live-tool-coverage-replay.json";

type CoverageExecutionMode = "live" | "replay";

async function main(): Promise<void> {
  const executionMode: CoverageExecutionMode = process.argv.includes("--replay") || process.env.DEEPSEEK_LIVE_COVERAGE_REPLAY === "1" ? "replay" : "live";
  const credentialEnv = executionMode === "live" ? await deepSeekLiveCredentialProcessEnv(platform) : {};
  const token = credentialEnv.DEEPSEEK_API_KEY ?? credentialEnv.DEEPSEEK_TOKEN;
  if (executionMode === "live" && !token) {
    throw new Error("Missing DEEPSEEK_API_KEY or DEEPSEEK_TOKEN in environment or .env.");
  }

  const workspaceRoot = await platform.createTempDirectory("tool-coverage-");
  await prepareWorkspace(workspaceRoot);

  const transport = executionMode === "replay"
    ? new ReplayModelProviderTransport(await readProviderResponseCache())
    : new AuditedFetchModelProviderTransport();
  const deps = await createCoverageDependencies(workspaceRoot, token ?? "replay-token", transport);
  await deps.sessions.append({
    sessionId: asId<"session">("session-live-tool-coverage"),
    sequence: 1,
    kind: "live-tool-coverage.started",
    at: new Date(0).toISOString(),
    payload: { schemaVersion: "1.0.0", workspaceRoot, redaction: { class: "internal", fields: ["workspaceRoot"] } },
    redaction: { class: "internal", fields: ["payload.workspaceRoot"] }
  });
  await registerNativeExternalFamilyCapabilities(deps);
  await registerRuntimeCoreTools(deps, workspaceRoot);
  const kernel = await createDefaultRuntimeKernel(deps);
  const provider = new DeepSeekOpenAIProvider({
    credentials: new StaticCredentialProvider(token),
    transport,
    timeoutMs: 90_000
  });
  const descriptor = await platform.descriptor();
  const state: ToolRunState = { workspaceRoot };
  const records: CoverageRecord[] = [];

  for (const target of liveFamilyCoverageTargets) {
    const manifest = await deps.capabilities.get(asId<"capability">(target.toolId));
    if (!manifest) {
      records.push(failedRecord(target.toolId, target.familyId, ["manifest_missing"], {}, {}, {}, {}, {}, {}, {}, providerNativeEvidence(undefined)));
      continue;
    }
    const record = await runToolCoverage({
      deps,
      kernel,
      provider,
      manifest,
      toolId: target.toolId,
      familyId: target.familyId,
      workspaceRoot,
      platformKind: descriptor.os === "macos" || descriptor.os === "windows" || descriptor.os === "linux" ? descriptor.os : "linux",
      state,
      executionMode
    });
    records.push(record);
  }

  await kernel.shutdown("live-tool-coverage");
  await disposeCoverageDependencies(deps);

  const passed = records.filter((record) => record.status === "pass").length;
  const evidence = {
    schemaVersion: liveToolCoverageSchemaVersion,
    kind: liveToolCoverageKind,
    generatedAt: new Date().toISOString(),
    provider: "deepseek",
    model: defaultDeepSeekProfile.model,
    executionMode,
    replayOnly: executionMode === "replay",
    ...(executionMode === "replay" ? { responseCachePath: providerResponseCachePath } : {}),
    summary: {
      totalToolCount: records.length,
      passedToolCount: passed,
      failedToolCount: records.length - passed,
      coverageRate: roundRatio(passed / records.length),
      providerRequestMode: executionMode,
      providerRequestCount: transport.records.length,
      providerRequestCompletedCount: transport.records.filter((record) => record.status === "completed").length,
      providerRequestFailedCount: transport.records.filter((record) => record.status === "failed").length
    },
    providerRequestAudit: {
      schemaVersion: "1.0.0",
      transport: transport.auditTransportName,
      baseUrl: "https://api.deepseek.com",
      replayOnly: executionMode === "replay",
      requestCount: transport.records.length,
      records: transport.records,
      redaction: { class: "internal", fields: ["records.responseHeaders"] }
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
  const outputPath = join(process.cwd(), executionMode === "replay" ? replayCoverageEvidencePath : liveToolCoverageEvidencePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  const cacheEvidencePath = executionMode === "live" ? await writeProviderResponseCache(transport.responseCache()) : undefined;
  const deliveryEvidencePaths = executionMode === "live" ? await writeDeliveryCapabilityEvidence() : undefined;
  console.log(JSON.stringify({
    mode: executionMode,
    outputPath,
    ...(cacheEvidencePath ? { providerResponseCacheOutputPath: cacheEvidencePath } : {}),
    ...(deliveryEvidencePaths ?? {}),
    ...evidence.summary
  }));
}

async function writeDeliveryCapabilityEvidence(): Promise<{
  readonly toolFamilyDeliveryCapabilityOutputPath: string;
  readonly overallDeliveryCapabilityOutputPath: string;
}> {
  const generatedAt = new Date().toISOString();
  const matrix = await collectToolFamilyParityMatrix(platform);
  const modeMatrix = await collectModeMatrix();
  const packageScorecards = await collectPackageScorecards(platform);
  const overallDeliveryCapability = collectDeliveryCapabilitySummary({
    toolFamilyParityMatrix: matrix,
    packageScorecards: packageScorecards.scorecards,
    packageScorecardAggregate: packageScorecards.aggregate
  }, modeMatrix);
  const toolFamilyOutputPath = join(process.cwd(), toolFamilyDeliveryCapabilityEvidencePath);
  const overallOutputPath = join(process.cwd(), overallDeliveryCapabilityEvidencePath);
  const toolFamilyEvidence = {
    schemaVersion: "1.0.0",
    kind: "tool-family.delivery-capability-score.evidence",
    scope: "tool-family-only",
    overallDeliveryCapabilityEvidencePath,
    generatedAt,
    sourceCommand: "npx tsx scripts/run-live-tool-coverage.ts",
    totalFamilyCount: matrix.totalFamilyCount,
    liveCoveredFamilyCount: matrix.liveCoveredFamilyCount,
    taskCoveredFamilyCount: matrix.taskCoveredFamilyCount,
    safetyCoveredFamilyCount: matrix.safetyCoveredFamilyCount,
    providerNativeSupportedFamilyCount: matrix.providerNativeSupportedFamilyCount,
    passedFamilyCount: matrix.passedFamilyCount,
    deliveryCapabilityScore: matrix.deliveryCapabilityScore,
    deliveryCapabilityTargetScore: matrix.deliveryCapabilityTargetScore,
    deliveryCapabilityPassedFamilyCount: matrix.deliveryCapabilityPassedFamilyCount,
    deliveryCapabilityTargetFamilyCount: matrix.deliveryCapabilityTargetFamilyCount,
    deliveryCapabilityPassed: matrix.deliveryCapabilityPassed,
    blockingFamilyIds: matrix.deliveryCapabilityBlockingFamilyIds,
    fakeCoveredFamilyCount: matrix.fakeCoveredFamilyCount,
    replayedCoveredFamilyCount: matrix.replayedCoveredFamilyCount,
    redaction: { class: "internal", fields: ["sourceCommand", "blockingFamilyIds"] }
  };
  const overallEvidence = {
    schemaVersion: "1.0.0",
    kind: "cli.overall-delivery-capability-score.evidence",
    generatedAt,
    command: "npx tsx scripts/run-live-tool-coverage.ts",
    status: overallDeliveryCapability?.status ?? "blocked",
    scoringMethod: overallDeliveryCapability?.scoringMethod ?? "unfinished-penalty",
    score: overallDeliveryCapability?.score ?? 0,
    targetScore: overallDeliveryCapability?.targetScore ?? 1,
    unfinishedPenaltyPerItem: overallDeliveryCapability?.unfinishedPenaltyPerItem ?? 0.1,
    unfinishedTargetCount: overallDeliveryCapability?.unfinishedTargetCount ?? 0,
    unfinishedTargetIds: overallDeliveryCapability?.unfinishedTargetIds ?? [],
    passedTargetCount: overallDeliveryCapability?.passedTargetCount ?? 0,
    totalTargetCount: overallDeliveryCapability?.totalTargetCount ?? 0,
    dimensions: overallDeliveryCapability?.dimensions ?? [],
    toolFamily: {
      score: matrix.deliveryCapabilityScore,
      targetScore: matrix.deliveryCapabilityTargetScore,
      passedFamilyCount: matrix.deliveryCapabilityPassedFamilyCount,
      totalFamilyCount: matrix.totalFamilyCount,
      fakeCoveredFamilyCount: matrix.fakeCoveredFamilyCount,
      replayedCoveredFamilyCount: matrix.replayedCoveredFamilyCount,
      liveCoveredFamilyCount: matrix.liveCoveredFamilyCount,
      taskCoveredFamilyCount: matrix.taskCoveredFamilyCount,
      safetyCoveredFamilyCount: matrix.safetyCoveredFamilyCount,
      providerNativeSupportedFamilyCount: matrix.providerNativeSupportedFamilyCount,
      gate: matrix.deliveryCapabilityPassed ? "pass" : "blocked",
      sourceEvidencePath: liveToolCoverageEvidencePath
    },
    modeMatrix: {
      score: modeMatrix.modeDeliveryCapabilityScore,
      targetScore: modeMatrix.modeDeliveryCapabilityTargetScore,
      completedModeCount: modeMatrix.modeDeliveryCapabilityCompletedCount,
      totalModeCount: modeMatrix.modeDeliveryCapabilityTotalCount,
      gate: modeMatrix.modeDeliveryCapabilityPassed ? "pass" : "blocked",
      blockingModeIds: modeMatrix.modeDeliveryCapabilityBlockingModeIds
    },
    packageScorecards: {
      score: packageScorecards.aggregate.averageDeliveryCapabilityScore ?? 0,
      targetScore: packageScorecards.aggregate.deliveryCapabilityTargetScore,
      passedPackageCount: packageScorecards.aggregate.deliveryCapabilityPassedPackageCount,
      totalPackageCount: packageScorecards.aggregate.deliveryCapabilityTotalPackageCount,
      gate: packageScorecards.aggregate.deliveryCapabilityPassed ? "pass" : "blocked",
      blockingPackageIds: packageScorecards.aggregate.deliveryCapabilityBlockingPackageIds
    },
    deepSeekApi: {
      score: overallDeliveryCapability?.deepSeekApiScore ?? 0,
      passedCount: overallDeliveryCapability?.deepSeekApiPassedCount ?? 0,
      totalCount: overallDeliveryCapability?.deepSeekApiTotalCount ?? 0,
      gate: overallDeliveryCapability?.deepSeekApiGatePassed ? "pass" : "blocked"
    },
    memory: {
      score: overallDeliveryCapability?.memoryScore ?? 0,
      passedCount: overallDeliveryCapability?.memoryPassedCount ?? 0,
      totalCount: overallDeliveryCapability?.memoryTotalCount ?? 0,
      gate: overallDeliveryCapability?.memoryGatePassed ? "pass" : "blocked"
    },
    cacheObservability: {
      score: overallDeliveryCapability?.cacheObservabilityScore ?? 0,
      passedCount: overallDeliveryCapability?.cacheObservabilityPassedCount ?? 0,
      totalCount: overallDeliveryCapability?.cacheObservabilityTotalCount ?? 0,
      gate: overallDeliveryCapability?.cacheObservabilityGatePassed ? "pass" : "blocked"
    },
    blockingCapabilityIds: overallDeliveryCapability?.blockingCapabilityIds ?? [],
    calculation: `max(0, 1 - ${overallDeliveryCapability?.unfinishedTargetCount ?? 0} unfinished targets * ${overallDeliveryCapability?.unfinishedPenaltyPerItem ?? 0.1})`,
    redaction: { class: "internal", fields: ["modeMatrix.blockingModeIds", "packageScorecards.blockingPackageIds", "dimensions.blockingIds", "blockingCapabilityIds", "unfinishedTargetIds"] }
  };
  await mkdir(dirname(toolFamilyOutputPath), { recursive: true });
  await writeFile(toolFamilyOutputPath, `${JSON.stringify(toolFamilyEvidence, null, 2)}\n`, "utf8");
  await writeFile(overallOutputPath, `${JSON.stringify(overallEvidence, null, 2)}\n`, "utf8");
  return {
    toolFamilyDeliveryCapabilityOutputPath: toolFamilyOutputPath,
    overallDeliveryCapabilityOutputPath: overallOutputPath
  };
}

async function writeProviderResponseCache(entries: readonly ProviderResponseCacheEntry[]): Promise<string> {
  const outputPath = join(process.cwd(), providerResponseCachePath);
  const cache: ProviderResponseCacheFile = {
    schemaVersion: "1.0.0",
    kind: "deepseek.provider-response-cache",
    replayOnly: true,
    generatedAt: new Date().toISOString(),
    provider: "deepseek",
    model: defaultDeepSeekProfile.model,
    sourceEvidencePath: liveToolCoverageEvidencePath,
    entryCount: entries.length,
    entries,
    redaction: { class: "internal", fields: ["entries.chunks", "entries.requestProfile"] }
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  return outputPath;
}

async function readProviderResponseCache(): Promise<ProviderResponseCacheFile> {
  const path = join(process.cwd(), providerResponseCachePath);
  const parsed = JSON.parse(await readFile(path, "utf8")) as unknown;
  if (!isJsonObject(parsed) || parsed.kind !== "deepseek.provider-response-cache") {
    throw new Error(`Invalid DeepSeek response cache at ${providerResponseCachePath}. Run npx tsx scripts/run-live-tool-coverage.ts once in live mode to create it.`);
  }
  const entries = Array.isArray(parsed.entries) ? parsed.entries.filter(isProviderResponseCacheEntry) : [];
  if (entries.length === 0) {
    throw new Error(`DeepSeek response cache at ${providerResponseCachePath} has no replay entries.`);
  }
  return {
    schemaVersion: String(parsed.schemaVersion ?? "1.0.0"),
    kind: "deepseek.provider-response-cache",
    replayOnly: true,
    generatedAt: String(parsed.generatedAt ?? ""),
    provider: "deepseek",
    model: String(parsed.model ?? defaultDeepSeekProfile.model),
    sourceEvidencePath: String(parsed.sourceEvidencePath ?? liveToolCoverageEvidencePath),
    entryCount: entries.length,
    entries,
    redaction: { class: "internal", fields: ["entries.chunks", "entries.requestProfile"] }
  };
}

async function runToolCoverage(input: {
  readonly deps: RuntimeDependencies;
  readonly kernel: Awaited<ReturnType<typeof createDefaultRuntimeKernel>>;
  readonly provider: DeepSeekOpenAIProvider;
  readonly manifest: CapabilityManifest;
  readonly toolId: string;
  readonly familyId?: ToolFamilyId;
  readonly workspaceRoot: string;
  readonly platformKind: "macos" | "windows" | "linux" | "fake";
  readonly state: ToolRunState;
  readonly executionMode: CoverageExecutionMode;
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
  if (!toolCall || toolCall.kind !== "tool-call") {
    return failedRecord(input.toolId, input.familyId, diagnostics, model, {}, {}, {}, {}, {}, {}, providerNativeEvidence(input.manifest));
  }

  const effectiveToolInput = input.executionMode === "replay" ? inputForTool(input.toolId, input.state) : toolCall.input;
  const preflight = await input.deps.toolIntentPreflight.check({
    intent: {
      name: toolCall.name,
      input: effectiveToolInput,
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
  if (preflight.status === "rejected" || !preflight.capabilityId) {
    return failedRecord(input.toolId, input.familyId, diagnostics, model, preflightSummary, {}, {}, {}, {}, {}, providerNativeEvidence(input.manifest));
  }

  const executionEvents = await collectRuntimeEvents(input.kernel.execute({
    capabilityId: preflight.capabilityId,
    input: preflight.repaired?.input ?? effectiveToolInput,
    caller: "live.tool.coverage",
    timeoutMs: 45_000
  }));
  const terminal = lastTerminalEvent(executionEvents);
  if (terminal?.kind !== "capability.completed") diagnostics.push("execution_not_completed");
  const policy = policyEvidence(executionEvents);
  const execution = {
    terminalKind: terminal?.kind ?? "missing",
    errorCode: terminal?.error?.code,
    previewBytes: Buffer.byteLength(outputPreview(terminal), "utf8"),
    eventKinds: executionEvents.map((event) => event.kind)
  };
  await updateStateFromExecution(input.toolId, terminal, input.state, input.deps);
  if (terminal?.kind !== "capability.completed") {
    const taskOutcome = taskOutcomeEvidence(false, false, diagnostics);
    const safetyOutcome = safetyOutcomeEvidence(preflightSummary, policy, false);
    return failedRecord(input.toolId, input.familyId, diagnostics, model, preflightSummary, policy, execution, {}, taskOutcome, safetyOutcome, providerNativeEvidence(input.manifest, terminal));
  }

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
      { role: "assistant", content: "", toolCalls: [{ id: toolCall.id ?? `call-${safeToolName(input.toolId)}`, name: toolCall.name, input: effectiveToolInput }] },
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
  const safetyOutcome = safetyOutcomeEvidence(preflightSummary, policy, true);
  if (safetyOutcome.status !== "pass") diagnostics.push("safety_outcome_failed");
  const taskOutcome = taskOutcomeEvidence(true, continuationOk, diagnostics);
  return {
    toolId: input.toolId,
    ...(input.familyId ? { familyId: input.familyId } : {}),
    safeName: safeToolName(input.toolId),
    status: diagnostics.length === 0 ? "pass" : "fail",
    model,
    preflight: preflightSummary,
    policy,
    execution,
    continuation,
    taskOutcome,
    safetyOutcome,
    providerNative: providerNativeEvidence(input.manifest, terminal),
    diagnostics,
    redaction: { class: "internal", fields: ["model.input", "execution.preview", "continuation.preview"] }
  };
}

async function createCoverageDependencies(workspaceRoot: string, token: string, transport: ModelProviderTransport): Promise<RuntimeDependencies> {
  const base = createLiveCliDependencies({
    workspaceRoot,
    credentials: new StaticCredentialProvider(token),
    transport,
    timeoutMs: 90_000,
    allowWorkspaceWrites: true
  });
  await registerCoverageSkill(base);
  const mcp = createNativeMcpGateway();
  const deps = {
    ...base,
    mcp,
    policy: new CoveragePolicyEngine(),
    approvals: new HeadlessApprovalBroker(true),
    webFetch: coverageWebFetchProvider(),
    webSearch: coverageWebSearchProvider(),
    agentSpawner: new CoverageAgentSpawner(),
    userInput: {
      async requestInput() {
        return { status: "answered", value: "live coverage input ok", source: "test" };
      }
    }
  } as RuntimeDependencies & { readonly userInput: { readonly requestInput: () => Promise<JsonObject> } };
  return deps;
}

async function registerNativeExternalFamilyCapabilities(deps: RuntimeDependencies): Promise<void> {
  await registerBindings(deps, [
    ...createModelGatewayFamilyCapabilities({ mode: "native", maxItems: 5 }),
    ...createMcpGatewayFamilyCapabilities({ gateway: deps.mcp, mode: "native" })
  ]);
}

async function registerBindings(deps: RuntimeDependencies, bindings: readonly CapabilityExecutorBinding[]): Promise<void> {
  for (const binding of bindings) {
    if (await deps.capabilities.get(binding.manifest.id)) continue;
    await deps.capabilities.register(binding.manifest, binding.execute);
  }
}

async function disposeCoverageDependencies(deps: RuntimeDependencies): Promise<void> {
  const disposable = deps.mcp as RuntimeDependencies["mcp"] & { disposeAll?: () => Promise<void> };
  await disposable.disposeAll?.();
}

function createNativeMcpGateway(): InMemoryMcpGateway {
  const mcp = new InMemoryMcpGateway();
  mcp.registerRealTransport("stdio", (manifest) => createRealMcpAdapter(manifest, (command, args) => {
    const child = spawn(command, [...args], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    return {
      stdin: child.stdin!,
      stdout: child.stdout!,
      stderr: child.stderr!,
      kill: (signal?: "SIGTERM" | "SIGKILL") => { child.kill(signal ?? "SIGTERM"); },
      exit: new Promise((resolve) => {
        child.once("exit", (code) => resolve(code ?? 0));
      })
    };
  }));
  return mcp;
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
  await platform.ensureDirectory(join(workspaceRoot, "src"));
  await platform.writeFile(join(workspaceRoot, "src", "example.ts"), "export const coverageSymbol = 1;\n");
  await platform.writeFile(join(workspaceRoot, "notes.md"), "coverage searchable note\n");
  await platform.writeFile(join(workspaceRoot, "notebook.ipynb"), JSON.stringify({ nbformat: 4, nbformat_minor: 5, cells: [{ cell_type: "markdown", source: ["# coverage notebook\n"], metadata: {} }], metadata: {} }, null, 2));
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
    case "core.file.list":
      return { path: ".", pattern: ".md", limit: 20, sort: "alpha" };
    case "core.workspace.glob":
      return { pattern: "**/*.md", path: ".", limit: 20, limitBytes: 2000 };
    case "core.asset.view-local":
      return { path: "README.md", limitBytes: 2000 };
    case "core.search.text":
      return { pattern: "coverage", limit: 20, outputMode: "files_with_matches" };
    case "code-intelligence.search-symbol":
      return { root: state.workspaceRoot, query: "coverageSymbol", mode: "symbols", limit: 10 };
    case "code-intelligence.diagnostics-lsp":
      return { root: state.workspaceRoot, limit: 10 };
    case "core.notebook.read":
      return { path: "notebook.ipynb", maxCells: 5, limitBytes: 2000 };
    case "core.file.write":
      return { path: "generated/live-tool-write.txt", content: "live tool coverage write\n", limitBytes: 2000 };
    case "core.file.edit":
      return { path: "app.ts", expected: "before", replacement: "after", limitBytes: 2000 };
    case "core.patch.apply":
      return { patch: "--- a/notes.md\n+++ b/notes.md\n@@ -1,1 +1,1 @@\n-coverage searchable note\n+coverage searchable note patched\n", workspaceRoot: state.workspaceRoot, limitBytes: 2000 };
    case "core.revert.undo":
      return { path: "notes.md", workspaceRoot: state.workspaceRoot, dryRun: true, limitBytes: 2000 };
    case "core.shell.run":
      return { command: "node", args: ["-e", "setTimeout(()=>{}, 60000)"], cwd: "work", workspaceRoot: state.workspaceRoot, runInBackground: true, limitBytes: 2000 };
    case "core.shell.output":
      return { taskId: state.backgroundTaskId ?? "missing-task", workspaceRoot: state.workspaceRoot, limitBytes: 2000 };
    case "core.shell.kill":
      return { taskId: state.backgroundTaskId ?? "missing-task", workspaceRoot: state.workspaceRoot };
    case "core.git.status":
      return { limitBytes: 2000 };
    case "core.git.history-branch":
      return { workspaceRoot: state.workspaceRoot, limit: 5, limitBytes: 2000 };
    case "core.git.diff":
      return { limitBytes: 4000 };
    case "core.test.run":
      return { command: "node", args: ["-e", "process.exit(0)"], cwd: "work", workspaceRoot: state.workspaceRoot, intent: "live-tool-coverage", limitBytes: 2000 };
    case "core.package.manager":
      return { operation: "scripts", manager: "npm", cwd: ".", workspaceRoot: state.workspaceRoot, limitBytes: 2000 };
    case "core.todo.plan":
      return { items: [{ id: "1", title: "cover live tools", status: "completed" }] };
    case "runtime.mode.plan-auto-review":
      return { mode: "status", reason: "live tool coverage" };
    case "runtime.user.input":
      return { prompt: "Confirm live coverage user input.", inputType: "text", required: true, defaultValue: "ok" };
    case "runtime.approval.permission":
      return { prompt: "Approve live coverage no-op.", action: "read", resource: "coverage", allowedDecisions: ["allow"] };
    case "runtime.pipeline.sequence":
      return { pipelineId: "coverage-sequence", steps: [{ capabilityId: "core.file.read", input: { path: "README.md", limitBytes: 2000 } }] };
    case "runtime.pipeline.parallel":
      return { pipelineId: "coverage-parallel", steps: [{ capabilityId: "core.file.read", input: { path: "README.md", limitBytes: 2000 } }, { capabilityId: "core.search.text", input: { pattern: "coverage", limit: 5 } }] };
    case "runtime.pipeline.artifact-routing":
      return { pipelineId: "coverage-artifact", steps: [{ capabilityId: "core.file.read", input: { path: "README.md", limitBytes: 2000 }, outputKey: "readme" }] };
    case "runtime.pipeline.stream":
      return { pipelineId: "coverage-stream", steps: [{ capabilityId: "core.file.read", input: { path: "README.md", limitBytes: 2000 } }], chunks: ["coverage"] };
    case "core.web.fetch":
      return { url: "https://example.com", limitBytes: 4000, followRedirects: 2 };
    case "core.web.search":
      return { query: "DeepSeek CLI", limit: 2 };
    case "model-gateway.web-extract":
      return { url: "https://example.com", maxTextChars: 500 };
    case "model-gateway.web-data-lookup":
      return { namespace: "general", query: "deepseek", limit: 5 };
    case "mcp-gateway.browser-navigate":
      return { pageId: "page:coverage", url: "https://example.com" };
    case "mcp-gateway.browser-interact":
      return { pageId: "page:coverage", operation: "click", selector: "#go" };
    case "mcp-gateway.browser-inspect":
      return { pageId: "page:coverage" };
    case "mcp-gateway.browser-screenshot":
      return { pageId: "page:coverage", format: "png" };
    case "mcp-gateway.mcp-server-lifecycle":
      return { action: "connect", manifest: nativeMcpManifest() };
    case "mcp-gateway.mcp-tool-call":
      return { serverId: "mcp-family-native", name: "echo", input: { text: "coverage" } };
    case "mcp-gateway.mcp-resource-read":
      return { serverId: "mcp-family-native", uri: "mcp://family/readme" };
    case "mcp-gateway.mcp-prompt":
      return { name: "summarize", arguments: { topic: "coverage" } };
    case "core.agent.spawn":
      return { prompt: "Return live tool coverage worker ok.", agentMode: "worker", toolProjection: "read-only", reason: "live tool coverage", workspaceRoot: state.workspaceRoot };
    case "core.agent.continue":
      return { workerInstanceId: state.workerInstanceId ?? "worker-live-tool-coverage", prompt: "Continue live tool coverage worker.", reason: "live tool coverage", workspaceRoot: state.workspaceRoot };
    case "runtime.agent.wait-result":
      return { workerInstanceId: state.workerInstanceId ?? "worker-live-tool-coverage", parentSessionId: "session-live-tool-coverage", timeoutMs: 0 };
    case "core.agent.stop":
      return { workerInstanceId: state.workerInstanceId ?? "worker-live-tool-coverage", stopReason: "completed", reason: "live tool coverage", workspaceRoot: state.workspaceRoot };
    case "core.hook.list":
      return { limit: 20 };
    case "core.skill.list":
      return {};
    case "core.skill.activate":
      return { name: "coverage-skill" };
    case "skill-system.plugin-install-verify":
      return { pluginId: "coverage-plugin", version: "1.0.0", dryRun: true };
    case "command-system.palette-slash":
      return { command: "/help", mode: "palette" };
    case "model-gateway.image-generate":
      return { prompt: "coverage image", width: 64, height: 64 };
    case "model-gateway.image-edit":
      return { inputArtifactId: "artifact:coverage", instruction: "add coverage label" };
    case "model-gateway.image-search-stock":
      return { query: "coverage", limit: 2 };
    case "model-gateway.image-inspect":
      return { bytesBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lp3mNwAAAABJRU5ErkJggg==" };
    case "mcp-gateway.design-document-state":
      return {};
    case "mcp-gateway.design-node-query":
      return { query: "title", limit: 10 };
    case "mcp-gateway.design-batch-edit":
      return { operations: [{ type: "update", nodeId: "title", text: "DeepSeek Coverage" }] };
    case "mcp-gateway.design-export-snapshot":
      return { nodeId: "root", format: "png" };
    case "memory-cache-management.memory-read-write":
      return { action: "write", scope: "session", sessionId: "session-live-tool-coverage", content: "coverage memory", provenance: { source: "live-tool-coverage" } };
    case "context-engine.project-index":
      return { action: "refresh", sessionId: "session-live-tool-coverage", workspaceRoot: state.workspaceRoot, documents: [{ path: "README.md", content: "coverage marker", language: "markdown" }] };
    case "session-store.resume-fork":
      return { action: "fork", parentSessionId: "session-live-tool-coverage", reason: "live tool coverage" };
    case "memory-cache-management.compact-summary":
      return { sessionId: "session-live-tool-coverage", text: "coverage compact summary", maxTokens: 256 };
    case "platform-abstraction.remote-runtime":
      return { action: "bind", sessionId: "session-live-tool-coverage", id: "remote-live-tool-coverage", transport: "local-server" };
    case "workspace-state-management.worktree-environment":
      return { action: "create", workspaceRoot: state.workspaceRoot, worktreeId: "coverage-worktree", branch: "coverage/worktree" };
    case "concurrency-orchestration.sleep-cron":
      return { action: "sleep", taskId: "schedule-live-tool-coverage", delayMs: 0 };
    case "observability.trace-budget":
      return { sessionId: "session-live-tool-coverage", reason: "live tool coverage", maxRecords: 10 };
    default:
      return {};
  }
}

function nativeMcpManifest(): McpServerManifest {
  return {
    schemaVersion: "1.0.0",
    id: asId<"mcpServer">("mcp-family-native"),
    name: "family native",
    version: "1.0.0",
    namespace: "family",
    source: "built-in",
    trust: "trusted",
    transport: {
      kind: "stdio",
      command: "node",
      metadata: { args: [join(process.cwd(), "scripts", "mcp-echo-server.mjs")] }
    },
    permissions: ["mcp:read"],
    timeoutMs: 5_000,
    tools: [{ name: "echo", inputSchema: { type: "object", additionalProperties: true }, outputSchema: { type: "object", additionalProperties: true }, permissions: ["mcp:tool"], timeoutMs: 5_000 }],
    resources: [{ uri: "mcp://family/readme", name: "readme", mimeType: "text/plain", permissions: ["mcp:resource"], cachePolicy: "session" }],
    prompts: [{ name: "summarize", description: "Summarize a topic.", argumentsSchema: { type: "object", additionalProperties: true } }]
  };
}

async function updateStateFromExecution(
  toolId: string,
  terminal: RuntimeEvent | undefined,
  state: ToolRunState,
  deps: RuntimeDependencies
): Promise<void> {
  const metadata = terminal?.data.output && typeof terminal.data.output === "object"
    ? ((terminal.data.output as { evidence?: { metadata?: JsonObject } }).evidence?.metadata ?? {})
    : {};
  if (toolId === "core.shell.run" && typeof metadata.taskId === "string") state.backgroundTaskId = metadata.taskId;
  if ((toolId === "core.agent.spawn" || toolId === "core.agent.continue") && typeof metadata.workerInstanceId === "string") {
    state.workerInstanceId = metadata.workerInstanceId;
  }
  if ((toolId === "core.agent.spawn" || toolId === "core.agent.continue" || toolId === "core.agent.stop") && typeof metadata.workerInstanceId === "string") {
    const workerResult = isJsonObject(metadata.workerResult)
      ? metadata.workerResult
      : { schemaVersion: "1.0.0", workerInstanceId: metadata.workerInstanceId, status: "completed", summary: "live tool coverage worker result", evidenceIds: [], diagnostics: [], redaction: { class: "internal" } };
    const existing = await deps.sessions.events(asId<"session">("session-live-tool-coverage"));
    await deps.sessions.append({
      sessionId: asId<"session">("session-live-tool-coverage"),
      sequence: existing.length + 1,
      kind: "agent.worker.result",
      at: new Date(0).toISOString(),
      payload: {
        ...workerResult,
        workerInstanceId: metadata.workerInstanceId,
        workerSessionId: typeof metadata.childSessionId === "string" ? metadata.childSessionId : typeof metadata.workerSessionId === "string" ? metadata.workerSessionId : "session-live-tool-worker",
        status: typeof workerResult.status === "string" ? workerResult.status : "completed",
        redaction: { class: "internal", fields: ["summary"] }
      },
      redaction: { class: "internal", fields: ["payload.summary"] }
    });
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

function failedRecord(
  toolId: string,
  familyId: ToolFamilyId | undefined,
  diagnostics: readonly string[],
  model: JsonObject,
  preflight: JsonObject,
  policy: JsonObject,
  execution: JsonObject,
  continuation: JsonObject,
  taskOutcome: JsonObject,
  safetyOutcome: JsonObject,
  providerNative: JsonObject
): CoverageRecord {
  return {
    toolId,
    ...(familyId ? { familyId } : {}),
    safeName: safeToolName(toolId),
    status: "fail",
    model,
    preflight,
    policy,
    execution,
    continuation,
    taskOutcome,
    safetyOutcome,
    providerNative,
    diagnostics,
    redaction: { class: "internal", fields: ["model.input", "execution.preview", "continuation.preview"] }
  };
}

function policyEvidence(events: readonly RuntimeEvent[]): JsonObject {
  const policyDecided = events.some((event) => event.kind === "policy.decided");
  const sandboxSelected = events.some((event) => event.kind === "sandbox.selected");
  return {
    status: policyDecided ? "pass" : "fail",
    policyDecided,
    sandboxSelected,
    eventKinds: events.filter((event) => event.kind === "policy.decided" || event.kind === "sandbox.selected").map((event) => event.kind),
    redaction: { class: "internal" }
  };
}

function taskOutcomeEvidence(executed: boolean, continued: boolean, diagnostics: readonly string[]): JsonObject {
  return {
    status: executed && continued && diagnostics.length === 0 ? "pass" : "fail",
    executed,
    continued,
    diagnosticCount: diagnostics.length,
    redaction: { class: "internal", fields: ["diagnosticCount"] }
  };
}

function safetyOutcomeEvidence(preflight: JsonObject, policy: JsonObject, executed: boolean): JsonObject {
  const preflightStatus = typeof preflight.status === "string" ? preflight.status : "";
  const preflightOk = preflightStatus === "accepted" || preflightStatus === "repaired";
  const policyOk = policy.status === "pass";
  return {
    status: preflightOk && policyOk && executed ? "pass" : "fail",
    preflightOk,
    policyOk,
    executed,
    redaction: { class: "internal" }
  };
}

function providerNativeEvidence(manifest: CapabilityManifest | undefined, terminal?: RuntimeEvent): JsonObject {
  const connectorProfile = manifest?.toolFamily?.connectorProfile ?? "unknown";
  const providerSupport = manifest?.projection?.providerSupport ?? "unknown";
  if (connectorProfile === "built-in" || connectorProfile === "host") {
    return { status: "not_applicable", connectorProfile, providerSupport, redaction: { class: "internal" } };
  }
  const executionStatus = providerNativeStatusFromValue(terminal?.data.output);
  if (executionStatus === "native") {
    return { status: "native", connectorProfile, providerSupport, source: "execution-output", redaction: { class: "internal" } };
  }
  return {
    status: providerSupport === "native" ? "native" : providerSupport === "connector" ? "connector" : providerSupport === "fake" ? "fake" : "unknown",
    connectorProfile,
    providerSupport,
    redaction: { class: "internal" }
  };
}

function providerNativeStatusFromValue(value: unknown, depth = 0): string | undefined {
  if (depth > 6 || !isJsonObject(value)) return undefined;
  const direct = value.providerNativeSupport;
  if (direct === "native") return "native";
  const status = value.status;
  if (status === "native") return "native";
  const evidence = value.evidence;
  if (isJsonObject(evidence) && evidence.providerNativeSupport === "native") return "native";
  for (const nested of Object.values(value)) {
    if (isJsonObject(nested)) {
      const found = providerNativeStatusFromValue(nested, depth + 1);
      if (found) return found;
    }
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const found = providerNativeStatusFromValue(item, depth + 1);
        if (found) return found;
      }
    }
  }
  return undefined;
}

function coverageWebFetchProvider(): WebFetchProvider {
  return {
    name: "native-node-fetch",
    async fetch(input) {
      const response = await platform.httpFetch(input.url, {
        maxRedirects: input.followRedirects ?? 5,
        maxBytes: 1_000_000,
        timeoutMs: 20_000
      });
      const markdown = htmlToText(response.body).slice(0, input.limitBytes ?? 16_000);
      return {
        metadata: {
          finalUrl: response.finalUrl,
          status: response.status,
          contentType: String(response.headers["content-type"] ?? ""),
          truncated: response.truncated,
          byteLength: Buffer.byteLength(response.body, "utf8"),
          summarized: false,
          redirects: response.redirects,
          cached: false,
          providerNativeSupport: "native"
        },
        markdown
      };
    }
  };
}

function coverageWebSearchProvider(): WebSearchProvider & { readonly providerNativeSupport: "native" } {
  return {
    name: "native-public-web-search",
    providerNativeSupport: "native",
    async search(input) {
      const limit = Math.max(1, Math.min(input.limit ?? 3, 5));
      const results = await githubSearch(input.query, limit);
      if (results.length > 0) return results;
      return duckDuckGoInstantAnswer(input.query, limit);
    }
  };
}

async function githubSearch(query: string, limit: number): Promise<readonly { readonly title: string; readonly url: string; readonly snippet: string }[]> {
  const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}`, {
    headers: { "user-agent": "deepseek-cli-live-coverage", accept: "application/vnd.github+json" }
  });
  if (!response.ok) return [];
  const json = await response.json() as JsonObject;
  const items = Array.isArray(json.items) ? json.items.filter(isJsonObject).slice(0, limit) : [];
  return items.map((item) => ({
    title: String(item.full_name ?? item.name ?? "GitHub result"),
    url: String(item.html_url ?? "https://github.com"),
    snippet: String(item.description ?? "GitHub repository result")
  }));
}

async function duckDuckGoInstantAnswer(query: string, limit: number): Promise<readonly { readonly title: string; readonly url: string; readonly snippet: string }[]> {
  const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`, {
    headers: { "user-agent": "deepseek-cli-live-coverage" }
  });
  if (!response.ok) return [];
  const json = await response.json() as JsonObject;
  const related = Array.isArray(json.RelatedTopics) ? json.RelatedTopics.filter(isJsonObject).slice(0, limit) : [];
  return related.map((item) => ({
    title: String(item.Text ?? "DuckDuckGo result").slice(0, 80),
    url: String(item.FirstURL ?? "https://duckduckgo.com"),
    snippet: String(item.Text ?? "DuckDuckGo instant answer result")
  }));
}

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

interface ProviderRequestAuditRecord extends JsonObject {
  readonly index: number;
  readonly status: "completed" | "failed";
  readonly executionMode: CoverageExecutionMode;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly url: string;
  readonly method: string;
  readonly model: string;
  readonly requestFingerprint: string;
  readonly requestProfile: JsonObject;
  readonly toolChoice?: JsonValue;
  readonly toolCount: number;
  readonly httpStatus?: number;
  readonly responseHeaderKeys?: readonly string[];
  readonly providerRequestId?: string;
  readonly responseCacheKey?: string;
  readonly replaySourceIndex?: number;
  readonly chunkCount: number;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

interface ProviderResponseCacheEntry extends JsonObject {
  readonly schemaVersion: string;
  readonly index: number;
  readonly responseCacheKey: string;
  readonly requestFingerprint: string;
  readonly requestProfile: JsonObject;
  readonly providerRequestId?: string;
  readonly chunkCount: number;
  readonly chunks: readonly ModelProviderResponseChunk[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

interface ProviderResponseCacheFile extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "deepseek.provider-response-cache";
  readonly replayOnly: true;
  readonly generatedAt: string;
  readonly provider: "deepseek";
  readonly model: string;
  readonly sourceEvidencePath: string;
  readonly entryCount: number;
  readonly entries: readonly ProviderResponseCacheEntry[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

interface CoverageProviderTransport extends ModelProviderTransport {
  readonly records: readonly ProviderRequestAuditRecord[];
  readonly auditTransportName: string;
  responseCache(): readonly ProviderResponseCacheEntry[];
}

class AuditedFetchModelProviderTransport implements CoverageProviderTransport {
  readonly records: ProviderRequestAuditRecord[] = [];
  readonly auditTransportName = "audited-fetch";
  private readonly cacheEntries: ProviderResponseCacheEntry[] = [];
  private nextIndex = 0;

  async *stream(request: ModelProviderRequest, options?: { signal?: AbortSignal }): AsyncIterable<ModelProviderResponseChunk> {
    this.nextIndex += 1;
    const index = this.nextIndex;
    const startedTime = Date.now();
    const startedAt = new Date(startedTime).toISOString();
    let chunkCount = 0;
    const init: RequestInit = {
      method: request.method,
      headers: request.headers as Record<string, string>,
      body: JSON.stringify(request.body)
    };
    const signals: AbortSignal[] = [];
    if (request.timeoutMs) signals.push(AbortSignal.timeout(request.timeoutMs));
    if (options?.signal) signals.push(options.signal);
    if (signals.length === 1) init.signal = signals[0];
    if (signals.length > 1) init.signal = AbortSignal.any(signals);
    try {
      const response = await fetch(request.url, init);
      const headers = Object.fromEntries(response.headers.entries());
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`DeepSeek provider HTTP ${response.status}: ${redactProviderErrorBody(body)}`);
      }
      if (!response.body) throw new Error("DeepSeek provider response body is empty.");
      const decoder = new TextDecoder();
      let buffer = "";
      const responseChunks: ModelProviderResponseChunk[] = [];
      for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const parsed = parseServerSentEventLine(line);
          if (!parsed) continue;
          chunkCount += 1;
          responseChunks.push(parsed);
          yield parsed;
        }
      }
      buffer += decoder.decode();
      for (const line of buffer.split(/\r?\n/)) {
        const parsed = parseServerSentEventLine(line);
        if (!parsed) continue;
        chunkCount += 1;
        responseChunks.push(parsed);
        yield parsed;
      }
      const record = this.auditRecord(index, startedAt, startedTime, request, "completed", chunkCount, response.status, headers);
      this.records.push(record);
      this.cacheEntries.push(responseCacheEntry(record, responseChunks));
    } catch (error) {
      this.records.push(this.auditRecord(index, startedAt, startedTime, request, "failed", chunkCount, undefined, undefined, error));
      throw error;
    }
  }

  responseCache(): readonly ProviderResponseCacheEntry[] {
    return this.cacheEntries;
  }

  private auditRecord(
    index: number,
    startedAt: string,
    startedTime: number,
    request: ModelProviderRequest,
    status: "completed" | "failed",
    chunkCount: number,
    httpStatus?: number,
    headers?: Record<string, string>,
    error?: unknown
  ): ProviderRequestAuditRecord {
    const completedTime = Date.now();
    const providerRequestId = headers ? firstHeader(headers, ["x-request-id", "x-ds-request-id", "x-ratelimit-request-id", "cf-ray"]) : undefined;
    return {
      index,
      status,
      executionMode: "live",
      startedAt,
      completedAt: new Date(completedTime).toISOString(),
      durationMs: completedTime - startedTime,
      url: request.url.replace(/\/chat\/completions$/, "/chat/completions"),
      method: request.method,
      model: typeof request.body.model === "string" ? request.body.model : "",
      requestFingerprint: requestFingerprint(request),
      requestProfile: requestProfile(request),
      ...(request.body.tool_choice !== undefined ? { toolChoice: request.body.tool_choice as JsonValue } : {}),
      toolCount: Array.isArray(request.body.tools) ? request.body.tools.length : 0,
      ...(httpStatus !== undefined ? { httpStatus } : {}),
      ...(headers ? { responseHeaderKeys: Object.keys(headers).sort(), responseHeaders: redactHeaders(headers) } : {}),
      ...(providerRequestId ? { providerRequestId } : {}),
      responseCacheKey: responseCacheKey(index),
      chunkCount,
      ...(error ? { errorCode: "PROVIDER_HTTP_FAILED", errorMessage: error instanceof Error ? error.message : String(error) } : {}),
      redaction: { class: "internal", fields: ["responseHeaders", "errorMessage"] }
    };
  }
}

class ReplayModelProviderTransport implements CoverageProviderTransport {
  readonly records: ProviderRequestAuditRecord[] = [];
  readonly auditTransportName = "response-cache-replay";
  private nextIndex = 0;

  constructor(private readonly cache: ProviderResponseCacheFile) {}

  async *stream(request: ModelProviderRequest): AsyncIterable<ModelProviderResponseChunk> {
    this.nextIndex += 1;
    const index = this.nextIndex;
    const startedTime = Date.now();
    const startedAt = new Date(startedTime).toISOString();
    const entry = this.cache.entries[index - 1];
    if (!entry) {
      const record = replayAuditRecord(index, startedAt, startedTime, request, undefined, new Error(`Missing cached DeepSeek response for request ${index}.`));
      this.records.push(record);
      throw new Error(record.errorMessage ?? `Missing cached DeepSeek response for request ${index}.`);
    }
    for (const chunk of entry.chunks) yield chunk;
    this.records.push(replayAuditRecord(index, startedAt, startedTime, request, entry));
  }

  responseCache(): readonly ProviderResponseCacheEntry[] {
    return this.cache.entries;
  }
}

function replayAuditRecord(
  index: number,
  startedAt: string,
  startedTime: number,
  request: ModelProviderRequest,
  entry?: ProviderResponseCacheEntry,
  error?: unknown
): ProviderRequestAuditRecord {
  const completedTime = Date.now();
  return {
    index,
    status: error ? "failed" : "completed",
    executionMode: "replay",
    startedAt,
    completedAt: new Date(completedTime).toISOString(),
    durationMs: completedTime - startedTime,
    url: request.url.replace(/\/chat\/completions$/, "/chat/completions"),
    method: request.method,
    model: typeof request.body.model === "string" ? request.body.model : "",
    requestFingerprint: requestFingerprint(request),
    requestProfile: requestProfile(request),
    ...(request.body.tool_choice !== undefined ? { toolChoice: request.body.tool_choice as JsonValue } : {}),
    toolCount: Array.isArray(request.body.tools) ? request.body.tools.length : 0,
    ...(entry?.providerRequestId ? { providerRequestId: entry.providerRequestId } : {}),
    ...(entry ? { responseCacheKey: entry.responseCacheKey, replaySourceIndex: entry.index } : {}),
    chunkCount: entry?.chunkCount ?? 0,
    ...(error ? { errorCode: "PROVIDER_REPLAY_CACHE_MISS", errorMessage: error instanceof Error ? error.message : String(error) } : {}),
    redaction: { class: "internal", fields: ["errorMessage"] }
  };
}

function responseCacheEntry(record: ProviderRequestAuditRecord, chunks: readonly ModelProviderResponseChunk[]): ProviderResponseCacheEntry {
  return {
    schemaVersion: "1.0.0",
    index: record.index,
    responseCacheKey: record.responseCacheKey ?? responseCacheKey(record.index),
    requestFingerprint: record.requestFingerprint,
    requestProfile: record.requestProfile,
    ...(record.providerRequestId ? { providerRequestId: record.providerRequestId } : {}),
    chunkCount: chunks.length,
    chunks,
    redaction: { class: "internal", fields: ["chunks", "requestProfile"] }
  };
}

function responseCacheKey(index: number): string {
  return `deepseek-response-cache:${String(index).padStart(4, "0")}`;
}

function requestFingerprint(request: ModelProviderRequest): string {
  return `sha256:${hashJson({
    url: request.url.replace(/\/chat\/completions$/, "/chat/completions"),
    method: request.method,
    body: redactedRequestBodyForFingerprint(request.body)
  })}`;
}

function requestProfile(request: ModelProviderRequest): JsonObject {
  const body = request.body;
  const messages = Array.isArray(body.messages) ? body.messages.filter(isJsonObject) : [];
  return {
    model: typeof body.model === "string" ? body.model : "",
    stream: body.stream === true,
    toolChoice: body.tool_choice === undefined ? "unspecified" : body.tool_choice as JsonValue,
    toolNames: toolNamesFromBody(body),
    toolCount: Array.isArray(body.tools) ? body.tools.length : 0,
    messageCount: messages.length,
    messageRoles: messages.map((message) => String(message.role ?? "")),
    lastMessageRole: messages.length > 0 ? String(messages[messages.length - 1]?.role ?? "") : "",
    hasToolFeedback: messages.some((message) => message.role === "tool")
  };
}

function redactedRequestBodyForFingerprint(body: JsonObject): JsonObject {
  const messages = Array.isArray(body.messages) ? body.messages.filter(isJsonObject) : [];
  return {
    model: typeof body.model === "string" ? body.model : "",
    stream: body.stream === true,
    temperature: typeof body.temperature === "number" ? body.temperature : 0,
    tool_choice: body.tool_choice === undefined ? "unspecified" : body.tool_choice as JsonValue,
    tools: toolNamesFromBody(body),
    messages: messages.map((message) => ({
      role: String(message.role ?? ""),
      contentDigest: hashJson(message.content ?? null),
      toolCallsDigest: hashJson(message.tool_calls ?? []),
      toolCallIdDigest: hashJson(message.tool_call_id ?? "")
    }))
  };
}

function toolNamesFromBody(body: JsonObject): readonly string[] {
  const tools = Array.isArray(body.tools) ? body.tools.filter(isJsonObject) : [];
  return tools.map((tool) => {
    const fn = isJsonObject(tool.function) ? tool.function : {};
    return String(fn.name ?? tool.name ?? "");
  }).filter((name) => name.length > 0);
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}

function isProviderResponseCacheEntry(value: unknown): value is ProviderResponseCacheEntry {
  if (!isJsonObject(value)) return false;
  const rawChunks = Array.isArray(value.chunks) ? value.chunks : [];
  const chunks = rawChunks.filter(isJsonObject);
  return typeof value.index === "number"
    && typeof value.responseCacheKey === "string"
    && typeof value.requestFingerprint === "string"
    && isJsonObject(value.requestProfile)
    && chunks.length === rawChunks.length;
}

function parseServerSentEventLine(line: string): ModelProviderResponseChunk | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return undefined;
  const data = trimmed.slice("data:".length).trim();
  if (!data || data === "[DONE]") return undefined;
  try {
    return { data: JSON.parse(data) as JsonObject };
  } catch {
    return undefined;
  }
}

function redactProviderErrorBody(body: string): string {
  return body
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/g, "Bearer [REDACTED:token]")
    .replace(/\b(?:sk|ds)-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]")
    .slice(0, 500);
}

function firstHeader(headers: Record<string, string>, names: readonly string[]): string | undefined {
  for (const name of names) {
    const found = headers[name];
    if (found) return found;
  }
  return undefined;
}

function redactHeaders(headers: Record<string, string>): JsonObject {
  const safe: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (/authorization|token|key|cookie/i.test(key)) continue;
    if (/request|trace|rate|cf-ray|content-type|date|server/i.test(key)) safe[key] = value.slice(0, 200);
  }
  return safe;
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

await main();
