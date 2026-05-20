import type {
  GovernedModuleContractPathKind,
  GovernedModuleDiagnostic,
  GovernedModuleGovernanceFixture,
  GovernedModuleKind,
  JsonObject,
  ReadinessCheck
} from "@deepseek/platform-contracts";
import { GOVERNED_MODULE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import {
  GOVERNED_MODULE_REQUIRED_SCENARIOS,
  createGovernedModuleFixtures
} from "@deepseek/plugin-system";

export interface PluginModuleBoundaryGovernanceEvidence extends JsonObject {
  readonly schemaVersion: string;
  readonly status: ReadinessCheck["status"];
  readonly fixtureCount: number;
  readonly moduleKinds: readonly GovernedModuleKind[];
  readonly contractPathKinds: readonly GovernedModuleContractPathKind[];
  readonly requiredScenarios: readonly GovernedModuleGovernanceFixture["scenario"][];
  readonly coveredScenarios: readonly GovernedModuleGovernanceFixture["scenario"][];
  readonly policyDecisionKinds: readonly string[];
  readonly lifecycleRecordCount: number;
  readonly missingPermissionFixtureCount: number;
  readonly privateObjectFixtureCount: number;
  readonly disabledFixtureCount: number;
  readonly unloadedFixtureCount: number;
  readonly fixtures: readonly GovernedModuleGovernanceFixture[];
  readonly fixtureDiagnostics: readonly GovernedModuleDiagnostic[];
  readonly diagnostics: readonly GovernedModuleDiagnostic[];
  readonly redaction: { readonly class: "internal"; readonly fields: readonly string[] };
}

export function collectPluginModuleBoundaryGovernanceEvidence(): PluginModuleBoundaryGovernanceEvidence {
  const fixtures = createGovernedModuleFixtures();
  const fixtureDiagnostics = fixtures.flatMap((fixture) => [
    ...fixture.diagnostics,
    ...fixture.policyEvaluations.flatMap((evaluation) => evaluation.diagnostics),
    ...fixture.lifecycleRecords.flatMap((record) => record.diagnostics)
  ]);
  const diagnostics: GovernedModuleDiagnostic[] = [];
  const coveredScenarios = [...new Set(fixtures.map((fixture) => fixture.scenario))].sort() as readonly GovernedModuleGovernanceFixture["scenario"][];

  for (const scenario of GOVERNED_MODULE_REQUIRED_SCENARIOS) {
    if (!coveredScenarios.includes(scenario)) {
      diagnostics.push(diagnostic("GOVERNED_MODULE_FIXTURE_MISSING", "release-blocking", "manifest", `Governed module fixture is missing scenario: ${scenario}.`));
    }
  }
  if (!fixtures.some((fixture) => fixture.policyEvaluations.some((evaluation) => evaluation.missingPermissions.length > 0 && evaluation.decision === "deny"))) {
    diagnostics.push(diagnostic("GOVERNED_MODULE_PERMISSION_DENIAL_MISSING", "release-blocking", "permission", "Governed module evidence must include a missing-permission policy denial."));
  }
  if (!fixtureDiagnostics.some((item) => item.category === "private-access")) {
    diagnostics.push(diagnostic("GOVERNED_MODULE_PRIVATE_ACCESS_MISSING", "release-blocking", "private-access", "Governed module evidence must include private runtime object rejection."));
  }
  if (!fixtures.some((fixture) => fixture.lifecycleRecords.some((record) => record.nextState === "disabled"))) {
    diagnostics.push(diagnostic("GOVERNED_MODULE_DISABLE_MISSING", "release-blocking", "lifecycle", "Governed module evidence must include disable lifecycle cleanup."));
  }
  if (!fixtures.some((fixture) => fixture.lifecycleRecords.some((record) => record.nextState === "unloaded"))) {
    diagnostics.push(diagnostic("GOVERNED_MODULE_UNLOAD_MISSING", "release-blocking", "lifecycle", "Governed module evidence must include unload lifecycle cleanup."));
  }

  return {
    schemaVersion: GOVERNED_MODULE_SCHEMA_VERSION,
    status: diagnostics.some((item) => item.releaseBlocking) ? "fail" : "pass",
    fixtureCount: fixtures.length,
    moduleKinds: [...new Set(fixtures.map((fixture) => fixture.module.moduleKind))].sort() as readonly GovernedModuleKind[],
    contractPathKinds: [...new Set(fixtures.flatMap((fixture) => fixture.module.contractPaths.map((path) => path.kind)))].sort() as readonly GovernedModuleContractPathKind[],
    requiredScenarios: GOVERNED_MODULE_REQUIRED_SCENARIOS,
    coveredScenarios,
    policyDecisionKinds: [...new Set(fixtures.flatMap((fixture) => fixture.policyEvaluations.map((evaluation) => evaluation.decision)))].sort(),
    lifecycleRecordCount: fixtures.reduce((total, fixture) => total + fixture.lifecycleRecords.length, 0),
    missingPermissionFixtureCount: fixtures.filter((fixture) => fixture.scenario === "missing-permission").length,
    privateObjectFixtureCount: fixtures.filter((fixture) => fixture.scenario === "private-object-access").length,
    disabledFixtureCount: fixtures.filter((fixture) => fixture.scenario === "disabled-module").length,
    unloadedFixtureCount: fixtures.filter((fixture) => fixture.scenario === "unloaded-module").length,
    fixtures,
    fixtureDiagnostics,
    diagnostics,
    redaction: { class: "internal", fields: ["fixtures.module.integrity", "fixtures.policyEvaluations.policyRequest", "fixtureDiagnostics.message", "diagnostics.message"] }
  };
}

export function pluginModuleBoundaryGovernanceCheck(
  evidence: PluginModuleBoundaryGovernanceEvidence = collectPluginModuleBoundaryGovernanceEvidence()
): ReadinessCheck {
  return {
    id: "governance.plugin-module-boundaries",
    label: "Plugin module boundaries",
    status: evidence.status,
    message: `Governed modules: fixtures=${evidence.fixtureCount}, contract-paths=${evidence.contractPathKinds.length}, policy-decisions=${evidence.policyDecisionKinds.join(",")}, lifecycle-records=${evidence.lifecycleRecordCount}.`,
    suggestedActions: evidence.status === "pass" ? [] : ["Fix governed module manifest, permission, private-access, policy handoff, or lifecycle evidence before enabling third-party module execution."],
    metadata: { evidence },
    redaction: { class: "internal", fields: ["metadata.evidence.fixtures.module.integrity", "metadata.evidence.fixtures.policyEvaluations.policyRequest", "metadata.evidence.fixtureDiagnostics.message"] }
  };
}

function diagnostic(
  code: string,
  severity: GovernedModuleDiagnostic["severity"],
  category: GovernedModuleDiagnostic["category"],
  message: string
): GovernedModuleDiagnostic {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal", fields: ["message"] },
    severity,
    moduleId: "governance.plugin-module-boundaries",
    moduleKind: "plugin",
    category,
    releaseBlocking: severity === "release-blocking"
  };
}
