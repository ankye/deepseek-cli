import { reasoningContribution } from "@deepseek/plugin-api";

export const reasoningContributions = [
  reasoningContribution({ id: "jump-navigator.reasoning", stepKind: "context-selection", detailLevel: "compact", evidenceKinds: ["file", "symbol", "result-list-item"] })
] as const;
