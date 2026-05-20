import type {
  AgentDefinition,
  AgentLineageAuthority,
  AgentModeName,
  AgentNamespace,
  AgentNamespaceMemoryAccess,
  AgentNamespaceNetworkAccess,
  AgentNamespacePathAccess,
  AgentNamespaceProjectionOptions,
  AgentNamespaceToolRule,
  AgentQuotaKind,
  AgentQuotaLimit,
  AgentScopeDiagnostic,
  AgentScopeEvaluationRequest,
  AgentScopeEvaluationResult,
  AgentScopeGovernanceFixture
} from "@deepseek/platform-contracts";
import { AGENT_COMPATIBILITY, AGENT_NAMESPACE_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";

const writeCapableModes = new Set<AgentModeName>(["implementer", "worker", "repair"]);

const quotaKinds: readonly AgentQuotaKind[] = [
  "tokens",
  "tool-calls",
  "wall-clock-ms",
  "retries",
  "file-mutations"
];

const defaultQuotaLimits: Record<AgentModeName, Record<AgentQuotaKind, number>> = {
  default: { "tokens": 24_000, "tool-calls": 8, "wall-clock-ms": 120_000, retries: 0, "file-mutations": 0 },
  evidence: { "tokens": 16_000, "tool-calls": 8, "wall-clock-ms": 120_000, retries: 0, "file-mutations": 0 },
  planner: { "tokens": 16_000, "tool-calls": 6, "wall-clock-ms": 120_000, retries: 0, "file-mutations": 0 },
  implementer: { "tokens": 32_000, "tool-calls": 16, "wall-clock-ms": 300_000, retries: 1, "file-mutations": 8 },
  verifier: { "tokens": 18_000, "tool-calls": 12, "wall-clock-ms": 180_000, retries: 0, "file-mutations": 0 },
  coordinator: { "tokens": 20_000, "tool-calls": 16, "wall-clock-ms": 240_000, retries: 0, "file-mutations": 0 },
  worker: { "tokens": 24_000, "tool-calls": 12, "wall-clock-ms": 240_000, retries: 1, "file-mutations": 4 },
  repair: { "tokens": 18_000, "tool-calls": 10, "wall-clock-ms": 180_000, retries: 1, "file-mutations": 3 },
  synthesis: { "tokens": 16_000, "tool-calls": 6, "wall-clock-ms": 120_000, retries: 0, "file-mutations": 0 }
};

export function projectAgentNamespace(
  definition: AgentDefinition,
  mode: AgentModeName,
  options: AgentNamespaceProjectionOptions = {}
): AgentNamespace {
  const delegatedPaths = nonEmptyUnique(options.delegatedPaths ?? []);
  const delegatedTools = nonEmptyUnique(options.delegatedTools ?? definition.scopes.commands);
  const quotas = mergeQuotas(defaultQuotasFor(mode), options.quotas ?? []);
  const paths = pathRulesFor(mode, delegatedPaths);
  const tools = toolRulesFor(delegatedTools, mode);
  const delegatedScopeHash = stableHash(JSON.stringify({ mode, paths, tools, quotas }));
  const authority: AgentLineageAuthority = options.policyDecision
    ? "policy-expanded"
    : options.parentAgentId || options.parentAgentInstanceId || options.parentSessionId
      ? "narrowed"
      : "root";
  const namespaceId = `agent-namespace:${stableHash(JSON.stringify({
    agentId: definition.id,
    mode,
    workOrderId: options.workOrderId ?? "",
    parentAgentId: options.parentAgentId ?? "",
    parentAgentInstanceId: options.parentAgentInstanceId ?? "",
    parentSessionId: options.parentSessionId ?? "",
    delegatedScopeHash
  }))}`;

  return {
    schemaVersion: AGENT_NAMESPACE_SCHEMA_VERSION,
    namespaceId,
    mode,
    paths,
    tools,
    memory: memoryRulesFor(mode),
    scratchpad: {
      scopeId: `scratchpad:${namespaceId}`,
      maxBytes: mode === "coordinator" ? 24_000 : 12_000,
      persistence: mode === "repair" ? "checkpointed" : "session"
    },
    checkpoints: {
      policy: writeCapableModes.has(mode) ? "create" : mode === "verifier" ? "read" : "none",
      maxCheckpoints: writeCapableModes.has(mode) ? 2 : 0
    },
    environment: {
      cwd: ".",
      allowedEnvKeys: ["PATH", "HOME", "USERPROFILE", "TMP", "TEMP"],
      redactedEnvKeys: ["DEEPSEEK_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
      network: networkAccessFor(mode)
    },
    quotas,
    lineage: {
      schemaVersion: AGENT_NAMESPACE_SCHEMA_VERSION,
      lineageId: `agent-lineage:${stableHash(`${namespaceId}:${delegatedScopeHash}`)}`,
      ...(options.outputOwnerAgentId ?? options.parentAgentId ? { ownerAgentId: options.outputOwnerAgentId ?? options.parentAgentId } : {}),
      ...(options.parentAgentId ? { parentAgentId: options.parentAgentId } : {}),
      ...(options.parentAgentInstanceId ? { parentAgentInstanceId: options.parentAgentInstanceId } : {}),
      ...(options.parentSessionId ? { parentSessionId: options.parentSessionId } : {}),
      ...(options.childSessionId ? { childSessionId: options.childSessionId } : {}),
      ...(options.workOrderId ? { workOrderId: options.workOrderId } : {}),
      delegatedScopeHash,
      ...(options.outputOwnerAgentId ?? options.parentAgentId ? { outputOwnerAgentId: options.outputOwnerAgentId ?? options.parentAgentId } : {}),
      mergeResponsibility: options.mergeResponsibility ?? (mode === "coordinator" ? "coordinator" : "parent"),
      authority,
      ...(options.policyDecision ? { policyDecisionId: options.policyDecision.recordId } : {}),
      repairAuthority: mode === "repair" ? "bounded-write" : "none",
      verifierAuthority: mode === "verifier" ? "test-runner" : "none",
      redaction: { class: "internal", fields: ["delegatedScopeHash"] }
    },
    diagnostics: [],
    redaction: { class: "internal", fields: ["paths.path", "environment.allowedEnvKeys", "environment.redactedEnvKeys", "lineage.delegatedScopeHash"] },
    compatibility: AGENT_COMPATIBILITY
  };
}

export function evaluateAgentScope(request: AgentScopeEvaluationRequest): AgentScopeEvaluationResult {
  const diagnostics: AgentScopeDiagnostic[] = [];

  if (request.operation === "file.read" || request.operation === "file.write") {
    const path = request.path ?? "";
    const access: AgentNamespacePathAccess = request.operation === "file.write" ? "write" : "read";
    if (!path || !pathAllowed(request.namespace, path, access)) {
      diagnostics.push(scopeDiagnostic(
        "AGENT_SCOPE_PATH_DENIED",
        "release-blocking",
        "namespace",
        `Agent namespace does not allow ${access} access to the requested path.`,
        request.namespace.namespaceId
      ));
      return resultFor(request, "denied", diagnostics, false);
    }
  }

  if (request.operation === "tool.call" && request.tool && !toolAllowed(request.namespace.tools, request.tool)) {
    diagnostics.push(scopeDiagnostic(
      "AGENT_SCOPE_TOOL_DENIED",
      "release-blocking",
      "namespace",
      "Agent namespace does not allow the requested tool.",
      request.namespace.namespaceId
    ));
    return resultFor(request, "denied", diagnostics, false);
  }

  if (request.operation === "quota.consume") {
    const quota = request.namespace.quotas.find((item) => item.kind === request.quotaKind);
    const requested = request.requested ?? 1;
    const consumed = request.consumed ?? quota?.consumed ?? 0;
    if (!quota || consumed + requested > quota.limit) {
      diagnostics.push(scopeDiagnostic(
        "AGENT_QUOTA_EXHAUSTED",
        "release-blocking",
        "quota",
        "Agent quota is exhausted for the requested operation.",
        request.namespace.namespaceId,
        request.quotaKind
      ));
      return resultFor(request, "quota-exhausted", diagnostics, false);
    }
  }

  if (request.operation === "namespace.expand") {
    const expanded = request.parentNamespace && request.requestedNamespace
      ? isAgentNamespaceExpansion(request.parentNamespace, request.requestedNamespace)
      : false;
    if (expanded && !request.policyDecision) {
      diagnostics.push(scopeDiagnostic(
        "AGENT_NAMESPACE_POLICY_REQUIRED",
        "release-blocking",
        "policy",
        "Child agent requested broader authority than its parent delegated.",
        request.namespace.namespaceId
      ));
      return resultFor(request, "requires-policy", diagnostics, true);
    }
    if (expanded && request.policyDecision && request.policyDecision.decision !== "allow" && request.policyDecision.decision !== "audit-only") {
      diagnostics.push(scopeDiagnostic(
        "AGENT_NAMESPACE_POLICY_DENIED",
        "release-blocking",
        "policy",
        "Policy denied child agent namespace expansion.",
        request.namespace.namespaceId
      ));
      return resultFor(request, "denied", diagnostics, false);
    }
  }

  if (!request.namespace.lineage.ownerAgentId && request.namespace.lineage.authority !== "root") {
    diagnostics.push(scopeDiagnostic(
      "AGENT_LINEAGE_OWNER_MISSING",
      "warning",
      "lineage",
      "Delegated agent namespace lacks an explicit output owner.",
      request.namespace.namespaceId
    ));
  }

  return resultFor(request, "allowed", diagnostics, false);
}

export function isAgentNamespaceExpansion(parent: AgentNamespace, child: AgentNamespace): boolean {
  if (child.environment.network === "any" && parent.environment.network !== "any") return true;
  for (const childPath of child.paths) {
    for (const access of childPath.access) {
      if (!pathAllowed(parent, childPath.path, access)) return true;
    }
  }
  for (const childTool of child.tools.filter((tool) => tool.access === "allow")) {
    if (!toolAllowed(parent.tools, childTool.tool)) return true;
  }
  for (const childQuota of child.quotas) {
    const parentQuota = parent.quotas.find((quota) => quota.kind === childQuota.kind);
    if (!parentQuota || childQuota.limit > parentQuota.limit) return true;
  }
  return memoryBroader(parent, child);
}

export function createAgentScopeGovernanceFixtures(): readonly AgentScopeGovernanceFixture[] {
  const definition = fixtureDefinition();
  const parent = projectAgentNamespace(definition, "coordinator", {
    delegatedPaths: ["README.md", "src/allowed.ts"],
    delegatedTools: ["agent.spawn", "file.read", "file.edit", "test.run"],
    parentAgentId: asId<"agent">("agent-fixture-parent"),
    childSessionId: asId<"session">("session-fixture-parent"),
    workOrderId: "work-order:fixture-parent"
  });
  const worker = projectAgentNamespace(definition, "worker", {
    delegatedPaths: ["src/allowed.ts"],
    delegatedTools: ["file.read", "file.edit", "test.run"],
    parentAgentId: asId<"agent">("agent-fixture-parent"),
    parentAgentInstanceId: asId<"agentInstance">("agent-instance-fixture-parent"),
    parentSessionId: asId<"session">("session-fixture-parent"),
    childSessionId: asId<"session">("session-fixture-worker"),
    workOrderId: "work-order:fixture-worker"
  });
  const repair = projectAgentNamespace(definition, "repair", {
    delegatedPaths: ["src/allowed.ts"],
    delegatedTools: ["file.read", "file.edit", "test.run"],
    parentAgentId: asId<"agent">("agent-fixture-parent"),
    workOrderId: "work-order:fixture-repair"
  });
  const allowedOperation = { namespace: worker, operation: "file.write" as const, path: "src/allowed.ts" };
  const deniedOperation = { namespace: worker, operation: "file.write" as const, path: "src/denied.ts" };
  const quotaOperation = { namespace: worker, operation: "quota.consume" as const, quotaKind: "file-mutations" as const, requested: 10, consumed: 0 };
  const cancellationOperation = { namespace: worker, operation: "lifecycle.cancel" as const, reason: "manual-stop" };
  const repairOperation = { namespace: repair, operation: "file.write" as const, path: "src/allowed.ts" };
  return [
    fixture("agent-scope.fixture.allowed-write", "allowed-write", allowedOperation, evaluateAgentScope(allowedOperation)),
    fixture("agent-scope.fixture.denied-write", "denied-write", deniedOperation, evaluateAgentScope(deniedOperation)),
    fixture("agent-scope.fixture.quota-exhaustion", "quota-exhaustion", quotaOperation, evaluateAgentScope(quotaOperation)),
    fixture("agent-scope.fixture.cancellation", "cancellation", cancellationOperation, evaluateAgentScope(cancellationOperation)),
    fixture("agent-scope.fixture.repair-scope", "repair-scope", repairOperation, {
      ...evaluateAgentScope(repairOperation),
      diagnostics: isAgentNamespaceExpansion(parent, repair) ? [scopeDiagnostic("AGENT_REPAIR_SCOPE_EXPANSION", "warning", "lineage", "Repair scope must remain within parent delegated scope.", repair.namespaceId)] : []
    })
  ];
}

function fixture(
  fixtureId: string,
  scenario: AgentScopeGovernanceFixture["scenario"],
  operation: AgentScopeEvaluationRequest,
  result: AgentScopeEvaluationResult
): AgentScopeGovernanceFixture {
  return {
    schemaVersion: AGENT_NAMESPACE_SCHEMA_VERSION,
    fixtureId,
    scenario,
    namespace: operation.namespace,
    operation,
    result,
    redaction: { class: "internal", fields: ["namespace.paths.path", "operation.path", "result.diagnostics.message"] }
  };
}

function resultFor(
  request: AgentScopeEvaluationRequest,
  status: AgentScopeEvaluationResult["status"],
  diagnostics: readonly AgentScopeDiagnostic[],
  policyRequired: boolean
): AgentScopeEvaluationResult {
  return {
    schemaVersion: AGENT_NAMESPACE_SCHEMA_VERSION,
    status,
    namespaceId: request.namespace.namespaceId,
    operation: request.operation,
    allowed: status === "allowed",
    policyRequired,
    diagnostics,
    ...(request.policyDecision ? { policyDecision: request.policyDecision } : {}),
    redaction: { class: "internal", fields: ["diagnostics.message", "policyDecision.reason"] }
  };
}

function pathRulesFor(mode: AgentModeName, delegatedPaths: readonly string[]) {
  const paths = delegatedPaths.length > 0 ? delegatedPaths : writeCapableModes.has(mode) ? ["."] : ["."];
  const access: readonly AgentNamespacePathAccess[] = writeCapableModes.has(mode) ? ["read", "write"] : ["read"];
  return paths.map((path) => ({ path, access, recursive: path === "." || path.endsWith("/") }));
}

function toolRulesFor(tools: readonly string[], mode: AgentModeName): readonly AgentNamespaceToolRule[] {
  const allowed = tools.length > 0 ? tools : ["file.read", "file.list"];
  const rules: AgentNamespaceToolRule[] = allowed.map((tool) => ({ tool, access: "allow" }));
  if (mode === "verifier" || mode === "planner" || mode === "evidence" || mode === "synthesis") {
    rules.push({ tool: "file.write", access: "deny" }, { tool: "file.edit", access: "deny" });
  }
  return rules;
}

function memoryRulesFor(mode: AgentModeName) {
  const projectAccess: AgentNamespaceMemoryAccess = writeCapableModes.has(mode) ? "read-write" : "read";
  return [
    { scope: "working", access: "read-write" as const },
    { scope: "session", access: "read-write" as const },
    { scope: "project", access: projectAccess }
  ];
}

function networkAccessFor(mode: AgentModeName): AgentNamespaceNetworkAccess {
  return mode === "evidence" || mode === "verifier" ? "scoped" : "none";
}

function defaultQuotasFor(mode: AgentModeName): readonly AgentQuotaLimit[] {
  const limits = defaultQuotaLimits[mode];
  return quotaKinds.map((kind) => quota(kind, limits[kind], 0));
}

function mergeQuotas(base: readonly AgentQuotaLimit[], overrides: readonly AgentQuotaLimit[]): readonly AgentQuotaLimit[] {
  const byKind = new Map<AgentQuotaKind, AgentQuotaLimit>();
  for (const item of base) byKind.set(item.kind, item);
  for (const item of overrides) byKind.set(item.kind, item);
  return quotaKinds.map((kind) => byKind.get(kind) ?? quota(kind, 0, 0));
}

function quota(kind: AgentQuotaKind, limit: number, consumed: number): AgentQuotaLimit {
  return { kind, limit, consumed, remaining: Math.max(0, limit - consumed) };
}

function pathAllowed(namespace: AgentNamespace, path: string, access: AgentNamespacePathAccess): boolean {
  return namespace.paths.some((rule) => rule.access.includes(access) && pathMatches(rule.path, path, rule.recursive));
}

function pathMatches(rulePath: string, path: string, recursive: boolean): boolean {
  const normalizedRule = normalizePath(rulePath);
  const normalizedPath = normalizePath(path);
  if (normalizedRule === "*" || normalizedRule === ".") return true;
  if (normalizedPath === normalizedRule) return true;
  return recursive && normalizedPath.startsWith(`${normalizedRule.replace(/\/$/, "")}/`);
}

function toolAllowed(tools: readonly AgentNamespaceToolRule[], tool: string): boolean {
  const denied = tools.some((rule) => rule.access === "deny" && (rule.tool === tool || rule.tool === "*"));
  if (denied) return false;
  return tools.some((rule) => rule.access === "allow" && (rule.tool === tool || rule.tool === "*"));
}

function memoryBroader(parent: AgentNamespace, child: AgentNamespace): boolean {
  const rank: Record<AgentNamespaceMemoryAccess, number> = { none: 0, read: 1, write: 2, "read-write": 3 };
  for (const childMemory of child.memory) {
    const parentMemory = parent.memory.find((item) => item.scope === childMemory.scope);
    if (!parentMemory || rank[childMemory.access] > rank[parentMemory.access]) return true;
  }
  return false;
}

function scopeDiagnostic(
  code: string,
  severity: AgentScopeDiagnostic["severity"],
  category: AgentScopeDiagnostic["category"],
  message: string,
  namespaceId: string,
  quotaKind?: AgentQuotaKind
): AgentScopeDiagnostic {
  return {
    code,
    severity,
    category,
    message,
    namespaceId,
    ...(quotaKind ? { quotaKind } : {}),
    releaseBlocking: severity === "release-blocking",
    redaction: { class: "internal", fields: ["message"] }
  };
}

function nonEmptyUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function fixtureDefinition(): AgentDefinition {
  return {
    schemaVersion: "1.0.0",
    id: asId<"agent">("agent-scope-fixture"),
    name: "scope-fixture",
    version: "1.0.0",
    source: "built-in",
    modelProfileId: asId<"modelProfile">("model-fixture"),
    promptProfile: "scope-fixture",
    productRole: "worker",
    defaultAgentMode: "worker",
    supportedAgentModes: ["coordinator", "worker", "repair", "verifier", "implementer"],
    scopes: {
      capabilities: ["file.read", "file.edit", "file.write", "test.run", "agent.spawn"],
      context: ["workspace", "session"],
      memory: ["working", "session", "project"],
      policy: ["default", "delegation"],
      skills: ["trusted"],
      commands: ["file.read", "file.edit", "file.write", "test.run", "agent.spawn"],
      hooks: ["trusted"]
    },
    delegation: {
      canDelegate: true,
      acceptsDelegation: true,
      maxWorkers: 2,
      allowedChildModes: ["worker", "repair", "verifier"],
      requiredWorkOrderFields: ["purpose", "originalUserGoal", "taskSummary"],
      resultRouting: "structured-event"
    },
    redaction: { class: "internal" },
    compatibility: {
      schemaVersion: "1.0.0",
      supportedAgentModes: ["coordinator", "worker", "repair", "verifier", "implementer"],
      defaultAgentMode: "worker",
      modeContractVersion: "1.0.0",
      redaction: { class: "internal" },
      compatibility: AGENT_COMPATIBILITY
    }
  };
}
