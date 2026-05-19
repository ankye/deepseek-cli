import type { CliTargetRef, VisibleReasoningProjection } from "@deepseek/platform-contracts";

export interface ChatTuiReasoningPanel {
  readonly enabled: boolean;
  readonly detailLevel: "compact" | "full" | "debug";
  readonly recordCount: number;
  readonly evidenceLinkCount: number;
  readonly activeRecordId?: string;
  readonly inspectorTargets: readonly CliTargetRef[];
  readonly statusText: string;
}

export function reasoningPanelFromProjection(projection: VisibleReasoningProjection | undefined, enabled: boolean): ChatTuiReasoningPanel {
  if (!enabled || !projection) {
    return {
      enabled: false,
      detailLevel: "compact",
      recordCount: 0,
      evidenceLinkCount: 0,
      inspectorTargets: [],
      statusText: "reasoning=unavailable"
    };
  }
  const activeRecord = projection.records.find((record) => record.recordId === projection.activeRecordId) ?? projection.records.at(-1);
  return {
    enabled: true,
    detailLevel: projection.detailLevel,
    recordCount: projection.summary.visibleRecords,
    evidenceLinkCount: projection.summary.evidenceLinkCount,
    ...(activeRecord ? { activeRecordId: activeRecord.recordId } : {}),
    inspectorTargets: activeRecord?.evidence.map((link) => link.target) ?? [],
    statusText: `reasoning=${projection.summary.visibleRecords} evidence=${projection.summary.evidenceLinkCount} assumptions=${projection.summary.assumptionCount}`
  };
}
