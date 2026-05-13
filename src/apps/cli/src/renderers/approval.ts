import type { ApprovalLifecycleRecord, ApprovalRenderSummary, RuntimeEvent } from "@deepseek/platform-contracts";
import type { CliTerminalCapabilityProfile } from "../host/terminal-profile.js";

export function isApprovalEvent(event: RuntimeEvent): boolean {
  return event.kind.startsWith("approval.");
}

export function approvalRecordFromEvent(event: RuntimeEvent): ApprovalLifecycleRecord | undefined {
  const approval = event.data.approval;
  if (!approval || typeof approval !== "object") return undefined;
  return approval as ApprovalLifecycleRecord;
}

export function renderApprovalText(event: RuntimeEvent, profile?: CliTerminalCapabilityProfile): string {
  const record = approvalRecordFromEvent(event);
  if (!record) return "";
  const summary = record.summary;
  const width = profile?.columns && profile.columns > 0 ? Math.max(40, profile.columns) : 80;
  const prefix = approvalPrefix(record.kind);
  const lines = [
    `${prefix} ${summary.title} id=${record.approvalId}`,
    `target: ${summary.targetLabel}`,
    `action: ${summary.action} resource: ${summary.resource}`,
    `decisions: ${summary.allowedDecisions.join(", ")}`
  ];
  for (const risk of summary.riskSummaries) {
    lines.push(...wrapLine(`risk(${risk.severity}/${risk.kind}): ${risk.title} - ${risk.detail}`, width));
  }
  if (record.decision) {
    lines.push(`decision: ${record.decision.decision} source=${record.decision.source} reason=${record.decision.reasonCode}`);
  }
  if (summary.referencePitFixtureIds.length > 0) {
    lines.push(`fixtures: ${summary.referencePitFixtureIds.join(", ")}`);
  }
  lines.push(`audit: trace=${record.auditReference.traceId} correlation=${record.auditReference.correlationId}`);
  if (profile && shouldRenderFallback(profile)) {
    lines.push(`profile: ${profile.rendererProfile} ${profile.reasons.join(",")}`);
  }
  return lines.join("\n");
}

export function renderApprovalJson(event: RuntimeEvent): Record<string, unknown> | undefined {
  const record = approvalRecordFromEvent(event);
  if (!record) return undefined;
  return {
    schemaVersion: record.schemaVersion,
    kind: record.kind,
    approvalId: record.approvalId,
    sessionId: record.sessionId,
    trace: record.trace,
    summary: structuredSummary(record.summary),
    decision: record.decision,
    auditReference: record.auditReference,
    redaction: record.redaction,
    compatibility: record.compatibility
  };
}

function structuredSummary(summary: ApprovalRenderSummary): Record<string, unknown> {
  return {
    schemaVersion: summary.schemaVersion,
    title: summary.title,
    subject: summary.subject,
    action: summary.action,
    resource: summary.resource,
    capability: summary.capability,
    targetKind: summary.targetKind,
    targetLabel: summary.targetLabel,
    riskSummaries: summary.riskSummaries,
    allowedDecisions: summary.allowedDecisions,
    referencePitFixtureIds: summary.referencePitFixtureIds,
    redaction: summary.redaction,
    metadata: summary.metadata
  };
}

function approvalPrefix(kind: ApprovalLifecycleRecord["kind"]): string {
  if (kind === "approval.required") return "[approval required]";
  if (kind === "approval.decided") return "[approval decided]";
  if (kind === "approval.denied") return "[approval denied]";
  if (kind === "approval.timeout") return "[approval timeout]";
  if (kind === "approval.cancelled") return "[approval cancelled]";
  return "[approval audit]";
}

function shouldRenderFallback(profile: CliTerminalCapabilityProfile): boolean {
  return profile.rendererProfile === "plain" || profile.inputStrategy === "none" || profile.inputStrategy === "scripted" || profile.colorDepth === "none" || !profile.columns;
}

function wrapLine(line: string, width: number): readonly string[] {
  if (line.length <= width) return [line];
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length > width) {
      lines.push(current);
      current = word;
      continue;
    }
    current = `${current} ${word}`;
  }
  if (current) lines.push(current);
  return lines;
}
