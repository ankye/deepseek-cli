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
  ["golden-mode-ordering", "tests/acceptance/latest/golden-replay.txt"]
] as const);

const interactionModes: readonly InteractionModeMatrixInput[] = [
  entry("one-shot", "complete", ["headless-run-jsonl", "runtime-mode-events"]),
  entry("chat", "complete", ["chat-local-controls", "runtime-mode-events", "session-resume-fork"]),
  entry("headless", "complete", ["headless-run-jsonl", "diagnostics-evaluate"]),
  entry("result-list", "partial", ["chat-local-controls"], ["10.3 terminal matrix coverage"], ["result-list rendering has local controls but needs terminal matrix acceptance."]),
  entry("approval", "partial", ["chat-local-controls"], ["10.3 terminal matrix coverage"], ["approval rendering exists; mode-aware matrix acceptance remains pending."]),
  entry("command-palette", "partial", ["chat-local-controls"], ["10.3 terminal matrix coverage"], ["command-palette semantic actions exist; raw-key/rich TUI acceptance remains pending."]),
  entry("review-diff", "planned", [], ["11.5 rollout criteria"], ["review diff mode is planned behind future rollout evidence."]),
  entry("interactive", "planned", [], ["10.3 terminal matrix coverage"], ["raw interactive mode remains optional over slash-driven controls."]),
  entry("background-task", "planned", [], ["11.5 rollout criteria"], ["background task mode is a future host capability."]),
  entry("remote", "disabled", [], ["9.1 remote-safe matrix"], ["remote mode is fail-closed until host capability and command filtering evidence land."]),
  entry("degraded", "complete", ["session-resume-fork", "runtime-mode-events"])
];

const agentModes: readonly AgentModeMatrixInput[] = [
  agentEntry("default", "default-coding-agent", "complete", ["runtime-mode-events", "headless-run-jsonl"]),
  agentEntry("evidence", "evidence-researcher", "complete", ["runtime-mode-events", "diagnostics-evaluate"]),
  agentEntry("planner", "planner", "complete", ["runtime-mode-events", "chat-local-controls"]),
  agentEntry("implementer", "implementer", "partial", ["runtime-mode-events"], ["10.4 checkpoint governance"], ["write-capable implementation needs checkpoint governance acceptance."]),
  agentEntry("verifier", "verifier", "complete", ["runtime-mode-events", "diagnostics-evaluate"]),
  agentEntry("coordinator", "coordinator", "partial", ["runtime-mode-events"], ["11.4 rollout gate"], ["coordinator remains gated until evaluation proves lower correction cost."]),
  agentEntry("worker", "worker", "partial", ["runtime-mode-events", "session-resume-fork"], ["10.4 scratchpad governance"], ["worker lifecycle exists; scratchpad/checkpoint acceptance remains pending."]),
  agentEntry("repair", "repairer", "partial", ["runtime-mode-events"], ["10.1 golden repair traces"], ["repair events are recorded; full repair execution remains gated."]),
  agentEntry("synthesis", "synthesizer", "planned", [], ["11.5 rollout criteria"], ["synthesis mode needs rollout criteria and acceptance evidence."])
];

export async function collectModeMatrix(): Promise<CliModeMatrixSummary> {
  const evidence = await acceptanceEvidenceStatuses();
  const interactionEntries = interactionModes.map((mode) => interactionModeEntry(mode, evidence));
  const agentEntries = agentModes.map((mode) => agentModeEntry(mode, evidence));
  const missingAcceptanceEvidence = [
    ...interactionEntries.flatMap((mode) => mode.missingAcceptanceEvidence),
    ...agentEntries.flatMap((mode) => mode.missingAcceptanceEvidence)
  ];
  const nextTasks = [...new Set([...interactionEntries.flatMap((mode) => mode.nextTasks), ...agentEntries.flatMap((mode) => mode.nextTasks)])];
  return {
    schemaVersion: "1.0.0",
    kind: "cli.mode.completion.matrix",
    status: missingAcceptanceEvidence.length > 0 || nextTasks.length > 0 ? "warn" : "pass",
    interactionModes: interactionEntries,
    agentModes: agentEntries,
    missingAcceptanceEvidence: [...new Set(missingAcceptanceEvidence)],
    nextTasks,
    redaction: { class: "internal", fields: ["missingAcceptanceEvidence"] }
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
