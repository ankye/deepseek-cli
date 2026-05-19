import { reasoningContribution } from "@deepseek/plugin-api";

export const reasoningContributions = [
  reasoningContribution({ id: "context.reasoning", stepKind: "context-selection", detailLevel: "full", evidenceKinds: ["context-node", "tool-evidence"] })
] as const;
