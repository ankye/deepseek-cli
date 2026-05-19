import { reasoningContribution } from "@deepseek/plugin-api";

export const reasoningContributions = [
  reasoningContribution({ id: "repo.reasoning", stepKind: "context-selection", detailLevel: "compact", evidenceKinds: ["result-list-item", "context-node"] })
] as const;
