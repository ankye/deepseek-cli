import type {
  JsonObject,
  ToolFamilyConnectorProfileEvidence,
  ToolFamilyExecutionEvidenceMode,
  ToolFamilyId,
  ToolFamilyTaskEvidence
} from "@deepseek/platform-contracts";
import { TOOL_FAMILY_IDS } from "@deepseek/platform-contracts";

export interface ToolFamilyCoverageEvidence extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly kind: "tool-family.coverage-evidence";
  readonly coverageId: string;
  readonly familyId: ToolFamilyId;
  readonly evidenceMode: ToolFamilyExecutionEvidenceMode;
  readonly fakeFirst: boolean;
  readonly providerNativeSupport: "native" | "connector" | "fake" | "unsupported" | "unknown" | "not_applicable";
  readonly replayRef?: string;
  readonly liveRef?: string;
  readonly taskEvidenceRef: string;
  readonly packageGap?: string;
  readonly diagnostics: readonly string[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export interface ToolFamilyEvidenceCatalog extends JsonObject {
  readonly schemaVersion: "1.0.0";
  readonly kind: "tool-family.evidence-catalog";
  readonly catalogVersion: string;
  readonly taskEvidence: readonly ToolFamilyTaskEvidence[];
  readonly coverageEvidence: readonly ToolFamilyCoverageEvidence[];
  readonly packageGaps: readonly ToolFamilyCoverageEvidence[];
  readonly redaction: { readonly class: "internal"; readonly fields?: readonly string[] };
}

export function createRepresentativeFamilyTaskEvidence(): readonly ToolFamilyTaskEvidence[] {
  return TOOL_FAMILY_IDS.map((familyId) => taskEvidenceFor(familyId));
}

export function createFamilyCoverageEvidence(): readonly ToolFamilyCoverageEvidence[] {
  return TOOL_FAMILY_IDS.map((familyId) => coverageEvidenceFor(familyId));
}

export function createToolFamilyEvidenceCatalog(catalogVersion = "2026-05-15.worker-d"): ToolFamilyEvidenceCatalog {
  const taskEvidence = createRepresentativeFamilyTaskEvidence();
  const coverageEvidence = createFamilyCoverageEvidence();
  return {
    schemaVersion: "1.0.0",
    kind: "tool-family.evidence-catalog",
    catalogVersion,
    taskEvidence,
    coverageEvidence,
    packageGaps: coverageEvidence.filter((evidence) => evidence.packageGap !== undefined),
    redaction: { class: "internal" }
  };
}

function taskEvidenceFor(familyId: ToolFamilyId): ToolFamilyTaskEvidence {
  const evidenceMode: ToolFamilyExecutionEvidenceMode = "fake";
  return {
    taskId: `family.${familyId}.representative`,
    requiredFamilyIds: [familyId],
    availableFamilyIds: [familyId],
    usedFamilyIds: [familyId],
    unsupportedFamilyIds: [],
    failedFamilyIds: [],
    outcome: "solved",
    evidenceMode,
    artifacts: [artifactFor(familyId)],
    connectorProfiles: [connectorFor(familyId)],
    pipelineRecords: [],
    diagnostics: [
      `family.${familyId}.representative-task`,
      `family.${familyId}.fake-first-covered`
    ],
    redaction: { class: "internal", fields: ["diagnostics"] }
  };
}

function coverageEvidenceFor(familyId: ToolFamilyId): ToolFamilyCoverageEvidence {
  return {
    schemaVersion: "1.0.0",
    kind: "tool-family.coverage-evidence",
    coverageId: `coverage.${familyId}`,
    familyId,
    evidenceMode: "fake",
    fakeFirst: true,
    providerNativeSupport: providerSupportFor(familyId),
    replayRef: `replay.${familyId}.deterministic`,
    taskEvidenceRef: `family.${familyId}.representative`,
    diagnostics: [
      `family.${familyId}.fake-first-covered`
    ],
    redaction: { class: "internal", fields: ["packageGap", "diagnostics"] }
  };
}

function connectorFor(familyId: ToolFamilyId): ToolFamilyConnectorProfileEvidence {
  return {
    profileId: `profile.${familyId}.deterministic`,
    connectorKind: connectorKindFor(familyId),
    trust: providerSupportFor(familyId) === "fake" ? "fake" : "trusted",
    providerSupport: providerSupportFor(familyId),
    fakeFirst: true,
    enabled: true,
    health: "ok",
    permissions: permissionsFor(familyId),
    familyIds: [familyId],
    metadata: {
      ownerSlice: "family-v1"
    },
    redaction: { class: "internal", fields: ["metadata.packageGap"] }
  };
}

function artifactFor(familyId: ToolFamilyId): ToolFamilyTaskEvidence["artifacts"][number] {
  return {
    artifactId: `artifact.${familyId}.evidence`,
    familyId,
    kind: familyId === "observability.trace-budget" ? "trace" : "json",
    mimeType: "application/json",
    byteLength: 128,
    preview: `deterministic evidence for ${familyId}`,
    truncated: false,
    createdAt: new Date(0).toISOString(),
    redaction: { class: "internal", fields: ["preview"] }
  };
}

function permissionsFor(familyId: ToolFamilyId): readonly string[] {
  if (familyId.startsWith("file.") || familyId === "workspace.glob" || familyId === "asset.view-local") return ["workspace:read"];
  if (familyId === "file.write" || familyId === "file.edit" || familyId === "patch.apply" || familyId === "revert.undo") return ["workspace:write"];
  if (familyId.startsWith("shell.") || familyId.startsWith("process.") || familyId === "repl.execute") return ["process:run"];
  if (familyId.startsWith("git.") || familyId === "build.test-lint-typecheck" || familyId === "package.manager") return ["process:run"];
  if (familyId.startsWith("pipeline.")) return ["pipeline:execute"];
  if (familyId.startsWith("agent.")) return ["agent:read", "agent:write"];
  if (familyId.startsWith("web.")) return ["network:fake"];
  if (familyId.startsWith("browser.")) return ["browser:fake"];
  if (familyId.startsWith("mcp.")) return ["mcp:read"];
  if (familyId.startsWith("image.")) return ["media:fake"];
  if (familyId.startsWith("design.")) return ["design:fake"];
  if (familyId === "memory.read-write") return ["memory:read", "memory:write"];
  if (familyId === "context.project-index") return ["context:index", "context:query"];
  if (familyId === "session.resume-fork") return ["session:read", "session:write"];
  if (familyId === "compact.summary") return ["context:summary"];
  if (familyId === "remote.runtime") return ["remote:connect"];
  if (familyId === "worktree.environment") return ["workspace:worktree"];
  if (familyId === "schedule.sleep-cron") return ["schedule:run"];
  if (familyId === "observability.trace-budget") return ["observability:read", "usage:read"];
  return [];
}

function connectorKindFor(familyId: ToolFamilyId): ToolFamilyConnectorProfileEvidence["connectorKind"] {
  if (familyId.startsWith("browser.") || familyId.startsWith("mcp.") || familyId.startsWith("design.")) return "mcp";
  if (familyId.startsWith("web.") || familyId.startsWith("image.")) return "provider";
  if (familyId === "code.diagnostics-lsp" || familyId === "user.input" || familyId === "approval.permission" || familyId === "remote.runtime" || familyId === "worktree.environment" || familyId === "plugin.install-verify" || familyId === "command.palette-slash") return "host";
  return "built-in";
}

function providerSupportFor(familyId: ToolFamilyId): ToolFamilyCoverageEvidence["providerNativeSupport"] {
  if (familyId.startsWith("browser.") || familyId.startsWith("mcp.") || familyId.startsWith("design.") || familyId.startsWith("web.") || familyId.startsWith("image.")) return "fake";
  if (familyId === "remote.runtime" || familyId === "worktree.environment") return "connector";
  return "not_applicable";
}
