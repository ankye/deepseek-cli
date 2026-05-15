import type {
  ToolFamilyCatalog,
  ToolFamilyDefinition,
  ToolFamilyExecutionEvidenceMode,
  ToolFamilyId,
  ToolFamilyParityMatrix,
  ToolFamilyProviderSupportStatus,
  ToolFamilyScoreCriterionResult,
  ToolFamilyScoreCriterionStatus,
  ToolFamilyScoreEvidenceRef,
  ToolFamilyScoreLayerId
} from "@deepseek/platform-contracts";
import { TOOL_FAMILY_CATALOG_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { toolFamilyCatalog } from "./families.js";

export interface ToolFamilyCoverageEvidence {
  readonly fakeCoveredFamilyIds?: readonly ToolFamilyId[];
  readonly replayedCoveredFamilyIds?: readonly ToolFamilyId[];
  readonly liveCoveredFamilyIds?: readonly ToolFamilyId[];
  readonly taskCoveredFamilyIds?: readonly ToolFamilyId[];
  readonly safetyCoveredFamilyIds?: readonly ToolFamilyId[];
  readonly providerNativeSupportedFamilyIds?: readonly ToolFamilyId[];
}

export function buildToolFamilyParityMatrix(
  evidence: ToolFamilyCoverageEvidence = {},
  catalog: ToolFamilyCatalog = toolFamilyCatalog
): ToolFamilyParityMatrix {
  const fakeCovered = new Set<ToolFamilyId>(evidence.fakeCoveredFamilyIds ?? []);
  const replayedCovered = new Set<ToolFamilyId>(evidence.replayedCoveredFamilyIds ?? []);
  const liveCovered = new Set<ToolFamilyId>(evidence.liveCoveredFamilyIds ?? []);
  const taskCovered = new Set<ToolFamilyId>(evidence.taskCoveredFamilyIds ?? []);
  const safetyCovered = new Set<ToolFamilyId>(evidence.safetyCoveredFamilyIds ?? []);
  const providerNativeSupported = new Set<ToolFamilyId>(evidence.providerNativeSupportedFamilyIds ?? []);
  const scorecards = catalog.families.map((family) => buildFamilyScorecard(family, catalog.catalogVersion, {
    fakeCovered: fakeCovered.has(family.familyId),
    replayedCovered: replayedCovered.has(family.familyId),
    liveCovered: liveCovered.has(family.familyId),
    taskCovered: taskCovered.has(family.familyId),
    safetyCovered: safetyCovered.has(family.familyId),
    providerNativeSupported: providerNativeSupported.has(family.familyId)
  }));
  const applicable = scorecards.filter((scorecard) => scorecard.implementationState !== "not_applicable");
  const passedFamilyCount = applicable.filter((scorecard) => scorecard.passed).length;

  return {
    schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
    kind: "tool-family.parity-matrix",
    catalogVersion: catalog.catalogVersion,
    totalFamilyCount: applicable.length,
    implementedFamilyCount: applicable.filter((scorecard) => scorecard.implementationState === "implemented").length,
    executionCoveredFamilyCount: applicable.filter((scorecard) => hasPassedLayer(scorecard.criteria, "execution")).length,
    fakeCoveredFamilyCount: applicable.filter((scorecard) => scorecard.executionEvidenceMode === "fake").length,
    replayedCoveredFamilyCount: applicable.filter((scorecard) => scorecard.executionEvidenceMode === "replayed").length,
    liveCoveredFamilyCount: applicable.filter((scorecard) => scorecard.executionEvidenceMode === "live").length,
    providerNativeSupportedFamilyCount: applicable.filter((scorecard) => scorecard.providerSupport === "native").length,
    taskCoveredFamilyCount: applicable.filter((scorecard) => hasPassedLayer(scorecard.criteria, "task_outcome")).length,
    safetyCoveredFamilyCount: applicable.filter((scorecard) => hasPassedLayer(scorecard.criteria, "safety")).length,
    absentFamilyCount: applicable.filter((scorecard) => scorecard.implementationState === "absent").length,
    plannedFamilyCount: applicable.filter((scorecard) => scorecard.implementationState === "planned").length,
    unavailableFamilyCount: applicable.filter((scorecard) => scorecard.implementationState === "unavailable").length,
    notApplicableFamilyCount: scorecards.filter((scorecard) => scorecard.implementationState === "not_applicable").length,
    passedFamilyCount,
    objectiveScore: roundScore(applicable.length === 0 ? 0 : passedFamilyCount / applicable.length),
    scorecards,
    redaction: { class: "internal" }
  };
}

function buildFamilyScorecard(
  family: ToolFamilyDefinition,
  catalogVersion: string,
  coverage: {
    readonly fakeCovered: boolean;
    readonly replayedCovered: boolean;
    readonly liveCovered: boolean;
    readonly taskCovered: boolean;
    readonly safetyCovered: boolean;
    readonly providerNativeSupported: boolean;
  }
): ToolFamilyParityMatrix["scorecards"][number] {
  const executableToolCount = family.tools.filter((tool) => tool.executable).length;
  const modelVisibleToolCount = family.tools.filter((tool) => tool.modelVisible).length;
  const implementationPassed = family.implementationState === "implemented" && executableToolCount > 0 && modelVisibleToolCount > 0;
  const staticContractPassed = implementationPassed && family.tools.every((tool) => tool.capabilityId && tool.implementationState === "implemented");
  const blockedStatus = implementationStateStatus(family.implementationState);
  const executionEvidenceMode = executionMode(coverage);
  const executionCovered = executionEvidenceMode !== "none";
  const providerSupport = providerSupportStatus(family, coverage);
  const criteria = [
    criterion("implementation", implementationPassed ? "pass" : blockedStatus, implementationEvidence(family)),
    criterion("static_contract", staticContractPassed ? "pass" : blockedStatus, implementationEvidence(family)),
    criterion("execution", executionCovered && implementationPassed ? "pass" : coverageStatus(family, implementationPassed), executionCoverageRef(family.familyId, executionEvidenceMode)),
    criterion("task_outcome", coverage.taskCovered && implementationPassed ? "pass" : coverageStatus(family, implementationPassed), coverageRef("task-run", family.familyId, coverage.taskCovered)),
    criterion("safety", coverage.safetyCovered && implementationPassed ? "pass" : coverageStatus(family, implementationPassed), coverageRef("policy", family.familyId, coverage.safetyCovered)),
    criterion("provider_native_support", providerNativeStatus(family, implementationPassed, providerSupport), providerSupportRef(family.familyId, providerSupport))
  ] satisfies readonly ToolFamilyScoreCriterionResult[];
  const denominator = criteria.reduce((total, item) => total + item.denominator, 0);
  const score = criteria.reduce((total, item) => total + item.score, 0);

  return {
    schemaVersion: TOOL_FAMILY_CATALOG_SCHEMA_VERSION,
    catalogVersion,
    domainId: family.domainId,
    familyId: family.familyId,
    title: family.title,
    implementationState: family.implementationState,
    toolCount: family.tools.length,
    executableToolCount,
    modelVisibleToolCount,
    executionEvidenceMode,
    providerSupport,
    criteria,
    objectiveScore: roundScore(denominator === 0 ? 0 : score / denominator),
    passed: denominator > 0 && score === denominator,
    redaction: { class: "internal" }
  };
}

function criterion(
  layerId: ToolFamilyScoreLayerId,
  status: ToolFamilyScoreCriterionStatus,
  evidence: readonly ToolFamilyScoreEvidenceRef[]
): ToolFamilyScoreCriterionResult {
  return {
    layerId,
    status,
    score: status === "pass" ? 1 : 0,
    denominator: status === "not_applicable" ? 0 : 1,
    evidence,
    redaction: { class: "internal" }
  };
}

function coverageStatus(family: ToolFamilyDefinition, implementationPassed: boolean): ToolFamilyScoreCriterionStatus {
  if (family.implementationState !== "implemented") return implementationStateStatus(family.implementationState);
  return implementationPassed ? "not_assessed" : "fail";
}

function implementationStateStatus(state: ToolFamilyDefinition["implementationState"]): ToolFamilyScoreCriterionStatus {
  if (state === "planned" || state === "absent" || state === "unavailable" || state === "not_applicable") return state;
  return "fail";
}

function executionMode(coverage: {
  readonly fakeCovered: boolean;
  readonly replayedCovered: boolean;
  readonly liveCovered: boolean;
}): ToolFamilyExecutionEvidenceMode {
  if (coverage.liveCovered) return "live";
  if (coverage.replayedCovered) return "replayed";
  if (coverage.fakeCovered) return "fake";
  return "none";
}

function providerSupportStatus(
  family: ToolFamilyDefinition,
  coverage: { readonly fakeCovered: boolean; readonly providerNativeSupported: boolean }
): ToolFamilyProviderSupportStatus {
  if (family.connectorProfile === "built-in" || family.connectorProfile === "host") return "not_applicable";
  if (coverage.providerNativeSupported) return "native";
  if (coverage.fakeCovered) return "fake";
  return "unknown";
}

function providerNativeStatus(
  family: ToolFamilyDefinition,
  implementationPassed: boolean,
  providerSupport: ToolFamilyProviderSupportStatus
): ToolFamilyScoreCriterionStatus {
  if (providerSupport === "not_applicable") return "not_applicable";
  if (family.implementationState !== "implemented") return implementationStateStatus(family.implementationState);
  if (!implementationPassed) return "fail";
  return providerSupport === "native" ? "pass" : "not_assessed";
}

function implementationEvidence(family: ToolFamilyDefinition): readonly ToolFamilyScoreEvidenceRef[] {
  return family.tools.map((tool) => ({
    kind: tool.executable ? "executor" : "manifest",
    ref: tool.capabilityId ? `${tool.toolId}:${tool.capabilityId}` : tool.toolId,
    status: tool.implementationState === "implemented" && tool.executable && tool.modelVisible && tool.capabilityId ? "pass" : "fail",
    redaction: { class: "internal" }
  }));
}

function coverageRef(
  kind: ToolFamilyScoreEvidenceRef["kind"],
  familyId: ToolFamilyId,
  covered: boolean
): readonly ToolFamilyScoreEvidenceRef[] {
  if (!covered) return [];
  return [{
    kind,
    ref: `family:${familyId}`,
    status: "pass",
    redaction: { class: "internal" }
  }];
}

function executionCoverageRef(
  familyId: ToolFamilyId,
  mode: ToolFamilyExecutionEvidenceMode
): readonly ToolFamilyScoreEvidenceRef[] {
  if (mode === "none") return [];
  const kind = mode === "live" ? "live-run" : mode === "replayed" ? "replay-run" : "fake-run";
  return coverageRef(kind, familyId, true);
}

function providerSupportRef(
  familyId: ToolFamilyId,
  status: ToolFamilyProviderSupportStatus
): readonly ToolFamilyScoreEvidenceRef[] {
  if (status !== "native") return [];
  return [{
    kind: "provider-native",
    ref: `family:${familyId}`,
    status: "pass",
    redaction: { class: "internal" }
  }];
}

function hasPassedLayer(criteria: readonly ToolFamilyScoreCriterionResult[], layerId: ToolFamilyScoreLayerId): boolean {
  return criteria.some((criterionResult) => criterionResult.layerId === layerId && criterionResult.status === "pass");
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}
