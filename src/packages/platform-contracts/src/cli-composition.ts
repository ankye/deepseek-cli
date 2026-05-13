import type { JsonObject } from "./common.js";
import type { CapabilityId, PluginId, SessionId, TaskId, TurnId } from "./ids.js";

export type CliInteractionMode =
  | "prompt"
  | "normal"
  | "command"
  | "approval"
  | "selection"
  | "result-list";

export type CliActionKind =
  | "accept"
  | "deny"
  | "open"
  | "inspect"
  | "copy"
  | "retry"
  | "explain"
  | "diff"
  | "apply"
  | "revert"
  | "search"
  | "narrow"
  | "expand"
  | "next"
  | "previous"
  | "first"
  | "last"
  | "back"
  | "forward"
  | "add-to-reference-set"
  | "focus-reference";

export type CliApprovalActionKind = Extract<CliActionKind, "inspect" | "accept" | "deny"> | "cancel";

export type CliTargetKind =
  | "message"
  | "turn"
  | "request"
  | "file"
  | "directory"
  | "symbol"
  | "diff"
  | "diff-hunk"
  | "diagnostic"
  | "command"
  | "session"
  | "task"
  | "approval-request"
  | "extension"
  | "result-list"
  | "result-list-item"
  | "tool-evidence";

export type CliReferenceKind =
  | "file"
  | "directory"
  | "symbol"
  | "diff"
  | "diagnostic"
  | "search-result"
  | "message"
  | "turn"
  | "tool-evidence";

export type CliResultListKind =
  | "diagnostics"
  | "search"
  | "tests"
  | "code-intelligence"
  | "tool-results"
  | "approvals"
  | "generic";

export type CliContributionKind =
  | "command"
  | "action"
  | "target-resolver"
  | "result-list-provider"
  | "keymap"
  | "palette-entry"
  | "render-hint";

export type CliContributionSourceKind = "core" | "user" | "plugin";

export interface CliTargetRef extends JsonObject {
  readonly kind: CliTargetKind;
  readonly id: string;
  readonly label?: string;
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly taskId?: TaskId;
  readonly path?: string;
  readonly pluginId?: PluginId;
  readonly metadata?: JsonObject;
}

export interface CliActionRequest extends JsonObject {
  readonly action: CliActionKind;
  readonly target: CliTargetRef;
  readonly mode: CliInteractionMode;
  readonly count?: number;
  readonly repeatOf?: string;
  readonly dryRun?: boolean;
  readonly arguments?: JsonObject;
}

export interface CliApprovalActionRequest extends JsonObject {
  readonly action: CliApprovalActionKind;
  readonly target: CliTargetRef & { readonly kind: "approval-request" };
  readonly mode: "approval";
  readonly dryRun?: boolean;
  readonly arguments?: JsonObject;
}

export interface CliApprovalActionResult extends JsonObject {
  readonly ok: boolean;
  readonly action: CliApprovalActionKind;
  readonly target: CliTargetRef & { readonly kind: "approval-request" };
  readonly brokerDecision?: "allow" | "deny" | "cancel";
  readonly protocolControl?: JsonObject;
  readonly inspected?: JsonObject;
  readonly error?: JsonObject;
  readonly redaction: JsonObject;
}

export interface CliReferenceItem extends JsonObject {
  readonly id: string;
  readonly kind: CliReferenceKind;
  readonly target: CliTargetRef;
  readonly label: string;
  readonly provenance: JsonObject;
  readonly order: number;
  readonly budget?: {
    readonly estimatedTokens?: number;
    readonly bytes?: number;
  };
}

export interface CliReferenceSet extends JsonObject {
  readonly id: string;
  readonly label: string;
  readonly items: readonly CliReferenceItem[];
  readonly activeItemId?: string;
  readonly provenance: JsonObject;
  readonly createdAt?: string;
}

export interface CliResultListItem extends JsonObject {
  readonly id: string;
  readonly target: CliTargetRef;
  readonly label: string;
  readonly order: number;
  readonly severity?: "info" | "warning" | "error";
  readonly metadata?: JsonObject;
}

export interface CliResultList extends JsonObject {
  readonly id: string;
  readonly kind: CliResultListKind;
  readonly sourceCommand?: string;
  readonly label: string;
  readonly items: readonly CliResultListItem[];
  readonly activeItemId?: string;
  readonly metadata?: JsonObject;
}

export interface CliJumpEntry extends JsonObject {
  readonly id: string;
  readonly source?: CliTargetRef;
  readonly destination: CliTargetRef;
  readonly timestamp: string;
  readonly provenance: JsonObject;
}

export interface CliJumpHistory extends JsonObject {
  readonly entries: readonly CliJumpEntry[];
  readonly cursor: number;
}

export interface CliRequestRevertTarget extends JsonObject {
  readonly requestId?: string;
  readonly turnId?: TurnId;
  readonly sessionId?: SessionId;
  readonly target: CliTargetRef;
}

export interface CliRevertPreview extends JsonObject {
  readonly target: CliRequestRevertTarget;
  readonly affectedCheckpointIds: readonly string[];
  readonly affectedPaths: readonly string[];
  readonly stalePaths: readonly string[];
  readonly nonReversibleEffects: readonly JsonObject[];
  readonly contextProjectionIds: readonly string[];
  readonly redaction: JsonObject;
}

export interface CliKeymapEntry extends JsonObject {
  readonly id: string;
  readonly mode: CliInteractionMode;
  readonly key: string;
  readonly action: CliActionKind;
  readonly targetKind?: CliTargetKind;
  readonly when?: string;
}

export interface CliPaletteEntry extends JsonObject {
  readonly id: string;
  readonly title: string;
  readonly action: CliActionKind;
  readonly targetKind?: CliTargetKind;
  readonly category?: string;
}

export interface CliInteractionContribution extends JsonObject {
  readonly id: string;
  readonly kind: CliContributionKind;
  readonly source: CliContributionSourceKind;
  readonly pluginId?: PluginId;
  readonly priority?: number;
  readonly commandName?: string;
  readonly action?: CliActionKind;
  readonly targetKind?: CliTargetKind;
  readonly keymap?: CliKeymapEntry;
  readonly paletteEntry?: CliPaletteEntry;
  readonly metadata?: JsonObject;
}

export interface CliContributionConflict extends JsonObject {
  readonly id: string;
  readonly kind: CliContributionKind;
  readonly winnerId: string;
  readonly loserIds: readonly string[];
  readonly reason: string;
}

export interface CliContributionValidationResult extends JsonObject {
  readonly ok: boolean;
  readonly conflicts: readonly CliContributionConflict[];
  readonly diagnostics: readonly string[];
}

export interface CliCompositionSnapshot extends JsonObject {
  readonly mode: CliInteractionMode;
  readonly activeTarget?: CliTargetRef;
  readonly referenceSets: readonly CliReferenceSet[];
  readonly resultLists: readonly CliResultList[];
  readonly jumpHistory: CliJumpHistory;
  readonly contributions: readonly CliInteractionContribution[];
}

export function validateCliInteractionContributions(contributions: readonly CliInteractionContribution[]): CliContributionValidationResult {
  const conflicts: CliContributionConflict[] = [];
  const diagnostics: string[] = [];
  const seen = new Map<string, CliInteractionContribution>();
  for (const contribution of contributions) {
    const conflictKey = contributionConflictKey(contribution);
    const existing = seen.get(conflictKey);
    if (!existing) {
      seen.set(conflictKey, contribution);
      continue;
    }
    const winner = chooseContributionWinner(existing, contribution);
    const loser = winner.id === existing.id ? contribution : existing;
    seen.set(conflictKey, winner);
    conflicts.push({
      id: `${conflictKey}:conflict`,
      kind: contribution.kind,
      winnerId: winner.id,
      loserIds: [loser.id],
      reason: `duplicate ${contribution.kind} contribution for ${conflictKey}`
    });
  }
  for (const contribution of contributions) {
    if (!contribution.id.trim()) diagnostics.push("contribution id is required");
    if (contribution.kind === "keymap" && !contribution.keymap) diagnostics.push(`keymap contribution ${contribution.id} is missing keymap`);
    if (contribution.kind === "palette-entry" && !contribution.paletteEntry) diagnostics.push(`palette contribution ${contribution.id} is missing paletteEntry`);
  }
  return { ok: diagnostics.length === 0, conflicts, diagnostics };
}

export function createCliApprovalActionRequest(input: {
  readonly action: CliApprovalActionKind;
  readonly approvalId: string;
  readonly label?: string;
  readonly sessionId?: SessionId;
  readonly dryRun?: boolean;
  readonly arguments?: JsonObject;
}): CliApprovalActionRequest {
  return {
    action: input.action,
    mode: "approval",
    target: {
      kind: "approval-request",
      id: input.approvalId,
      ...(input.label ? { label: input.label } : {}),
      ...(input.sessionId ? { sessionId: input.sessionId } : {})
    },
    ...(input.dryRun !== undefined ? { dryRun: input.dryRun } : {}),
    ...(input.arguments ? { arguments: input.arguments } : {})
  };
}

export function resolveCliApprovalAction(request: CliApprovalActionRequest): CliApprovalActionResult {
  if (request.target.kind !== "approval-request" || !request.target.id.trim()) {
    return {
      ok: false,
      action: request.action,
      target: request.target,
      error: {
        code: "CLI_APPROVAL_TARGET_INVALID",
        message: "Approval action requires an approval-request target."
      },
      redaction: { class: "internal" }
    };
  }
  if (request.action === "inspect") {
    return {
      ok: true,
      action: request.action,
      target: request.target,
      inspected: {
        approvalId: request.target.id,
        label: request.target.label ?? request.target.id
      },
      redaction: { class: "internal" }
    };
  }
  const brokerDecision = request.action === "accept" ? "allow" : request.action;
  return {
    ok: true,
    action: request.action,
    target: request.target,
    brokerDecision,
    protocolControl: {
      kind: "approval.decision",
      approvalId: request.target.id,
      decision: brokerDecision
    },
    redaction: { class: "internal" }
  };
}

function contributionConflictKey(contribution: CliInteractionContribution): string {
  if (contribution.kind === "keymap" && contribution.keymap) {
    return `keymap:${contribution.keymap.mode}:${contribution.keymap.key}`;
  }
  if (contribution.kind === "palette-entry" && contribution.paletteEntry) {
    return `palette-entry:${contribution.paletteEntry.title}`;
  }
  if (contribution.kind === "command") {
    return `command:${contribution.commandName ?? contribution.id}`;
  }
  if (contribution.kind === "action") {
    return `action:${contribution.action ?? contribution.id}:${contribution.targetKind ?? "*"}`;
  }
  return `${contribution.kind}:${contribution.id}`;
}

function chooseContributionWinner(a: CliInteractionContribution, b: CliInteractionContribution): CliInteractionContribution {
  const priorityA = contributionPriority(a);
  const priorityB = contributionPriority(b);
  if (priorityA !== priorityB) return priorityA > priorityB ? a : b;
  return a.id <= b.id ? a : b;
}

function contributionPriority(contribution: CliInteractionContribution): number {
  if (typeof contribution.priority === "number") return contribution.priority;
  if (contribution.source === "core") return 100;
  if (contribution.source === "user") return 75;
  return 50;
}
