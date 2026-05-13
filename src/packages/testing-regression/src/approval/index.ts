import type { ApprovalLifecycleRecord, ApprovalRenderSummary } from "@deepseek/platform-contracts";
import { coveredReferencePitFixtureIds } from "../reference-pits/index.js";

export interface ApprovalEvidenceParitySubject {
  readonly approvalId: string;
  readonly summary: ApprovalRenderSummary;
  readonly referencePitFixtureIds: readonly string[];
}

export function approvalEvidenceSubjectFromRecord(record: ApprovalLifecycleRecord): ApprovalEvidenceParitySubject {
  return {
    approvalId: record.approvalId,
    summary: record.summary,
    referencePitFixtureIds: uniqueSorted([
      ...record.summary.referencePitFixtureIds,
      ...(record.decision?.metadata.referencePitFixtureIds && Array.isArray(record.decision.metadata.referencePitFixtureIds)
        ? record.decision.metadata.referencePitFixtureIds.map(String)
        : [])
    ])
  };
}

export function assertApprovalEvidenceParity(subjects: readonly ApprovalEvidenceParitySubject[]): void {
  if (subjects.length === 0) {
    throw new Error("APPROVAL_EVIDENCE_PARITY_MISSING: no subjects");
  }
  const first = subjects[0];
  if (!first) {
    throw new Error("APPROVAL_EVIDENCE_PARITY_MISSING: no subjects");
  }
  for (const subject of subjects.slice(1)) {
    if (subject.approvalId !== first.approvalId) {
      throw new Error(`APPROVAL_EVIDENCE_PARITY_MISMATCH: approvalId ${subject.approvalId} !== ${first.approvalId}`);
    }
    if (subject.summary.title !== first.summary.title || subject.summary.action !== first.summary.action || subject.summary.resource !== first.summary.resource) {
      throw new Error(`APPROVAL_EVIDENCE_PARITY_MISMATCH: summary differs for ${subject.approvalId}`);
    }
  }
}

export function missingApprovalReferencePitIds(actualIds: Iterable<string>, requiredIds: Iterable<string> = coveredReferencePitFixtureIds()): readonly string[] {
  const actual = new Set(actualIds);
  return [...requiredIds].filter((id) => !actual.has(id)).sort();
}

export function assertApprovalReferencePitIds(actualIds: Iterable<string>, requiredIds: Iterable<string>): void {
  const missing = missingApprovalReferencePitIds(actualIds, requiredIds);
  if (missing.length > 0) {
    throw new Error(`APPROVAL_REFERENCE_PIT_IDS_MISSING: ${missing.join(", ")}`);
  }
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort();
}
