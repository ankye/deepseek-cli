import { command } from "@deepseek/plugin-api";
import { outputSchema, queryInputSchema } from "../../../shared/schemas.js";

export const commands = [
  command({ id: "jump.file", name: "Jump: File", aliases: ["/jump file"], description: "Jump to a matching workspace file.", ownerSubsystem: "command-system", commandId: "jump.navigator.file", sideEffect: "read", permissions: ["workspace:read"], group: "jump", order: 10, inputSchema: queryInputSchema, outputSchema }),
  command({ id: "jump.text", name: "Jump: Text", aliases: ["/jump text"], description: "Jump to matching text occurrences in workspace files.", ownerSubsystem: "command-system", commandId: "jump.navigator.text", sideEffect: "read", permissions: ["workspace:read"], group: "jump", order: 20, inputSchema: queryInputSchema, outputSchema }),
  command({ id: "jump.symbol", name: "Jump: Symbol", aliases: ["/jump symbol"], description: "Jump to symbol references when code intelligence execution is available.", ownerSubsystem: "code-intelligence", commandId: "jump.navigator.symbol", sideEffect: "read", permissions: ["workspace:read", "index:read"], group: "jump", order: 30, inputSchema: queryInputSchema, outputSchema })
] as const;
