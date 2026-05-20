import type {
  AgentQuotaKind,
  AgentScopeDiagnostic,
  AgentScopeEvaluationStatus,
  AgentScopeGovernanceFixture,
  JsonObject,
  ReadinessCheck
} from "@deepseek/platform-contracts";
import { AGENT_NAMESPACE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { createAgentScopeGovernanceFixtures } from "@deepseek/agent-management";

export interface AgentNamespaceQuotaGovernanceEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ReadinessCheck["status"];
  readonly fixtureCount: number;
  readonly namespaceCount: number;
  readonly quotaKinds: readonly AgentQuotaKind[];
  readonly evaluationStatuses: readonly AgentScopeEvaluationStatus[];
  readonly requiredScenarios: readonly AgentScopeGovernanceFixture["scenario"][];
  readonly fixtures: readonly AgentScopeGovernanceFixture[];
  readonly diagnostics: readonly AgentScopeDiagnostic[];
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

const requiredScenarios: readonly AgentScopeGovernanceFixture["scenario"][] = [
  "allowed-write",
  "denied-write",
  "quota-exhaustion",
  "cancellation",
  "repair-scope"
];

const requiredQuotaKinds: readonly AgentQuotaKind[] = [
  "tokens",
  "tool-calls",
  "wall-clock-ms",
  "retries",
  "file-mutations"
];

export function collectAgentNamespaceQuotaGovernanceEvidence(): AgentNamespaceQuotaGovernanceEvidence {
  const fixtures = createAgentScopeGovernanceFixtures();
  const namespaces = [...new Map(fixtures.map((fixture) => [fixture.namespace.namespaceId, fixture.namespace])).values()];
  const quotaKinds = [...new Set(namespaces.flatMap((namespace) => namespace.quotas.map((quota) => quota.kind)))].sort() as readonly AgentQuotaKind[];
  const evaluationStatuses = [...new Set(fixtures.map((fixture) => fixture.result.status))].sort() as readonly AgentScopeEvaluationStatus[];
  const diagnostics: AgentScopeDiagnostic[] = [];

  for (const scenario of requiredScenarios) {
    if (!fixtures.some((fixture) => fixture.scenario === scenario)) {
      diagnostics.push(diagnostic("AGENT_SCOPE_FIXTURE_MISSING", "release-blocking", "namespace", `Agent scope fixture is missing scenario: ${scenario}.`));
    }
  }
  for (const kind of requiredQuotaKinds) {
    if (!quotaKinds.includes(kind)) {
      diagnostics.push(diagnostic("AGENT_QUOTA_KIND_MISSING", "release-blocking", "quota", `Agent quota kind is missing from namespace evidence: ${kind}.`, kind));
    }
  }
  if (!fixtures.some((fixture) => fixture.result.status === "denied")) {
    diagnostics.push(diagnostic("AGENT_SCOPE_DENIAL_EVIDENCE_MISSING", "release-blocking", "namespace", "Agent namespace evidence must include a denied write."));
  }
  if (!fixtures.some((fixture) => fixture.result.status === "quota-exhausted")) {
    diagnostics.push(diagnostic("AGENT_QUOTA_EXHAUSTION_EVIDENCE_MISSING", "release-blocking", "quota", "Agent namespace evidence must include quota exhaustion."));
  }

  return {
    schemaVersion: AGENT_NAMESPACE_SCHEMA_VERSION,
    status: diagnostics.some((item) => item.releaseBlocking) ? "fail" : "pass",
    fixtureCount: fixtures.length,
    namespaceCount: namespaces.length,
    quotaKinds,
    evaluationStatuses,
    requiredScenarios,
    fixtures,
    diagnostics,
    redaction: { class: "internal", fields: ["fixtures.namespace.paths.path", "fixtures.operation.path", "fixtures.result.diagnostics.message", "diagnostics.message"] }
  };
}

export function agentNamespaceQuotaGovernanceCheck(
  evidence: AgentNamespaceQuotaGovernanceEvidence = collectAgentNamespaceQuotaGovernanceEvidence()
): ReadinessCheck {
  return {
    id: "governance.agent-namespace-quotas",
    label: "Agent namespace quotas",
    status: evidence.status,
    message: `Agent scopes governed: fixtures=${evidence.fixtureCount}, namespaces=${evidence.namespaceCount}, quota-kinds=${evidence.quotaKinds.length}, statuses=${evidence.evaluationStatuses.join(",")}.`,
    suggestedActions: evidence.status === "pass" ? [] : ["Fix agent namespace, quota, lineage, or policy escalation evidence before enabling write-capable multi-agent defaults."],
    metadata: { evidence },
    redaction: { class: "internal", fields: ["metadata.evidence.fixtures.namespace.paths.path", "metadata.evidence.fixtures.operation.path", "metadata.evidence.diagnostics.message"] }
  };
}

function diagnostic(
  code: string,
  severity: AgentScopeDiagnostic["severity"],
  category: AgentScopeDiagnostic["category"],
  message: string,
  quotaKind?: AgentQuotaKind
): AgentScopeDiagnostic {
  return {
    code,
    severity,
    category,
    message,
    ...(quotaKind ? { quotaKind } : {}),
    releaseBlocking: severity === "release-blocking",
    redaction: { class: "internal", fields: ["message"] }
  };
}
