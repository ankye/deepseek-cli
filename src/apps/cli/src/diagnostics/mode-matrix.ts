import type {
  AgentModeCompletionMatrixEntry,
  AgentModeName,
  AgentProductRole,
  InteractionModeCompletionMatrixEntry,
  InteractionModeName,
  JsonObject,
  ModeCompletionStatus,
  RedactedError
} from "@deepseek/platform-contracts";
import {
  AGENT_MODE_COMPATIBILITY,
  AGENT_MODE_SCHEMA_VERSION,
  INTERACTION_MODE_COMPATIBILITY,
  INTERACTION_MODE_SCHEMA_VERSION
} from "@deepseek/platform-contracts";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";

export interface CliModeMatrixSummary extends JsonObject {
  readonly schemaVersion: string;
  readonly kind: "cli.mode.completion.matrix";
  readonly status: "pass" | "warn" | "fail";
  readonly interactionModes: readonly InteractionModeCompletionMatrixEntry[];
  readonly agentModes: readonly AgentModeCompletionMatrixEntry[];
  readonly modeDeliveryCapabilityScore: number;
  readonly modeDeliveryCapabilityTargetScore: number;
  readonly modeDeliveryCapabilityCompletedCount: number;
  readonly modeDeliveryCapabilityTotalCount: number;
  readonly modeDeliveryCapabilityPassed: boolean;
  readonly modeDeliveryCapabilityBlockingModeIds: readonly string[];
  readonly missingAcceptanceEvidence: readonly string[];
  readonly nextTasks: readonly string[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

interface InteractionModeMatrixInput {
  readonly mode: InteractionModeName;
  readonly status: ModeCompletionStatus;
  readonly implementedSurfaces: readonly string[];
  readonly missingAcceptanceEvidence?: readonly string[];
  readonly nextTasks?: readonly string[];
  readonly diagnostics?: readonly RedactedError[];
}

interface AgentModeMatrixInput {
  readonly mode: AgentModeName;
  readonly productRole: AgentProductRole;
  readonly status: ModeCompletionStatus;
  readonly implementedSurfaces: readonly string[];
  readonly missingAcceptanceEvidence?: readonly string[];
  readonly nextTasks?: readonly string[];
  readonly diagnostics?: readonly RedactedError[];
}

const acceptanceEvidenceBySurface: ReadonlyMap<string, string> = new Map([
  ["chat-local-controls", "tests/acceptance/latest/smoke-host-adapters.txt"],
  ["headless-run-jsonl", "tests/acceptance/latest/smoke-headless.txt"],
  ["diagnostics-evaluate", "tests/acceptance/acceptance-index.md"],
  ["runtime-mode-events", "tests/acceptance/latest/integration.txt"],
  ["session-resume-fork", "tests/acceptance/latest/contracts.txt"],
  ["mode-schema-versioning", "tests/acceptance/latest/versioning.txt"],
  ["terminal-matrix", "tests/acceptance/latest/matrix.txt"],
  ["approval-contracts", "tests/acceptance/latest/contracts.txt"],
  ["palette-result-list-contracts", "tests/acceptance/latest/contracts.txt"],
  ["scratchpad-checkpoint-governance", "tests/acceptance/latest/contracts.txt"],
  ["review-diff-revert-controls", "tests/acceptance/latest/test-summary.txt"],
  ["interactive-terminal-controls", "tests/acceptance/latest/smoke-host-adapters.txt"],
  ["background-task-controls", "tests/acceptance/latest/contracts.txt"],
  ["remote-safe-runtime", "tests/acceptance/latest/matrix.txt"],
  ["implementer-checkpoint-governance", "tests/acceptance/latest/contracts.txt"],
  ["coordinator-delegation-governance", "tests/acceptance/latest/integration.txt"],
  ["repair-loop-golden", "tests/acceptance/latest/golden-replay.txt"],
  ["synthesis-phase-governance", "tests/acceptance/latest/contracts.txt"],
  ["golden-mode-ordering", "tests/acceptance/latest/golden-replay.txt"]
] as const);

const interactionModes: readonly InteractionModeMatrixInput[] = [
  entry("one-shot", "complete", ["headless-run-jsonl", "runtime-mode-events"]),
  entry("chat", "complete", ["chat-local-controls", "runtime-mode-events", "session-resume-fork"]),
  entry("headless", "complete", ["headless-run-jsonl", "diagnostics-evaluate"]),
  entry("result-list", "complete", ["chat-local-controls", "terminal-matrix", "palette-result-list-contracts"]),
  entry("approval", "complete", ["chat-local-controls", "terminal-matrix", "approval-contracts"]),
  entry("command-palette", "complete", ["chat-local-controls", "terminal-matrix", "palette-result-list-contracts"]),
  entry("review-diff", "complete", ["review-diff-revert-controls", "runtime-mode-events"]),
  entry("interactive", "complete", ["interactive-terminal-controls", "terminal-matrix"]),
  entry("background-task", "complete", ["background-task-controls", "runtime-mode-events"]),
  entry("remote", "complete", ["remote-safe-runtime", "runtime-mode-events"]),
  entry("degraded", "complete", ["session-resume-fork", "runtime-mode-events"])
];

const agentModes: readonly AgentModeMatrixInput[] = [
  agentEntry("default", "default-coding-agent", "complete", ["runtime-mode-events", "headless-run-jsonl"]),
  agentEntry("evidence", "evidence-researcher", "complete", ["runtime-mode-events", "diagnostics-evaluate"]),
  agentEntry("planner", "planner", "complete", ["runtime-mode-events", "chat-local-controls"]),
  agentEntry("implementer", "implementer", "complete", ["runtime-mode-events", "implementer-checkpoint-governance"]),
  agentEntry("verifier", "verifier", "complete", ["runtime-mode-events", "diagnostics-evaluate"]),
  agentEntry("coordinator", "coordinator", "complete", ["runtime-mode-events", "coordinator-delegation-governance"]),
  agentEntry("worker", "worker", "complete", ["runtime-mode-events", "session-resume-fork", "scratchpad-checkpoint-governance"]),
  agentEntry("repair", "repairer", "complete", ["runtime-mode-events", "repair-loop-golden"]),
  agentEntry("synthesis", "synthesizer", "complete", ["runtime-mode-events", "synthesis-phase-governance"])
];

export async function collectModeMatrix(): Promise<CliModeMatrixSummary> {
  const evidence = await acceptanceEvidenceStatuses();
  const interactionEntries = interactionModes.map((mode) => interactionModeEntry(mode, evidence));
  const agentEntries = agentModes.map((mode) => agentModeEntry(mode, evidence));
  const deliveryCapability = modeDeliveryCapabilitySummary(interactionEntries, agentEntries);
  const missingAcceptanceEvidence = [
    ...interactionEntries.flatMap((mode) => mode.missingAcceptanceEvidence),
    ...agentEntries.flatMap((mode) => mode.missingAcceptanceEvidence)
  ];
  const nextTasks = [...new Set([...interactionEntries.flatMap((mode) => mode.nextTasks), ...agentEntries.flatMap((mode) => mode.nextTasks)])];
  return {
    schemaVersion: "1.1.0",
    kind: "cli.mode.completion.matrix",
    status: missingAcceptanceEvidence.length > 0 || nextTasks.length > 0 ? "warn" : "pass",
    interactionModes: interactionEntries,
    agentModes: agentEntries,
    modeDeliveryCapabilityScore: deliveryCapability.score,
    modeDeliveryCapabilityTargetScore: deliveryCapability.targetScore,
    modeDeliveryCapabilityCompletedCount: deliveryCapability.completedCount,
    modeDeliveryCapabilityTotalCount: deliveryCapability.totalCount,
    modeDeliveryCapabilityPassed: deliveryCapability.passed,
    modeDeliveryCapabilityBlockingModeIds: deliveryCapability.blockingModeIds,
    missingAcceptanceEvidence: [...new Set(missingAcceptanceEvidence)],
    nextTasks,
    redaction: { class: "internal", fields: ["missingAcceptanceEvidence", "modeDeliveryCapabilityBlockingModeIds"] }
  };
}

function modeDeliveryCapabilitySummary(
  interactionEntries: readonly InteractionModeCompletionMatrixEntry[],
  agentEntries: readonly AgentModeCompletionMatrixEntry[]
): {
  readonly score: number;
  readonly targetScore: number;
  readonly completedCount: number;
  readonly totalCount: number;
  readonly passed: boolean;
  readonly blockingModeIds: readonly string[];
} {
  const targetScore = 1;
  const entries = [
    ...interactionEntries.map((mode) => ({ id: `interaction:${mode.mode}`, status: mode.status })),
    ...agentEntries.map((mode) => ({ id: `agent:${mode.mode}`, status: mode.status }))
  ];
  const completedCount = entries.filter((entry) => entry.status === "complete").length;
  const blockingModeIds = entries.filter((entry) => entry.status !== "complete").map((entry) => entry.id);
  const totalCount = entries.length;
  return {
    score: roundRatio(totalCount === 0 ? 0 : completedCount / totalCount),
    targetScore,
    completedCount,
    totalCount,
    passed: totalCount > 0 && completedCount === totalCount,
    blockingModeIds
  };
}

function entry(
  mode: InteractionModeName,
  status: ModeCompletionStatus,
  implementedSurfaces: readonly string[],
  nextTasks: readonly string[] = [],
  diagnosticMessages: readonly string[] = []
): InteractionModeMatrixInput {
  return { mode, status, implementedSurfaces, nextTasks, diagnostics: diagnostics(diagnosticMessages) };
}

function agentEntry(
  mode: AgentModeName,
  productRole: AgentProductRole,
  status: ModeCompletionStatus,
  implementedSurfaces: readonly string[],
  nextTasks: readonly string[] = [],
  diagnosticMessages: readonly string[] = []
): AgentModeMatrixInput {
  return { mode, productRole, status, implementedSurfaces, nextTasks, diagnostics: diagnostics(diagnosticMessages) };
}

function interactionModeEntry(
  input: InteractionModeMatrixInput,
  evidence: ReadonlyMap<string, boolean>
): InteractionModeCompletionMatrixEntry {
  return {
    schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
    mode: input.mode,
    status: input.status,
    implementedSurfaces: input.implementedSurfaces,
    missingAcceptanceEvidence: missingSurfaceEvidence(input, evidence),
    nextTasks: input.nextTasks ?? [],
    diagnostics: input.diagnostics ?? [],
    redaction: { class: "internal", fields: ["missingAcceptanceEvidence", "diagnostics.details"] },
    compatibility: INTERACTION_MODE_COMPATIBILITY
  };
}

function agentModeEntry(
  input: AgentModeMatrixInput,
  evidence: ReadonlyMap<string, boolean>
): AgentModeCompletionMatrixEntry {
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    mode: input.mode,
    productRole: input.productRole,
    status: input.status,
    implementedSurfaces: input.implementedSurfaces,
    missingAcceptanceEvidence: missingSurfaceEvidence(input, evidence),
    nextTasks: input.nextTasks ?? [],
    diagnostics: input.diagnostics ?? [],
    redaction: { class: "internal", fields: ["missingAcceptanceEvidence", "diagnostics.details"] },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

function missingSurfaceEvidence(input: { readonly implementedSurfaces: readonly string[]; readonly missingAcceptanceEvidence?: readonly string[] }, evidence: ReadonlyMap<string, boolean>): readonly string[] {
  return [
    ...(input.missingAcceptanceEvidence ?? []),
    ...input.implementedSurfaces.flatMap((surface) => {
      const path = acceptanceEvidenceBySurface.get(surface);
      return path && evidence.get(path) !== true ? [path] : [];
    })
  ];
}

async function acceptanceEvidenceStatuses(): Promise<ReadonlyMap<string, boolean>> {
  const platform = new NodePlatformRuntime();
  const entries = await Promise.all([...new Set(acceptanceEvidenceBySurface.values())].map(async (path) => {
    try {
      await platform.statFile(platform.resolvePath(process.cwd(), path));
      return [path, true] as const;
    } catch {
      return [path, false] as const;
    }
  }));
  return new Map(entries);
}

function diagnostics(messages: readonly string[]): readonly RedactedError[] {
  return messages.map((message, index) => ({
    code: `CLI_MODE_MATRIX_${index + 1}`,
    message,
    retryable: false,
    redaction: { class: "internal" as const }
  }));
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}
