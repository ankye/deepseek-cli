import type {
  CapabilityExecutionContext,
  CapabilityExecutor,
  CapabilityExecutorBinding,
  CapabilityId,
  CapabilityManifest,
  JsonObject,
  MemoryScope,
  RuntimeDependencies,
  SerializableResult,
  SessionId,
  ToolFamilyConnectorKind,
  ToolFamilyDomainId,
  ToolFamilyId,
  ToolFamilyOperationProfile,
  ToolFamilyProviderSupportStatus,
  ToolFamilyRiskClass
} from "@deepseek/platform-contracts";
import {
  TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
  asId
} from "@deepseek/platform-contracts";
import {
  createCompactSummary,
  executeMemoryReadWrite
} from "@deepseek/memory-cache-management";
import { DeterministicProjectIndex } from "@deepseek/context-engine";
import { executeSessionResumeFork } from "@deepseek/session-store";
import { InMemoryWorktreeEnvironment } from "@deepseek/workspace-state-management";
import { createTraceBudgetEvidence } from "@deepseek/observability";
import {
  analyzeResourceScope,
  createSandboxAuditEvidence,
  createSandboxRequirement,
  createSecretRedactionDecision
} from "@deepseek/policy-sandbox";

const catalogVersion = "2026.05.runtime-platform";
const createdAt = new Date(0).toISOString();

export const platformFamilyCapabilityIds = {
  memoryReadWrite: asId<"capability">("memory-cache-management.memory-read-write"),
  contextProjectIndex: asId<"capability">("context-engine.project-index"),
  losslessContextGrep: asId<"capability">("memory-cache-management.lossless-context-grep"),
  losslessContextDescribe: asId<"capability">("memory-cache-management.lossless-context-describe"),
  losslessContextExpand: asId<"capability">("memory-cache-management.lossless-context-expand"),
  sessionResumeFork: asId<"capability">("session-store.resume-fork"),
  compactSummary: asId<"capability">("memory-cache-management.compact-summary"),
  remoteRuntime: asId<"capability">("platform-abstraction.remote-runtime"),
  worktreeEnvironment: asId<"capability">("workspace-state-management.worktree-environment"),
  scheduleSleepCron: asId<"capability">("concurrency-orchestration.sleep-cron"),
  observabilityTraceBudget: asId<"capability">("observability.trace-budget")
} as const;

export interface PlatformFamilyCapabilityDependencies extends Pick<
RuntimeDependencies,
"capabilities" | "memory" | "losslessContext" | "sessions" | "remote" | "concurrency" | "usage" | "observability"
> {}

export async function registerPlatformFamilyCapabilities(
  deps: PlatformFamilyCapabilityDependencies,
  workspaceRoot: string
): Promise<void> {
  for (const binding of createPlatformFamilyCapabilities(deps, workspaceRoot)) {
    if (await deps.capabilities.get(binding.manifest.id)) continue;
    await deps.capabilities.register(binding.manifest, binding.execute);
  }
}

export function platformFamilyManifests(workspaceRoot = "/workspace"): readonly CapabilityManifest[] {
  const deps = undefined as unknown as PlatformFamilyCapabilityDependencies;
  return createPlatformFamilyCapabilities(deps, workspaceRoot).map((binding) => binding.manifest);
}

function createPlatformFamilyCapabilities(
  deps: PlatformFamilyCapabilityDependencies,
  workspaceRoot: string
): readonly CapabilityExecutorBinding[] {
  const projectIndex = new DeterministicProjectIndex();
  const worktrees = new InMemoryWorktreeEnvironment();
  const hasLosslessContext = Boolean((deps as Partial<PlatformFamilyCapabilityDependencies> | undefined)?.losslessContext);
  return [
    definePlatformCapability({
      id: platformFamilyCapabilityIds.memoryReadWrite,
      name: "Memory read and write",
      description: "Read or write scoped memory with provenance, redaction, and replay fingerprints.",
      familyId: "memory.read-write",
      domainId: "memory-context-session",
      riskClass: "memory",
      sideEffect: "read",
      operationProfiles: ["memory", "read", "write"],
      hostRequirements: ["memory-store"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["memory:read", "memory:write"],
      resourceScopeInput: { workspaceRoot },
      execute: (input, context) => executeMemoryFamily(deps, input, context)
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.contextProjectIndex,
      name: "Project context index",
      description: "Refresh and query a deterministic project index with stale-index diagnostics.",
      familyId: "context.project-index",
      domainId: "memory-context-session",
      riskClass: "memory",
      sideEffect: "read",
      operationProfiles: ["memory", "read"],
      hostRequirements: ["context-index"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["context:index", "context:query"],
      execute: (input, context) => executeProjectIndexFamily(projectIndex, input, context, workspaceRoot)
    }),
    ...(hasLosslessContext ? losslessContextCapabilities(deps) : []),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.sessionResumeFork,
      name: "Session resume and fork",
      description: "Resume or fork a session with replay-safe lineage evidence.",
      familyId: "session.resume-fork",
      domainId: "memory-context-session",
      riskClass: "memory",
      sideEffect: "read",
      operationProfiles: ["memory", "model-feedback"],
      hostRequirements: ["session-store"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["session:read", "session:write"],
      resourceScopeInput: { workspaceRoot },
      execute: (input, context) => executeSessionFamily(deps, input, context)
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.compactSummary,
      name: "Compact summary",
      description: "Create a bounded compact summary with budget and replay metadata.",
      familyId: "compact.summary",
      domainId: "memory-context-session",
      riskClass: "memory",
      sideEffect: "read",
      operationProfiles: ["memory", "model-feedback"],
      hostRequirements: ["session-store"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["context:summary"],
      execute: (input, context) => executeCompactSummaryFamily(deps, input, context)
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.remoteRuntime,
      name: "Remote runtime",
      description: "Bind, reconnect, or cancel a fake-first remote runtime profile.",
      familyId: "remote.runtime",
      domainId: "remote-scheduling-observability",
      riskClass: "remote",
      sideEffect: "read",
      operationProfiles: ["remote", "connector"],
      hostRequirements: ["remote-runtime"],
      connectorProfile: "host",
      providerSupport: "connector",
      permissions: ["remote:connect"],
      resourceScopeInput: { workspaceRoot },
      execute: (input, context) => executeRemoteRuntimeFamily(deps, input, context)
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.worktreeEnvironment,
      name: "Worktree environment",
      description: "Create, list, and clean up governed fake worktree environments.",
      familyId: "worktree.environment",
      domainId: "remote-scheduling-observability",
      riskClass: "remote",
      sideEffect: "read",
      operationProfiles: ["remote", "write"],
      hostRequirements: ["filesystem", "git"],
      connectorProfile: "host",
      providerSupport: "connector",
      permissions: ["workspace:worktree"],
      resourceScopeInput: { workspaceRoot },
      execute: (input) => executeWorktreeFamily(worktrees, input, workspaceRoot)
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.scheduleSleepCron,
      name: "Schedule sleep and cron",
      description: "Run deterministic sleep/schedule/cancel operations through the concurrency orchestrator.",
      familyId: "schedule.sleep-cron",
      domainId: "remote-scheduling-observability",
      riskClass: "orchestration",
      sideEffect: "none",
      operationProfiles: ["schedule"],
      hostRequirements: ["scheduler"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["schedule:run"],
      execute: (input, context) => executeScheduleFamily(deps, input, context)
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.observabilityTraceBudget,
      name: "Observability trace and budget",
      description: "Query redacted trace, usage, budget, and diagnostic bundle evidence.",
      familyId: "observability.trace-budget",
      domainId: "remote-scheduling-observability",
      riskClass: "observability",
      sideEffect: "read",
      operationProfiles: ["observe"],
      hostRequirements: ["observability"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["observability:read", "usage:read"],
      execute: (input, context) => executeTraceBudgetFamily(deps, input, context)
    })
  ];
}

function losslessContextCapabilities(deps: PlatformFamilyCapabilityDependencies): readonly CapabilityExecutorBinding[] {
  return [
    definePlatformCapability({
      id: platformFamilyCapabilityIds.losslessContextGrep,
      name: "Lossless context grep",
      description: "Search durable lossless context nodes before relying on compressed history.",
      familyId: "context.project-index",
      domainId: "memory-context-session",
      riskClass: "memory",
      sideEffect: "read",
      operationProfiles: ["memory", "read"],
      hostRequirements: ["lossless-context"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["context:lcm:read"],
      execute: (input, context) => executeLosslessContextFamily(deps, input, context, "grep")
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.losslessContextDescribe,
      name: "Lossless context describe",
      description: "Describe a durable lossless context node and its DAG edges.",
      familyId: "context.project-index",
      domainId: "memory-context-session",
      riskClass: "memory",
      sideEffect: "read",
      operationProfiles: ["memory", "read"],
      hostRequirements: ["lossless-context"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["context:lcm:read"],
      execute: (input, context) => executeLosslessContextFamily(deps, input, context, "describe")
    }),
    definePlatformCapability({
      id: platformFamilyCapabilityIds.losslessContextExpand,
      name: "Lossless context expand",
      description: "Expand a summary or query back to original durable context nodes.",
      familyId: "context.project-index",
      domainId: "memory-context-session",
      riskClass: "memory",
      sideEffect: "read",
      operationProfiles: ["memory", "read"],
      hostRequirements: ["lossless-context"],
      connectorProfile: "built-in",
      providerSupport: "not_applicable",
      permissions: ["context:lcm:read"],
      execute: (input, context) => executeLosslessContextFamily(deps, input, context, "expand")
    })
  ];
}

function definePlatformCapability(definition: {
  readonly id: CapabilityId;
  readonly name: string;
  readonly description: string;
  readonly familyId: ToolFamilyId;
  readonly domainId: ToolFamilyDomainId;
  readonly riskClass: ToolFamilyRiskClass;
  readonly sideEffect: CapabilityManifest["sideEffect"];
  readonly operationProfiles: readonly ToolFamilyOperationProfile[];
  readonly hostRequirements: readonly string[];
  readonly connectorProfile: ToolFamilyConnectorKind;
  readonly providerSupport: ToolFamilyProviderSupportStatus;
  readonly permissions: readonly string[];
  readonly resourceScopeInput?: JsonObject;
  readonly execute: CapabilityExecutor;
}): CapabilityExecutorBinding {
  const resourceScope = analyzeResourceScope(definition.resourceScopeInput ?? {}, definition.sideEffect);
  const sandboxRequirements = createSandboxRequirement({
    sideEffect: definition.sideEffect,
    resourceScope,
    timeoutMs: 5_000,
    permissions: definition.permissions
  });
  return {
    manifest: {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      source: "@deepseek/runtime",
      version: "0.1.0",
      trust: "trusted",
      sideEffect: definition.sideEffect,
      permissions: definition.permissions,
      inputSchema: { type: "object", additionalProperties: true },
      outputSchema: { type: "object", additionalProperties: true },
      enabled: true,
      timeoutMs: 5_000,
      replayPolicy: { replayable: true, snapshot: `platform-family:${definition.familyId}`, deterministic: true },
      projection: {
        modelVisible: true,
        hostVisible: true,
        executorVisible: false,
        outputBounded: true,
        connectorTrust: definition.providerSupport === "connector" ? "trusted" : "trusted",
        providerSupport: definition.providerSupport,
        policyTags: ["platform-family", `family:${definition.familyId}`, `domain:${definition.domainId}`],
        agentScopeIds: ["default", definition.familyId]
      },
      toolFamily: {
        schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
        catalogVersion,
        domainId: definition.domainId,
        familyId: definition.familyId,
        toolId: String(definition.id),
        implementationState: "implemented",
        maturity: "baseline",
        riskClass: definition.riskClass,
        operationProfiles: definition.operationProfiles,
        hostRequirements: definition.hostRequirements,
        connectorProfile: definition.connectorProfile,
        scorecardRubricId: `rubric.${definition.familyId}.baseline`,
        redaction: { class: "internal" }
      },
      compatibility: { schemaVersion: "1.0.0", requiresRuntime: true },
      secretExposure: createSecretRedactionDecision("", { class: "public" }),
      resourceScope,
      sandboxRequirements,
      audit: createSandboxAuditEvidence({
        decision: "manifest",
        reasonCode: `manifest.${definition.familyId}`,
        subject: "@deepseek/runtime",
        resource: String(definition.id),
        sandboxProfile: sandboxRequirements.profile
      }),
      security: { modelVisible: true, hostVisible: true, executorVisible: false, outputRedaction: "secret-aware" }
    },
    execute: definition.execute
  };
}

async function executeMemoryFamily(
  deps: PlatformFamilyCapabilityDependencies,
  input: JsonObject,
  context: CapabilityExecutionContext
): Promise<SerializableResult> {
  const action = stringValue(input.action) === "write" ? "write" : "read";
  const scope = memoryScope(input.scope) ?? "session";
  const sessionId = optionalSessionId(input, context);
  if (action === "write") {
    const content = stringValue(input.content);
    if (!content) return failure("MEMORY_CONTENT_REQUIRED", "content is required for memory write.");
    return success(await executeMemoryReadWrite(deps.memory, {
      action,
      scope,
      content,
      ...(sessionId ? { sessionId } : {}),
      provenance: isJsonObject(input.provenance) ? input.provenance : { source: "runtime-family" }
    }));
  }
  return success(await executeMemoryReadWrite(deps.memory, {
    action,
    scope,
    ...(sessionId ? { sessionId } : {}),
    limit: boundedNumber(input.limit, 50, 0, 100)
  }));
}

function executeProjectIndexFamily(
  index: DeterministicProjectIndex,
  input: JsonObject,
  context: CapabilityExecutionContext,
  workspaceRoot: string
): Promise<SerializableResult> {
  const sessionId = requiredSessionId(input, context);
  const root = stringValue(input.workspaceRoot) ?? workspaceRoot;
  const documents = documentInputs(input.documents);
  const action = stringValue(input.action) ?? (documents.length > 0 ? "refresh" : "query");
  if (action === "refresh" || action === "index") {
    const indexId = stringValue(input.indexId);
    return Promise.resolve(success(index.refresh({
      sessionId,
      workspaceRoot: root,
      documents,
      ...(indexId ? { indexId } : {})
    })));
  }
  if (documents.length > 0) {
    const indexId = stringValue(input.indexId);
    index.refresh({ sessionId, workspaceRoot: root, documents, ...(indexId ? { indexId } : {}) });
  }
  const indexId = stringValue(input.indexId);
  const documentsFingerprint = stringValue(input.documentsFingerprint);
  return Promise.resolve(success(index.query({
    sessionId,
    workspaceRoot: root,
    query: stringValue(input.query) ?? "",
    limit: boundedNumber(input.limit, 20, 0, 100),
    ...(indexId ? { indexId } : {}),
    ...(documentsFingerprint ? { documentsFingerprint } : {})
  })));
}

async function executeLosslessContextFamily(
  deps: PlatformFamilyCapabilityDependencies,
  input: JsonObject,
  context: CapabilityExecutionContext,
  defaultAction: "grep" | "describe" | "expand"
): Promise<SerializableResult> {
  if (!deps.losslessContext) return failure("LOSSLESS_CONTEXT_UNAVAILABLE", "Lossless context manager is not configured.");
  const action = stringValue(input.action) === "describe" || stringValue(input.action) === "expand" || stringValue(input.action) === "grep"
    ? stringValue(input.action) as "grep" | "describe" | "expand"
    : defaultAction;
  if (action === "describe") {
    const nodeId = stringValue(input.nodeId);
    if (!nodeId) return failure("LOSSLESS_CONTEXT_NODE_REQUIRED", "nodeId is required for lossless context describe.");
    return success(await deps.losslessContext.describe({ nodeId }));
  }
  if (action === "expand") {
    const nodeId = stringValue(input.nodeId);
    const query = stringValue(input.query);
    if (!nodeId && !query) return failure("LOSSLESS_CONTEXT_EXPAND_TARGET_REQUIRED", "nodeId or query is required for lossless context expand.");
    const sessionId = optionalSessionId(input, context);
    return success(await deps.losslessContext.expand({
      ...(nodeId ? { nodeId } : {}),
      ...(query ? { query } : {}),
      ...(sessionId ? { sessionId } : {}),
      limit: boundedNumber(input.limit, 20, 0, 100)
    }));
  }
  const query = stringValue(input.query);
  if (!query) return failure("LOSSLESS_CONTEXT_QUERY_REQUIRED", "query is required for lossless context grep.");
  const sessionId = optionalSessionId(input, context);
  return success(await deps.losslessContext.grep({
    query,
    regex: input.regex === true,
    ...(sessionId ? { sessionId } : {}),
    limit: boundedNumber(input.limit, 20, 0, 100)
  }));
}

async function executeSessionFamily(
  deps: PlatformFamilyCapabilityDependencies,
  input: JsonObject,
  context: CapabilityExecutionContext
): Promise<SerializableResult> {
  const action = stringValue(input.action) === "fork" ? "fork" : "resume";
  if (action === "fork") {
    const parentSessionId = stringValue(input.parentSessionId) ?? context.envelope.sessionId;
    if (!parentSessionId) return failure("SESSION_PARENT_REQUIRED", "parentSessionId or runtime sessionId is required.");
    const reason = stringValue(input.reason);
    return success(await executeSessionResumeFork(deps.sessions, {
      action,
      parentSessionId: asId<"session">(parentSessionId),
      ...(typeof input.forkPointSequence === "number" ? { forkPointSequence: Math.max(0, Math.floor(input.forkPointSequence)) } : {}),
      ...(reason ? { reason } : {}),
      metadata: isJsonObject(input.metadata) ? input.metadata : { source: "runtime-family" }
    }));
  }
  const sessionId = stringValue(input.sessionId) ?? context.envelope.sessionId;
  if (!sessionId) return failure("SESSION_ID_REQUIRED", "sessionId is required for session resume.");
  return success(await executeSessionResumeFork(deps.sessions, { action, sessionId: asId<"session">(sessionId) }));
}

async function executeCompactSummaryFamily(
  deps: PlatformFamilyCapabilityDependencies,
  input: JsonObject,
  context: CapabilityExecutionContext
): Promise<SerializableResult> {
  const sessionId = requiredSessionId(input, context);
  let segments = stringArray(input.segments);
  const text = stringValue(input.text);
  if (segments.length === 0 && text) segments = [text];
  if (segments.length === 0) {
    const events = await deps.sessions.events(sessionId);
    segments = events.slice(-20).map((event) => `${event.kind}: ${JSON.stringify(event.payload)}`);
  }
  return success(createCompactSummary({
    sessionId,
    segments,
    maxTokens: boundedNumber(input.maxTokens, 2048, 0, 32_000),
    reservedOutputTokens: boundedNumber(input.reservedOutputTokens, 256, 0, 8_000)
  }));
}

async function executeRemoteRuntimeFamily(
  deps: PlatformFamilyCapabilityDependencies,
  input: JsonObject,
  context: CapabilityExecutionContext
): Promise<SerializableResult> {
  const action = stringValue(input.action) ?? "reconnect";
  const sessionId = requiredSessionId(input, context);
  const id = stringValue(input.id) ?? `remote:${hash(`${sessionId}:${context.envelope.invocationId}`)}`;
  if (action === "bind" || action === "connect") {
    const binding = {
      id,
      sessionId,
      transport: remoteTransport(input.transport),
      trustedDevice: isJsonObject(input.trustedDevice) ? input.trustedDevice : { kind: "fake", trusted: true }
    };
    await deps.remote.bind(binding);
    return success({ familyId: "remote.runtime", action: "bind", status: "bound", binding, evidence: evidence("remote.runtime", "platform-abstraction.remote-runtime") });
  }
  if (action === "cancel" || action === "disconnect") {
    await deps.remote.cancelRemote(id, stringValue(input.reason) ?? "runtime-family-cancel");
    return success({ familyId: "remote.runtime", action: "cancel", status: "cancelled", id, evidence: evidence("remote.runtime", "platform-abstraction.remote-runtime") });
  }
  const binding = await deps.remote.reconnect(id);
  return success({
    familyId: "remote.runtime",
    action: "reconnect",
    status: binding ? "connected" : "missing",
    id,
    binding: binding ? toJson(binding) : null,
    evidence: evidence("remote.runtime", "platform-abstraction.remote-runtime")
  });
}

function executeWorktreeFamily(
  worktrees: InMemoryWorktreeEnvironment,
  input: JsonObject,
  workspaceRoot: string
): Promise<SerializableResult> {
  const action = stringValue(input.action) ?? "list";
  const root = stringValue(input.workspaceRoot) ?? workspaceRoot;
  const worktreeId = stringValue(input.worktreeId) ?? `wt-${hash(root)}`;
  if (action === "create") {
    const path = stringValue(input.path) ?? `${root}/.worktrees/${worktreeId}`;
    return Promise.resolve(success(worktrees.execute({
      action,
      workspaceRoot: root,
      worktreeId,
      branch: stringValue(input.branch) ?? `family/${worktreeId}`,
      path,
      writeScope: stringArray(input.writeScope).length > 0 ? stringArray(input.writeScope) : [path]
    })));
  }
  if (action === "cleanup") {
    return Promise.resolve(success(worktrees.execute({ action, workspaceRoot: root, worktreeId })));
  }
  return Promise.resolve(success(worktrees.execute({ action: "list", workspaceRoot: root })));
}

async function executeScheduleFamily(
  deps: PlatformFamilyCapabilityDependencies,
  input: JsonObject,
  context: CapabilityExecutionContext
): Promise<SerializableResult> {
  const action = stringValue(input.action) ?? "sleep";
  const taskId = asId<"task">(stringValue(input.taskId) ?? `schedule-${hash(`${context.envelope.invocationId}:${action}`)}`);
  if (action === "cancel") {
    await deps.concurrency.cancel(taskId, stringValue(input.reason) ?? "cancelled-by-schedule-capability");
    return success({ familyId: "schedule.sleep-cron", action, taskId, events: eventsForTask(deps, taskId), evidence: evidence("schedule.sleep-cron", "concurrency-orchestration.sleep-cron") });
  }
  const delayMs = boundedNumber(input.delayMs, 0, 0, 1_000);
  const cron = stringValue(input.cron) ?? "";
  const result = {
    status: "completed",
    action,
    delayMs,
    cron,
    executedAt: createdAt,
    schedulerMode: "deterministic-fake-clock",
    traceId: context.trace.traceId
  };
  return success({ familyId: "schedule.sleep-cron", action, taskId, result, events: eventsForTask(deps, taskId), evidence: evidence("schedule.sleep-cron", "concurrency-orchestration.sleep-cron") });
}

async function executeTraceBudgetFamily(
  deps: PlatformFamilyCapabilityDependencies,
  input: JsonObject,
  context: CapabilityExecutionContext
): Promise<SerializableResult> {
  const sessionId = requiredSessionId(input, context);
  await deps.observability.emit({
    kind: "trace",
    at: createdAt,
    name: "tool-family.observability.trace-budget",
    fields: { familyId: "observability.trace-budget", invocationId: context.envelope.invocationId },
    trace: context.trace,
    dataPrivacyClass: "local",
    redaction: { class: "internal" }
  });
  const proposedUsage = usagePatch(input.proposedUsage);
  return success(await createTraceBudgetEvidence(deps.observability, deps.usage, {
    sessionId,
    reason: stringValue(input.reason) ?? "tool-family.trace-budget",
    maxRecords: boundedNumber(input.maxRecords, 50, 0, 500),
    ...(proposedUsage ? { proposedUsage } : {})
  }));
}

function requiredSessionId(input: JsonObject, context: CapabilityExecutionContext): SessionId {
  return asId<"session">(stringValue(input.sessionId) ?? context.envelope.sessionId ?? "session-runtime-family");
}

function optionalSessionId(input: JsonObject, context: CapabilityExecutionContext): SessionId | undefined {
  const sessionId = stringValue(input.sessionId) ?? context.envelope.sessionId;
  return sessionId ? asId<"session">(sessionId) : undefined;
}

function documentInputs(value: unknown): readonly { readonly path: string; readonly content: string; readonly language?: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((entry, index) => {
    const language = stringValue(entry.language);
    return {
      path: stringValue(entry.path) ?? `document-${index + 1}.txt`,
      content: stringValue(entry.content) ?? "",
      ...(language ? { language } : {})
    };
  });
}

function memoryScope(value: unknown): MemoryScope | undefined {
  return value === "working"
    || value === "session"
    || value === "project"
    || value === "user"
    || value === "semantic"
    || value === "skill"
    ? value
    : undefined;
}

function remoteTransport(value: unknown): "local-server" | "relay" | "ide-bridge" {
  return value === "relay" || value === "ide-bridge" || value === "local-server" ? value : "local-server";
}

function eventsForTask(deps: PlatformFamilyCapabilityDependencies, taskId: string): readonly JsonObject[] {
  return deps.concurrency.events().filter((event) => event.taskId === taskId).map((event) => ({ ...event }));
}

function evidence(familyId: ToolFamilyId, capabilityId: string): JsonObject {
  return {
    mode: "fake",
    providerNativeSupport: "not_applicable",
    capabilityId,
    familyId,
    replayRef: `replay:${capabilityId}`,
    createdAt,
    redaction: { class: "public" }
  };
}

function success(value: JsonObject): SerializableResult {
  return { ok: true, value };
}

function failure(code: string, message: string): SerializableResult {
  return { ok: false, error: { code, message, retryable: false, redaction: { class: "public" } } };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  const number = numberValue(value) ?? fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function usagePatch(value: unknown): Partial<import("@deepseek/platform-contracts").UsageRecord> | undefined {
  if (!isJsonObject(value)) return undefined;
  const inputTokens = numberValue(value.inputTokens);
  const outputTokens = numberValue(value.outputTokens);
  const costMicros = numberValue(value.costMicros);
  const elapsedMs = numberValue(value.elapsedMs);
  return {
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
    ...(costMicros !== undefined ? { costMicros } : {}),
    ...(elapsedMs !== undefined ? { elapsedMs } : {})
  };
}

function toJson(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function hash(value: string): string {
  let hashValue = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hashValue ^= value.charCodeAt(index);
    hashValue = Math.imul(hashValue, 16777619);
  }
  return `h${(hashValue >>> 0).toString(16)}`;
}
