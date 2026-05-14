import type { RuntimeDependencies, RuntimeKernel } from "@deepseek/platform-contracts";
import {
  CredentialAuthModelCredentialProvider,
  createDeepSeekCredentialAuthServiceFromEnv
} from "@deepseek/credential-auth-management";
import { OpenAIModelProviderTransport } from "@deepseek/model-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { createDefaultRuntimeKernel, loadUserHooks, registerRuntimeCoreTools } from "@deepseek/runtime";
import { PersistentFilesystemSessionStore, userSessionsDirectory } from "@deepseek/session-store";
import { createDeterministicRuntimeDependencies, createLiveCliDependencies } from "@deepseek/testing-regression";
import type { CliRunOptions, CliRuntimeFactoryOptions } from "../types.js";

export async function createCliAgentRuntime(options: CliRuntimeFactoryOptions, runOptions: CliRunOptions): Promise<{ readonly deps: RuntimeDependencies; readonly kernel: RuntimeKernel }> {
  if (runOptions.createRuntime) return runOptions.createRuntime(options);
  const deps: RuntimeDependencies = options.live
    ? createLiveCliDependencies({
        workspaceRoot: options.workspaceRoot,
        credentials: new CredentialAuthModelCredentialProvider(await createDeepSeekCredentialAuthServiceFromEnv()),
        transport: new OpenAIModelProviderTransport(),
        timeoutMs: 90_000,
        allowWorkspaceWrites: options.toolProjection === "read-write" || options.toolProjection === "all"
      })
    : createCliSessionDependenciesBase();
  await loadUserHooks(options.workspaceRoot, deps, new NodePlatformRuntime()).catch((error: unknown) => {
    console.warn(`deepseek: user hook loading failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  await registerRuntimeCoreTools(deps, options.workspaceRoot);
  return { deps, kernel: await createDefaultRuntimeKernel(deps) };
}

export async function resolveSessionDependencies(runOptions: CliRunOptions, workspaceRoot = process.cwd()): Promise<RuntimeDependencies> {
  if (runOptions.createRuntime) {
    const runtime = await runOptions.createRuntime({ live: false, workspaceRoot });
    return runtime.deps;
  }
  return createCliSessionDependencies(workspaceRoot);
}

async function createCliSessionDependencies(workspaceRoot = process.cwd()): Promise<RuntimeDependencies> {
  const deps = createCliSessionDependenciesBase();
  await registerRuntimeCoreTools(deps, workspaceRoot);
  return deps;
}

function createCliSessionDependenciesBase(): RuntimeDependencies {
  const deps = createDeterministicRuntimeDependencies();
  const persistentSessionsDirectory = userSessionsDirectory();
  try {
    const persistentSessions = new PersistentFilesystemSessionStore(persistentSessionsDirectory);
    return { ...deps, sessions: persistentSessions };
  } catch (error) {
    console.warn(`deepseek: falling back to in-memory sessions because ${persistentSessionsDirectory} could not be initialized:`, error instanceof Error ? error.message : String(error));
    return deps;
  }
}
