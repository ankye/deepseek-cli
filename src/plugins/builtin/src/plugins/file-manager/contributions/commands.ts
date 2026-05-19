import { command } from "@deepseek/plugin-api";
import { outputSchema, queryInputSchema } from "../../../shared/schemas.js";

export const commands = [
  command({ id: "file.list", name: "File Manager: List", aliases: ["/file list"], description: "List workspace files through read-only platform search.", ownerSubsystem: "command-system", commandId: "file.manager.list", sideEffect: "read", permissions: ["workspace:read"], group: "files", order: 10, inputSchema: queryInputSchema, outputSchema }),
  command({ id: "file.preview", name: "File Manager: Preview", aliases: ["/file preview"], description: "Preview a workspace file without mutating it.", ownerSubsystem: "command-system", commandId: "file.manager.preview", sideEffect: "read", permissions: ["workspace:read"], group: "files", order: 20, inputSchema: queryInputSchema, outputSchema }),
  command({ id: "file.references", name: "File Manager: References", aliases: ["/file refs"], description: "Collect matching files as reference targets.", ownerSubsystem: "command-system", commandId: "file.manager.references", sideEffect: "read", permissions: ["workspace:read"], group: "files", order: 30, inputSchema: queryInputSchema, outputSchema })
] as const;
