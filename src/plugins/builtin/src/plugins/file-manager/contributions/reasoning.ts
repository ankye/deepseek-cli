import { reasoningContribution } from "@deepseek/plugin-api";

export const reasoningContributions = [
  reasoningContribution({ id: "file-manager.reasoning", stepKind: "context-selection", detailLevel: "compact", evidenceKinds: ["file", "result-list-item"] })
] as const;
