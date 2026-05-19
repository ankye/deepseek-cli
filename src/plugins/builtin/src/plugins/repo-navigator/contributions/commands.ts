import { command } from "@deepseek/plugin-api";
import { outputSchema, queryInputSchema } from "../../../shared/schemas.js";

export const commands = [
  command({ id: "repo.files", name: "Repo: Files", aliases: ["/repo files"], description: "Search workspace files through existing host/index boundaries.", ownerSubsystem: "command-system", commandId: "repo.navigator.files", sideEffect: "read", permissions: ["workspace:read"], group: "repo", order: 10, inputSchema: queryInputSchema, outputSchema }),
  command({ id: "repo.grep", name: "Repo: Grep", aliases: ["/repo grep"], description: "Search file content through existing grep result boundaries.", ownerSubsystem: "command-system", commandId: "repo.navigator.grep", sideEffect: "read", permissions: ["workspace:read"], group: "repo", order: 20, inputSchema: queryInputSchema, outputSchema }),
  command({ id: "repo.recall", name: "Repo: Recall", aliases: ["/repo recall"], description: "Search PageIndex recall for completed chat turns.", ownerSubsystem: "command-system", commandId: "repo.navigator.recall", sideEffect: "read", permissions: ["pageindex:read"], group: "repo", order: 30, inputSchema: queryInputSchema, outputSchema }),
  command({ id: "repo.project-index", name: "Repo: Project Index", aliases: ["/repo index"], description: "Project indexed code references when available.", ownerSubsystem: "context-engine", commandId: "repo.navigator.project-index", sideEffect: "read", permissions: ["index:read", "workspace:read"], group: "repo", order: 40, inputSchema: queryInputSchema, outputSchema })
] as const;
