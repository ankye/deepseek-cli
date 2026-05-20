import type { GovernanceEvidenceMatrixSummary, JsonObject } from "@deepseek/platform-contracts";

export function renderGovernanceEvidenceMatrixText(matrix: GovernanceEvidenceMatrixSummary): readonly string[] {
  const lines = [
    `- governance evidence matrix: ${matrix.status} records=${matrix.recordCount} ready=${matrix.readyCount} gated=${matrix.gatedCount} blockers=${matrix.promotionBlockerCount}`
  ];
  for (const record of matrix.records) {
    lines.push(`- evidence ${record.packageName}/${record.capability}: ${record.productReadiness} tier=${record.riskTier} state=${record.maturityState} missing=${record.missingEvidenceTypes.join(", ") || "none"}`);
  }
  return lines;
}

export function governanceEvidenceMatrixJsonLines(
  schemaVersion: string,
  matrix: GovernanceEvidenceMatrixSummary | undefined
): readonly JsonObject[] {
  if (!matrix) return [];
  const entries: JsonObject[] = [{
    schemaVersion,
    kind: "diagnostics.governance.evidence-matrix.summary",
    matrix,
    redaction: matrix.redaction
  }];
  for (const record of matrix.records) {
    entries.push({
      schemaVersion,
      kind: "diagnostics.governance.evidence-matrix.record",
      record,
      redaction: record.redaction
    });
  }
  for (const finding of matrix.findings) {
    entries.push({
      schemaVersion,
      kind: "diagnostics.governance.evidence-matrix.finding",
      finding,
      redaction: finding.redaction
    });
  }
  return entries;
}
