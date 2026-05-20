import type {
  JsonObject,
  PolicyDecisionRecord,
  PolicyGateCoverageRecord,
  PolicyGateDiagnostic,
  ReadinessCheck,
  RiskyOperationFamily,
  RiskyOperationTaxonomyEntry
} from "@deepseek/platform-contracts";
import { POLICY_GATE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import {
  collectPolicyGateCoverageRecords,
  createPolicyGateFixtureRecords,
  listRiskyOperationTaxonomy
} from "@deepseek/policy-sandbox";

export interface PolicySandboxGateGovernanceEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ReadinessCheck["status"];
  readonly taxonomyCount: number;
  readonly coverageCount: number;
  readonly coveredCount: number;
  readonly deferredCount: number;
  readonly releaseBlockingMissingCount: number;
  readonly families: readonly RiskyOperationFamily[];
  readonly taxonomy: readonly RiskyOperationTaxonomyEntry[];
  readonly coverage: readonly PolicyGateCoverageRecord[];
  readonly fixtureRecords: readonly PolicyDecisionRecord[];
  readonly diagnostics: readonly PolicyGateDiagnostic[];
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

const requiredFamilies: readonly RiskyOperationFamily[] = [
  "file",
  "shell",
  "mcp",
  "plugin",
  "credential",
  "remote",
  "sandbox",
  "workspace-mutation"
];

const requiredFixtureDecisions = [
  "allow",
  "deny",
  "prompt",
  "redact",
  "audit-only",
  "bypass-detected"
] as const;

export function collectPolicySandboxGateGovernanceEvidence(): PolicySandboxGateGovernanceEvidence {
  const taxonomy = listRiskyOperationTaxonomy();
  const coverage = collectPolicyGateCoverageRecords();
  const fixtureRecords = createPolicyGateFixtureRecords();
  const families = [...new Set(taxonomy.map((entry) => entry.family))].sort() as readonly RiskyOperationFamily[];
  const diagnostics: PolicyGateDiagnostic[] = coverage.flatMap((record) => [...record.diagnostics]);

  for (const family of requiredFamilies) {
    if (!families.includes(family)) {
      diagnostics.push(diagnostic("POLICY_GATE_FAMILY_MISSING", "release-blocking", `taxonomy.${family}`, family, `Risky operation family is missing from policy taxonomy: ${family}.`, true));
    }
  }

  for (const decision of requiredFixtureDecisions) {
    if (!fixtureRecords.some((record) => record.decision === decision)) {
      diagnostics.push(diagnostic("POLICY_GATE_FIXTURE_MISSING", "release-blocking", `fixture.${decision}`, "sandbox", `Policy fixture is missing decision outcome: ${decision}.`, true));
    }
  }

  for (const record of coverage) {
    if (record.releaseGate === "release-blocking" && record.coverage !== "covered") {
      diagnostics.push(diagnostic("POLICY_GATE_COVERAGE_MISSING", "release-blocking", record.operationId, record.operationFamily, `Release-blocking operation lacks policy coverage: ${record.operationId}.`, true));
    }
  }

  const releaseBlockingMissingCount = diagnostics.filter((item) => item.releaseBlocking).length;
  return {
    schemaVersion: POLICY_GATE_SCHEMA_VERSION,
    status: releaseBlockingMissingCount === 0 ? "pass" : "fail",
    taxonomyCount: taxonomy.length,
    coverageCount: coverage.length,
    coveredCount: coverage.filter((record) => record.coverage === "covered").length,
    deferredCount: coverage.filter((record) => record.coverage === "deferred").length,
    releaseBlockingMissingCount,
    families,
    taxonomy,
    coverage,
    fixtureRecords,
    diagnostics,
    redaction: { class: "internal", fields: ["taxonomy.examples", "coverage.entrypoints", "coverage.evidenceIds", "fixtureRecords.scope", "fixtureRecords.reason", "diagnostics.message"] }
  };
}

export function policySandboxGateGovernanceCheck(
  evidence: PolicySandboxGateGovernanceEvidence = collectPolicySandboxGateGovernanceEvidence()
): ReadinessCheck {
  return {
    id: "governance.policy-sandbox-gates",
    label: "Policy sandbox gates",
    status: evidence.status,
    message: `Policy gates governed: families=${evidence.families.length}, covered=${evidence.coveredCount}, deferred=${evidence.deferredCount}, release-blocking-missing=${evidence.releaseBlockingMissingCount}.`,
    suggestedActions: evidence.status === "pass" ? [] : ["Fix release-blocking policy handoff gaps before promoting risky file, shell, MCP, plugin, credential, remote, sandbox, or workspace mutation capabilities."],
    metadata: { evidence },
    redaction: { class: "internal", fields: ["metadata.evidence.taxonomy.examples", "metadata.evidence.coverage.evidenceIds", "metadata.evidence.fixtureRecords.reason"] }
  };
}

function diagnostic(
  code: string,
  severity: PolicyGateDiagnostic["severity"],
  operationId: string,
  operationFamily: RiskyOperationFamily,
  message: string,
  releaseBlocking: boolean
): PolicyGateDiagnostic {
  return {
    code,
    severity,
    operationId,
    operationFamily,
    message,
    releaseBlocking,
    redaction: { class: "internal", fields: ["message"] }
  };
}
