import { join } from "node:path";
import type { JsonObject, PackageScorecardCriterionDefinition, PlatformRuntime } from "@deepseek/platform-contracts";

export const liveToolCoverageEvidencePath = "tests/acceptance/latest/live-tool-coverage.json";
export const liveToolCoverageSchemaVersion = "1.0.0";
export const liveToolCoverageKind = "deepseek.live-tool-coverage";

export interface LiveToolCoverageTarget {
  readonly toolId: string;
  readonly safeName: string;
}

export interface LiveToolCoverageRecord extends JsonObject {
  readonly toolId: string;
  readonly safeName: string;
  readonly status: "pass" | "fail";
  readonly model: JsonObject;
  readonly preflight: JsonObject;
  readonly execution: JsonObject;
  readonly continuation: JsonObject;
  readonly diagnostics: readonly string[];
}

export interface LiveToolCoverageEvidence extends JsonObject {
  readonly schemaVersion: typeof liveToolCoverageSchemaVersion;
  readonly kind: typeof liveToolCoverageKind;
  readonly generatedAt: string;
  readonly provider: "deepseek";
  readonly model: string;
  readonly summary: JsonObject;
  readonly records: readonly LiveToolCoverageRecord[];
}

export const liveToolCoverageTargets: readonly LiveToolCoverageTarget[] = [
  target("core.file.read"),
  target("core.file.write"),
  target("core.file.edit"),
  target("core.file.list"),
  target("core.search.text"),
  target("core.shell.run"),
  target("core.shell.output"),
  target("core.shell.kill"),
  target("core.git.status"),
  target("core.git.diff"),
  target("core.test.run"),
  target("core.todo.plan"),
  target("core.web.fetch"),
  target("core.web.search"),
  target("core.agent.spawn"),
  target("core.agent.continue"),
  target("core.agent.stop"),
  target("core.hook.list"),
  target("core.skill.list"),
  target("core.skill.activate")
];

export function coreToolExecutionCriterionId(toolId: string): string {
  return `core-coding-tools.live-execution.${safeToolName(toolId)}`;
}

export function toolIntentPreflightCriterionId(toolId: string): string {
  return `tool-intent-preflight.live-preflight.${safeToolName(toolId)}`;
}

export function coreToolLiveExecutionCriterionDefinitions(): readonly PackageScorecardCriterionDefinition[] {
  return liveToolCoverageTargets.map((item) => criterion(
    coreToolExecutionCriterionId(item.toolId),
    `Live model executes ${item.toolId}`,
    ["core-coding-tools"],
    `DeepSeek live tool coverage record for ${item.toolId}`
  ));
}

export function toolIntentLivePreflightCriterionDefinitions(): readonly PackageScorecardCriterionDefinition[] {
  return liveToolCoverageTargets.map((item) => criterion(
    toolIntentPreflightCriterionId(item.toolId),
    `Live model preflights ${item.toolId}`,
    ["tool-intent-preflight"],
    `DeepSeek live preflight coverage record for ${item.toolId}`
  ));
}

export async function readLiveToolCoverageEvidence(platform: PlatformRuntime, workspaceRoot: string): Promise<LiveToolCoverageEvidence | undefined> {
  const raw = await platform.readFile(join(workspaceRoot, liveToolCoverageEvidencePath)).catch(() => undefined);
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as JsonObject;
  if (parsed.schemaVersion !== liveToolCoverageSchemaVersion || parsed.kind !== liveToolCoverageKind || !Array.isArray(parsed.records)) return undefined;
  return parsed as unknown as LiveToolCoverageEvidence;
}

export function liveToolCoverageRecordFor(evidence: LiveToolCoverageEvidence | undefined, toolId: string): LiveToolCoverageRecord | undefined {
  return evidence?.records.find((record) => record.toolId === toolId);
}

export function safeToolName(toolId: string): string {
  return /^[a-zA-Z0-9_-]+$/.test(toolId) ? toolId : toolId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function target(toolId: string): LiveToolCoverageTarget {
  return { toolId, safeName: safeToolName(toolId) };
}

function criterion(
  criterionId: string,
  title: string,
  appliesToRoles: readonly string[],
  evidenceHint: string
): PackageScorecardCriterionDefinition {
  return {
    criterionId,
    title,
    category: "testing",
    weight: 2,
    required: false,
    hardGate: false,
    appliesToRoles,
    evidenceHint,
    redaction: { class: "internal", fields: ["evidenceHint"] }
  };
}
