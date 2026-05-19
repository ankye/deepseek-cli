import { reasoningContribution } from "@deepseek/plugin-api";

export const reasoningContributions = [
  reasoningContribution({ id: "git.reasoning", stepKind: "verification", detailLevel: "compact", evidenceKinds: ["diff", "diagnostic"] })
] as const;
