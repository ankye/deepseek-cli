import type { SelfRepairFailureClassification, SelfRepairVerificationDecision, SelfRepairVerificationSummary } from "@deepseek/platform-contracts";
import { SELF_REPAIR_COMPATIBILITY, SELF_REPAIR_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { boundedPreview, stableHash } from "./helpers.js";

export function verificationLadderFor(classification: SelfRepairFailureClassification, mode: "minimal" | "targeted" | "broad"): readonly string[] {
  const minimal = minimalVerificationFor(classification);
  if (mode === "minimal") return minimal;
  const targeted = unique([...minimal, ...targetedVerificationFor(classification)]);
  if (mode === "targeted") return targeted;
  return unique([...targeted, "npm run typecheck", "npm run lint", "npm test"]);
}

export function createVerificationSummary(input: {
  readonly command?: string;
  readonly status: SelfRepairVerificationSummary["status"];
  readonly exitCode?: number;
  readonly stdout?: string;
  readonly stderr?: string;
  readonly elapsedMs?: number;
  readonly decision?: SelfRepairVerificationDecision;
}): SelfRepairVerificationSummary {
  const output = `${input.command ?? ""}\n${input.stdout ?? ""}\n${input.stderr ?? ""}`;
  const decision = input.decision ?? verificationDecision(input.status, input.exitCode);
  return {
    schemaVersion: SELF_REPAIR_SCHEMA_VERSION,
    verificationId: `repair-verification:${stableHash(output)}`,
    ...(input.command ? { command: input.command } : {}),
    status: input.status,
    ...(input.exitCode !== undefined ? { exitCode: input.exitCode } : {}),
    ...(input.stdout ? { stdoutPreview: boundedPreview(input.stdout) } : {}),
    ...(input.stderr ? { stderrPreview: boundedPreview(input.stderr) } : {}),
    ...(input.elapsedMs !== undefined ? { elapsedMs: input.elapsedMs } : {}),
    outputDigest: `sha256:${stableHash(output)}`,
    decision,
    compatibility: SELF_REPAIR_COMPATIBILITY,
    redaction: { class: "internal", fields: ["command", "stdoutPreview", "stderrPreview", "outputDigest"] }
  };
}

export function verificationDecision(status: SelfRepairVerificationSummary["status"], exitCode?: number): SelfRepairVerificationDecision {
  if (status === "passed" || exitCode === 0) return "complete";
  if (status === "failed" || (typeof exitCode === "number" && exitCode !== 0)) return "retry";
  if (status === "skipped") return "escalate";
  return "fail";
}

function minimalVerificationFor(classification: SelfRepairFailureClassification): readonly string[] {
  if (classification.failureSource === "task-output-error") return ["artifact existence check"];
  if (classification.failureSource === "build-test-error") return ["rerun failed check"];
  if (classification.failureSource === "workspace-error") return ["workspace checkpoint status"];
  if (classification.failureSource === "tool-error") return ["tool result feedback"];
  return ["next model iteration"];
}

function targetedVerificationFor(classification: SelfRepairFailureClassification): readonly string[] {
  if (classification.failureSource === "task-output-error") return ["artifact checker"];
  if (classification.failureSource === "build-test-error") return ["targeted test"];
  if (classification.failureSource === "workspace-error") return ["stale watermark check"];
  if (classification.failureSource === "tool-error") return ["tool-intent preflight"];
  return [];
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
