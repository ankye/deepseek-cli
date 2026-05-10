import type { CapabilityManifest, CapabilityRegistry, PlatformRuntime, WorkspaceStateManager } from "@deepseek/platform-contracts";
import type { CoreCodingToolsDependencies } from "./shared/workspace.js";
import type { ToolDefinition } from "./shared/tool-kit.js";
import { defineFileReadTool } from "./tools/file-read/index.js";
import { defineFileWriteTool } from "./tools/file-write/index.js";
import { defineFileEditTool } from "./tools/file-edit/index.js";
import { defineFileListTool } from "./tools/file-list/index.js";
import { defineSearchTextTool } from "./tools/search-text/index.js";
import { defineShellRunTool } from "./tools/shell-run/index.js";
import { defineTestRunTool } from "./tools/test-run/index.js";
import { defineGitStatusTool } from "./tools/git-status/index.js";
import { defineGitDiffTool } from "./tools/git-diff/index.js";
import { defineTodoPlanTool } from "./tools/todo-plan/index.js";

export { coreToolIds } from "./shared/ids.js";
export type { CoreCodingToolsDependencies } from "./shared/workspace.js";
export type { ToolDefinition } from "./shared/tool-kit.js";

export async function registerCoreCodingTools(registry: CapabilityRegistry, deps: CoreCodingToolsDependencies): Promise<void> {
  for (const definition of coreToolDefinitions(deps)) {
    if (await registry.get(definition.manifest.id)) continue;
    await registry.register(definition.manifest, definition.execute);
  }
}

export async function registerCoreCodingToolsForRuntime(deps: {
  readonly capabilities: CapabilityRegistry;
  readonly platform: PlatformRuntime;
  readonly workspaceState: WorkspaceStateManager;
}, workspaceRoot: string): Promise<void> {
  await registerCoreCodingTools(deps.capabilities, {
    platform: deps.platform,
    workspaceState: deps.workspaceState,
    workspaceRoot
  });
}

export function coreToolManifests(): readonly CapabilityManifest[] {
  return coreToolDefinitions(undefined).map((definition) => definition.manifest);
}

function coreToolDefinitions(deps: CoreCodingToolsDependencies | undefined): readonly ToolDefinition[] {
  return [
    defineFileReadTool(deps),
    defineFileWriteTool(deps),
    defineFileEditTool(deps),
    defineFileListTool(deps),
    defineSearchTextTool(deps),
    defineShellRunTool(deps),
    defineGitStatusTool(deps),
    defineGitDiffTool(deps),
    defineTestRunTool(deps),
    defineTodoPlanTool()
  ];
}
