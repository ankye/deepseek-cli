import type { CliEvaluationRunMetrics, JsonObject } from "@deepseek/platform-contracts";

export interface PromptAssemblyMetrics {
  readonly available: boolean;
  readonly fingerprint?: string;
  readonly sectionCount?: number;
  readonly excludedSectionCount?: number;
  readonly budgetStatus?: string;
  readonly visibleToolCount?: number;
  readonly hasOutputContract?: boolean;
  readonly hasDroppedContext?: boolean;
  readonly gapReason?: CliEvaluationRunMetrics["promptAssemblyGapReason"];
}

export function promptAssemblyMetricsFromJsonl(stdout: string): PromptAssemblyMetrics {
  const events = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as { kind?: string; data?: JsonObject };
      } catch {
        return undefined;
      }
    })
    .filter((event): event is { kind?: string; data?: JsonObject } => !!event);
  const assembled = events.find((event) => event.kind === "prompt.assembled")?.data;
  if (!assembled) return { available: false, gapReason: "provider-readiness-failure" };
  const sectionTraces = (assembled.trace as { sections?: readonly JsonObject[] } | undefined)?.sections ?? [];
  const hasOutputContract = sectionTraces.some((section) => section.kind === "task.output-contract" && section.included === true);
  const hasDroppedContext = sectionTraces.some((section) => typeof section.kind === "string" && section.kind.startsWith("context.") && section.included === false);
  const visibleToolCount = numberValue((assembled.toolPlan as JsonObject | undefined)?.visibleToolCount);
  const fingerprint = stringValue(assembled.fingerprint);
  const sectionCount = numberValue(assembled.sectionCount);
  const excludedSectionCount = numberValue(assembled.excludedSectionCount);
  const budgetStatus = stringValue((assembled.budget as JsonObject | undefined)?.status);
  return {
    available: true,
    ...(fingerprint ? { fingerprint } : {}),
    ...(sectionCount !== undefined ? { sectionCount } : {}),
    ...(excludedSectionCount !== undefined ? { excludedSectionCount } : {}),
    ...(budgetStatus ? { budgetStatus } : {}),
    ...(visibleToolCount !== undefined ? { visibleToolCount } : {}),
    hasOutputContract,
    hasDroppedContext,
    gapReason: !hasOutputContract
      ? "missing-output-contract"
      : hasDroppedContext
        ? "dropped-context"
        : visibleToolCount !== undefined && visibleToolCount <= 0
          ? "insufficient-tool-visibility"
          : "post-assembly-model-failure"
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
