import { command } from "@deepseek/plugin-api";
import { emptyInputSchema, outputSchema } from "../../../shared/schemas.js";

export const commands = [
  command({ id: "git.status", name: "Git: Status", aliases: ["/git status"], description: "Show read-only git status projection.", ownerSubsystem: "command-system", commandId: "git.review.status", sideEffect: "read", permissions: ["git:read", "workspace:read"], group: "git", order: 10, inputSchema: emptyInputSchema, outputSchema }),
  command({ id: "git.diff", name: "Git: Diff", aliases: ["/git diff"], description: "Show read-only git diff projection.", ownerSubsystem: "command-system", commandId: "git.review.diff", sideEffect: "read", permissions: ["git:read", "workspace:read"], group: "git", order: 20, inputSchema: emptyInputSchema, outputSchema }),
  command({ id: "git.review", name: "Git: Review", aliases: ["/git review"], description: "Project review targets from status and diff evidence.", ownerSubsystem: "command-system", commandId: "git.review.summary", sideEffect: "read", permissions: ["git:read", "workspace:read"], group: "git", order: 30, inputSchema: emptyInputSchema, outputSchema })
] as const;
