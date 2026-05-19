import { reasoningContribution } from "@deepseek/plugin-api";

export const reasoningContributions = [
  reasoningContribution({ id: "checks.reasoning", stepKind: "verification", detailLevel: "compact", evidenceKinds: ["check", "diagnostic"] })
] as const;
