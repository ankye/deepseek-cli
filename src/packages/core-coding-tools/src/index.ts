import type { AgentSpawner, BackgroundTaskManager, CapabilityManifest, CapabilityRegistry, PlatformRuntime, RuntimeDependencies, WebFetchProvider, WebSearchProvider, WorkspaceStateManager } from "@deepseek/platform-contracts";
import type { CoreCodingToolsDependencies } from "./shared/workspace.js";
import type { ToolDefinition } from "./shared/tool-kit.js";
import { defineFileReadTool } from "./tools/file-read/index.js";
import { defineFileWriteTool } from "./tools/file-write/index.js";
import { defineFileEditTool } from "./tools/file-edit/index.js";
import { defineFileListTool } from "./tools/file-list/index.js";
import { defineSearchTextTool } from "./tools/search-text/index.js";
import { defineShellRunTool } from "./tools/shell-run/index.js";
import { defineShellOutputTool } from "./tools/shell-output/index.js";
import { defineShellKillTool } from "./tools/shell-kill/index.js";
import { defineTestRunTool } from "./tools/test-run/index.js";
import { defineGitStatusTool } from "./tools/git-status/index.js";
import { defineGitDiffTool } from "./tools/git-diff/index.js";
import { defineTodoPlanTool } from "./tools/todo-plan/index.js";
import { defineWebFetchTool } from "./tools/web-fetch/index.js";
import { defineWebSearchTool } from "./tools/web-search/index.js";
import { defineAgentSpawnTool } from "./tools/agent-spawn/index.js";

export { coreToolIds } from "./shared/ids.js";
export type { CoreCodingToolsDependencies } from "./shared/workspace.js";
export type { ToolDefinition } from "./shared/tool-kit.js";

export interface ExtendedCoreCodingToolsDependencies extends CoreCodingToolsDependencies {
  readonly webFetch?: WebFetchProvider;
  readonly webSearch?: WebSearchProvider;
  readonly backgroundTasks?: BackgroundTaskManager;
  readonly agentSpawner?: AgentSpawner;
}

export async function registerCoreCodingTools(registry: CapabilityRegistry, deps: ExtendedCoreCodingToolsDependencies): Promise<void> {
  for (const definition of coreToolDefinitions(deps)) {
    if (await registry.get(definition.manifest.id)) continue;
    await registry.register(definition.manifest, definition.execute);
  }
}

export async function registerCoreCodingToolsForRuntime(deps: {
  readonly capabilities: CapabilityRegistry;
  readonly platform: PlatformRuntime;
  readonly workspaceState: WorkspaceStateManager;
  readonly webFetch?: RuntimeDependencies["webFetch"];
  readonly webSearch?: RuntimeDependencies["webSearch"];
  readonly backgroundTasks?: RuntimeDependencies["backgroundTasks"];
  readonly agentSpawner?: RuntimeDependencies["agentSpawner"];
}, workspaceRoot: string): Promise<void> {
  await registerCoreCodingTools(deps.capabilities, {
    platform: deps.platform,
    workspaceState: deps.workspaceState,
    workspaceRoot,
    ...(deps.webFetch ? { webFetch: deps.webFetch } : {}),
    ...(deps.webSearch ? { webSearch: deps.webSearch } : {}),
    ...(deps.backgroundTasks ? { backgroundTasks: deps.backgroundTasks } : {}),
    ...(deps.agentSpawner ? { agentSpawner: deps.agentSpawner } : {})
  });
}

export function coreToolManifests(): readonly CapabilityManifest[] {
  return coreToolDefinitions(undefined).map((definition) => definition.manifest);
}

function coreToolDefinitions(deps: ExtendedCoreCodingToolsDependencies | undefined): readonly ToolDefinition[] {
  return [
    defineFileReadTool(deps),
    defineFileWriteTool(deps),
    defineFileEditTool(deps),
    defineFileListTool(deps),
    defineSearchTextTool(deps),
    defineShellRunTool(deps),
    defineShellOutputTool(deps),
    defineShellKillTool(deps),
    defineGitStatusTool(deps),
    defineGitDiffTool(deps),
    defineTestRunTool(deps),
    defineTodoPlanTool(),
    defineWebFetchTool(deps),
    defineWebSearchTool(deps),
    defineAgentSpawnTool(deps)
  ];
}
