import type {
  EvidenceFactClass,
  EvidenceFirstRuntimeContext,
  EvidenceFirstSummary,
  EvidenceItem,
  EvidencePlan,
  EvidenceSourceCoverage,
  EvidenceSourceGroup,
  EvidenceSourceRequirement,
  EvidenceTaskClassification,
  EvidenceTaskIntent,
  JsonObject,
  RuntimeDependencies,
  SessionId,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import { EVIDENCE_FIRST_COMPATIBILITY, EVIDENCE_FIRST_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { AgentLoopRequest } from "@deepseek/platform-contracts";
import { stableHash } from "./trace.js";

const CURRENT_WORKTREE_FRESHNESS = "local-current-worktree";
const BOUNDED_PREVIEW_REDACTION = "bounded-previews-and-fingerprints";
const MAX_EVIDENCE_ITEMS = 8;
const MAX_PREVIEW_CHARS = 1200;

interface CandidateEvidenceSource {
  readonly sourceGroup: EvidenceSourceGroup;
  readonly sourcePath: string;
  readonly sourceLabel: string;
  readonly factClasses: readonly EvidenceFactClass[];
}

const candidateSources: readonly CandidateEvidenceSource[] = [
  {
    sourceGroup: "readme",
    sourcePath: "README.md",
    sourceLabel: "Repository README",
    factClasses: ["docs", "product-copy", "command", "package", "architecture"]
  },
  {
    sourceGroup: "package-metadata",
    sourcePath: "src/apps/cli/package.json",
    sourceLabel: "CLI package metadata",
    factClasses: ["package", "executable", "install", "release"]
  },
  {
    sourceGroup: "product-docs",
    sourcePath: "src/apps/cli/README.md",
    sourceLabel: "CLI README",
    factClasses: ["docs", "feature", "command", "product-copy"]
  },
  {
    sourceGroup: "command-index",
    sourcePath: "docs/reference/command-index.md",
    sourceLabel: "Command index",
    factClasses: ["command", "executable", "docs"]
  },
  {
    sourceGroup: "product-docs",
    sourcePath: "docs/product/product-roadmap.md",
    sourceLabel: "Product roadmap",
    factClasses: ["roadmap", "product-copy", "feature"]
  },
  {
    sourceGroup: "openspec",
    sourcePath: "openspec/changes/evidence-first-agent-workflow/design.md",
    sourceLabel: "Evidence-first OpenSpec design",
    factClasses: ["architecture", "product-copy", "docs"]
  },
  {
    sourceGroup: "openspec",
    sourcePath: "openspec/changes/evidence-first-agent-workflow/specs/evidence-first-agent-workflow/spec.md",
    sourceLabel: "Evidence-first OpenSpec spec",
    factClasses: ["architecture", "docs", "product-copy"]
  },
  {
    sourceGroup: "source",
    sourcePath: "src/apps/cli/src/commands/parse.ts",
    sourceLabel: "CLI command parser",
    factClasses: ["command", "code", "executable"]
  },
  {
    sourceGroup: "source",
    sourcePath: "src/apps/cli/src/types.ts",
    sourceLabel: "CLI command contracts",
    factClasses: ["command", "code"]
  },
  {
    sourceGroup: "tests",
    sourcePath: "src/apps/cli/test/cli.test.ts",
    sourceLabel: "CLI behavior tests",
    factClasses: ["command", "evaluation", "code"]
  }
];

export async function createEvidenceFirstRuntimeContext(
  deps: Pick<RuntimeDependencies, "platform">,
  request: AgentLoopRequest,
  sessionId: SessionId,
  turnId: TurnId,
  trace: TraceContext
): Promise<EvidenceFirstRuntimeContext> {
  const classification = classifyEvidenceTask(request.prompt, request.workspaceRoot, sessionId, turnId, trace);
  const plan = classification.evidenceRequired ? createEvidencePlan(classification) : undefined;
  const selectedEvidence = plan ? await selectProjectEvidence(deps, request.workspaceRoot, plan, classification, sessionId, turnId, trace) : [];
  const sourceCoverage = plan ? summarizeSourceCoverage(plan, selectedEvidence) : [];
  const summary = summarizeEvidenceFirst(classification, plan, selectedEvidence, sourceCoverage);
  return {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    classification,
    ...(plan ? { plan } : {}),
    selectedEvidence,
    sourceCoverage,
    summary,
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal", fields: ["selectedEvidence.preview", "classification.reason"] }
  };
}

export function classifyEvidenceTask(
  prompt: string,
  workspaceRoot: string | undefined,
  sessionId?: SessionId,
  turnId?: TurnId,
  trace?: TraceContext
): EvidenceTaskClassification {
  const lower = prompt.toLowerCase();
  const intents = new Set<EvidenceTaskIntent>();
  const factClasses = new Set<EvidenceFactClass>();
  const speculative = matchesAny(lower, ["brainstorm", "fictional", "hypothetical", "creative", "ideation", "头脑风暴", "虚构", "假设", "创意"]);
  const speculativeOnly = speculative && !matchesAny(lower, [
    "repo",
    "repository",
    "codebase",
    "workspace",
    "当前项目",
    "当前工程",
    "仓库",
    "工程",
    "项目",
    "deepseek cli",
    "package.json",
    "npx",
    "npm",
    "html",
    "webpage",
    "website",
    "网页",
    "网站",
    "页面",
    "codex",
    "claude"
  ]);

  if (speculativeOnly) {
    intents.add("speculative");
    return classificationResult(classificationInput({
      prompt,
      workspaceRoot,
      sessionId,
      turnId,
      trace,
      intents,
      factClasses,
      evidenceRequired: false,
      sensitivity: "speculative",
      reason: "Task is explicitly speculative or creative; factual project evidence is not mandatory but assumptions must stay labeled."
    }));
  }

  if (matchesAny(lower, ["repo", "repository", "codebase", "workspace", "当前项目", "当前工程", "仓库", "工程", "项目"])) {
    intents.add("repository");
    factClasses.add("docs");
  }
  if (matchesAny(lower, ["deepseek cli", "product", "产品", "cli", "工具", "产品页", "介绍"])) {
    intents.add("product");
    factClasses.add("product-copy");
    factClasses.add("feature");
    factClasses.add("package");
    factClasses.add("executable");
  }
  if (matchesAny(lower, ["command", "commands", "subcommand", "flag", "npx", "npm", "命令", "运行", "安装"])) {
    intents.add("command");
    factClasses.add("command");
    factClasses.add("install");
    factClasses.add("executable");
  }
  if (matchesAny(lower, ["package", "package.json", "npm", "包名", "发布包"])) {
    intents.add("package");
    factClasses.add("package");
  }
  if (matchesAny(lower, ["code", "src/", "test", "tests", "bug", "fix", "refactor", "代码", "测试", "修复"])) {
    intents.add("code");
    factClasses.add("code");
  }
  if (matchesAny(lower, ["doc", "docs", "readme", "openspec", "文档", "规范"])) {
    intents.add("docs");
    factClasses.add("docs");
  }
  if (matchesAny(lower, ["release", "publish", "npm publish", "上线", "发布", "可用"])) {
    intents.add("release");
    factClasses.add("release");
  }
  if (matchesAny(lower, ["evaluate", "evaluation", "benchmark", "compare", "codex", "claude", "评估", "对比", "成功率"])) {
    intents.add("evaluation");
    factClasses.add("evaluation");
  }
  if (matchesAny(lower, ["html", "webpage", "website", "site", "page", "网页", "网站", "页面"])) {
    intents.add("generated-artifact");
    factClasses.add("product-copy");
    factClasses.add("docs");
    factClasses.add("package");
    factClasses.add("command");
    factClasses.add("executable");
  }
  if (matchesAny(lower, ["architecture", "runtime", "contracts", "架构", "设计"])) {
    factClasses.add("architecture");
  }
  if (matchesAny(lower, ["roadmap", "route", "路线", "路线图"])) {
    factClasses.add("roadmap");
  }

  if (speculative && intents.size === 0) {
    intents.add("speculative");
  }

  const evidenceRequired = intents.size > 0 && !(intents.size === 1 && intents.has("speculative"));
  const sensitivity = evidenceRequired ? "fact-sensitive" : speculative ? "speculative" : "casual";
  if (factClasses.size === 0 && evidenceRequired) factClasses.add("docs");
  const reason = evidenceRequired
    ? "Task references current project, product, command, code, generated artifact, release, or evaluation facts that require local evidence."
    : speculative
      ? "Task is explicitly speculative or creative; factual project evidence is not mandatory but assumptions must stay labeled."
      : "Task does not require project evidence.";

  return classificationResult(classificationInput({ prompt, workspaceRoot, sessionId, turnId, trace, intents, factClasses, evidenceRequired, sensitivity, reason }));
}

function classificationInput(input: {
  readonly prompt: string;
  readonly workspaceRoot: string | undefined;
  readonly sessionId: SessionId | undefined;
  readonly turnId: TurnId | undefined;
  readonly trace: TraceContext | undefined;
  readonly intents: ReadonlySet<EvidenceTaskIntent>;
  readonly factClasses: ReadonlySet<EvidenceFactClass>;
  readonly evidenceRequired: boolean;
  readonly sensitivity: EvidenceTaskClassification["sensitivity"];
  readonly reason: string;
}): {
  readonly prompt: string;
  readonly workspaceRoot: string | undefined;
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly trace?: TraceContext;
  readonly intents: ReadonlySet<EvidenceTaskIntent>;
  readonly factClasses: ReadonlySet<EvidenceFactClass>;
  readonly evidenceRequired: boolean;
  readonly sensitivity: EvidenceTaskClassification["sensitivity"];
  readonly reason: string;
} {
  return {
    prompt: input.prompt,
    workspaceRoot: input.workspaceRoot,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.turnId ? { turnId: input.turnId } : {}),
    ...(input.trace ? { trace: input.trace } : {}),
    intents: input.intents,
    factClasses: input.factClasses,
    evidenceRequired: input.evidenceRequired,
    sensitivity: input.sensitivity,
    reason: input.reason
  };
}

function classificationResult(input: {
  readonly prompt: string;
  readonly workspaceRoot: string | undefined;
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly trace?: TraceContext;
  readonly intents: ReadonlySet<EvidenceTaskIntent>;
  readonly factClasses: ReadonlySet<EvidenceFactClass>;
  readonly evidenceRequired: boolean;
  readonly sensitivity: EvidenceTaskClassification["sensitivity"];
  readonly reason: string;
}): EvidenceTaskClassification {
  return {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    classificationId: `evidence-classification:${stableHash(`${input.workspaceRoot ?? ""}:${input.prompt}`)}`,
    sensitivity: input.sensitivity,
    intents: input.intents.size > 0 ? sortEvidenceValues(input.intents) : ["casual"],
    factClasses: sortEvidenceValues(input.factClasses),
    evidenceRequired: input.evidenceRequired,
    reason: input.reason,
    trace: {
      ...(input.trace ? { traceId: input.trace.traceId } : {}),
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      ...(input.turnId ? { turnId: input.turnId } : {})
    },
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal", fields: ["reason"] }
  };
}

export function createEvidencePlan(classification: EvidenceTaskClassification): EvidencePlan {
  const requiredFactClasses: readonly EvidenceFactClass[] = classification.factClasses.length > 0 ? classification.factClasses : ["docs"];
  const sourceGroups = sourceGroupsFor(requiredFactClasses);
  return {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    planId: `evidence-plan:${stableHash(`${classification.classificationId}:${requiredFactClasses.join(",")}`)}`,
    classificationId: classification.classificationId,
    requiredFactClasses,
    candidateSourceGroups: sourceGroups.map((sourceGroup) => sourceRequirement(sourceGroup, requiredFactClasses)),
    minimumSourceCoverage: Math.min(1, sourceGroups.length <= 1 ? 1 : 0.6),
    freshnessPolicy: CURRENT_WORKTREE_FRESHNESS,
    redactionPolicy: BOUNDED_PREVIEW_REDACTION,
    stopConditions: [
      "strict command, package, executable, release, or product claims without direct evidence",
      "secret-like evidence that cannot be safely redacted",
      "missing artifact evidence manifest for generated factual product artifacts"
    ],
    trace: classification.trace,
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal", fields: ["stopConditions"] }
  };
}

async function selectProjectEvidence(
  deps: Pick<RuntimeDependencies, "platform">,
  workspaceRoot: string,
  plan: EvidencePlan,
  classification: EvidenceTaskClassification,
  sessionId: SessionId,
  turnId: TurnId,
  trace: TraceContext
): Promise<readonly EvidenceItem[]> {
  const requiredGroups = new Set(plan.candidateSourceGroups.map((source) => source.sourceGroup));
  const requiredFactClasses = new Set(plan.requiredFactClasses);
  const sources = candidateSources
    .filter((source) => requiredGroups.has(source.sourceGroup) || overlaps(source.factClasses, requiredFactClasses))
    .sort((left, right) => sourcePriority(left, requiredGroups, requiredFactClasses) - sourcePriority(right, requiredGroups, requiredFactClasses))
    .slice(0, MAX_EVIDENCE_ITEMS * 2);
  const items: EvidenceItem[] = [];

  for (const source of sources) {
    if (items.length >= MAX_EVIDENCE_ITEMS) break;
    const resolved = deps.platform.resolveWorkspacePath(workspaceRoot, source.sourcePath);
    if (!resolved.ok || !resolved.value) continue;
    const content = await deps.platform.readFile(resolved.value.path).catch(() => undefined);
    if (typeof content !== "string" || looksSecretOnly(content)) continue;
    const preview = boundedPreview(content);
    items.push({
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      evidenceId: `evidence:${stableHash(`${classification.classificationId}:${source.sourcePath}`)}`,
      sourceGroup: source.sourceGroup,
      sourcePath: source.sourcePath,
      sourceLabel: source.sourceLabel,
      factClasses: source.factClasses.filter((factClass) => requiredFactClasses.size === 0 || requiredFactClasses.has(factClass)),
      preview,
      fingerprint: `fnv1a:${stableHash(`${source.sourcePath}:${content}`)}`,
      freshness: { status: "current", observedAt: new Date(0).toISOString() },
      trace: { traceId: trace.traceId, sessionId, turnId },
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["preview"] }
    });
  }

  return items;
}

function summarizeSourceCoverage(plan: EvidencePlan, items: readonly EvidenceItem[]): readonly EvidenceSourceCoverage[] {
  return plan.candidateSourceGroups.map((requirement) => {
    const matching = items.filter((item) => item.sourceGroup === requirement.sourceGroup);
    const coveredClasses = unique(matching.flatMap((item) => item.factClasses));
    const missingFactClasses = requirement.factClasses.filter((factClass) => !coveredClasses.includes(factClass));
    return {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      sourceGroup: requirement.sourceGroup,
      covered: matching.length >= requirement.minimumItemCount && missingFactClasses.length === 0,
      itemCount: matching.length,
      factClasses: coveredClasses,
      fingerprints: matching.map((item) => item.fingerprint),
      missingFactClasses,
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["fingerprints"] }
    };
  });
}

function summarizeEvidenceFirst(
  classification: EvidenceTaskClassification,
  plan: EvidencePlan | undefined,
  items: readonly EvidenceItem[],
  coverage: readonly EvidenceSourceCoverage[]
): EvidenceFirstSummary {
  const covered = coverage.filter((item) => item.covered).length;
  const sourceCoverageRate = coverage.length === 0 ? 0 : covered / coverage.length;
  return {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    summaryId: `evidence-summary:${stableHash(`${classification.classificationId}:${items.map((item) => item.fingerprint).join("|")}`)}`,
    classification,
    ...(plan ? { plan } : {}),
    manifestStatus: classification.evidenceRequired ? "missing" : "missing",
    evidenceItemCount: items.length,
    sourceCoverageRate,
    claimGroundingRate: 0,
    unsupportedClaimCount: 0,
    assumptionCount: classification.sensitivity === "speculative" ? 1 : 0,
    hallucinatedCommandCount: 0,
    trace: classification.trace,
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal", fields: ["classification.reason"] }
  };
}

function sourceGroupsFor(factClasses: readonly EvidenceFactClass[]): readonly EvidenceSourceGroup[] {
  const groups = new Set<EvidenceSourceGroup>(["readme"]);
  if (factClasses.some((factClass) => factClass === "package" || factClass === "executable" || factClass === "install" || factClass === "release")) {
    groups.add("package-metadata");
  }
  if (factClasses.some((factClass) => factClass === "command" || factClass === "executable" || factClass === "install")) {
    groups.add("command-index");
    groups.add("source");
  }
  if (factClasses.some((factClass) => factClass === "product-copy" || factClass === "feature" || factClass === "roadmap")) {
    groups.add("product-docs");
    groups.add("openspec");
  }
  if (factClasses.some((factClass) => factClass === "architecture" || factClass === "docs")) {
    groups.add("openspec");
  }
  if (factClasses.some((factClass) => factClass === "evaluation" || factClass === "code")) {
    groups.add("tests");
    groups.add("source");
  }
  return [...groups].sort();
}

function sourceRequirement(sourceGroup: EvidenceSourceGroup, factClasses: readonly EvidenceFactClass[]): EvidenceSourceRequirement {
  const groupClasses = unique(candidateSources.filter((source) => source.sourceGroup === sourceGroup).flatMap((source) => source.factClasses).filter((factClass) => factClasses.includes(factClass)));
  return {
    sourceGroup,
    required: sourceGroup === "readme" || sourceGroup === "package-metadata" || sourceGroup === "command-index",
    factClasses: groupClasses.length > 0 ? groupClasses : factClasses,
    minimumItemCount: 1
  };
}

function sourcePriority(source: CandidateEvidenceSource, requiredGroups: ReadonlySet<EvidenceSourceGroup>, requiredFactClasses: ReadonlySet<EvidenceFactClass>): number {
  const groupPenalty = requiredGroups.has(source.sourceGroup) ? 0 : 10;
  const missingOverlapPenalty = overlaps(source.factClasses, requiredFactClasses) ? 0 : 10;
  const stablePenalty = candidateSources.findIndex((candidate) => candidate.sourcePath === source.sourcePath);
  return groupPenalty + missingOverlapPenalty + stablePenalty;
}

function boundedPreview(content: string): string {
  const safe = content
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-REDACTED")
    .replace(/\b(DEEPSEEK_API_KEY|DEEPSEEK_TOKEN)\s*=\s*\S+/g, "$1=REDACTED")
    .trim();
  return safe.length > MAX_PREVIEW_CHARS ? safe.slice(0, MAX_PREVIEW_CHARS) : safe;
}

function looksSecretOnly(content: string): boolean {
  const trimmed = content.trim();
  return /^(DEEPSEEK_API_KEY|DEEPSEEK_TOKEN)\s*=/.test(trimmed) || /^sk-[A-Za-z0-9_-]{8,}$/.test(trimmed);
}

function matchesAny(value: string, needles: readonly string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function overlaps<T>(left: readonly T[], right: ReadonlySet<T>): boolean {
  return left.some((item) => right.has(item));
}

function unique<T>(items: readonly T[]): readonly T[] {
  return [...new Set(items)].sort((left, right) => String(left).localeCompare(String(right)));
}

function sortEvidenceValues<T extends string>(values: ReadonlySet<T>): readonly T[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function evidenceFirstEventData(context: EvidenceFirstRuntimeContext): JsonObject {
  return {
    schemaVersion: context.schemaVersion,
    classification: context.classification,
    ...(context.plan ? { plan: context.plan } : {}),
    selectedEvidenceCount: context.selectedEvidence.length,
    sourceCoverage: context.sourceCoverage,
    summary: context.summary,
    redaction: context.redaction,
    compatibility: context.compatibility
  };
}
