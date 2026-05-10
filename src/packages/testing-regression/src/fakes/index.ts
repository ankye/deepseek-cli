import type { ModelCredentialProvider, ModelProviderTransport, RuntimeDependencies } from "@deepseek/platform-contracts";
import { InMemoryAgentManager } from "@deepseek/agent-management";
import { InMemoryCapabilityRegistry } from "@deepseek/capability-registry";
import { DeterministicCodeIntelligenceService } from "@deepseek/code-intelligence";
import { InMemoryCommandSystem } from "@deepseek/command-system";
import { PipelineProtocolRouter } from "@deepseek/communication-protocol";
import { DeterministicScheduler } from "@deepseek/concurrency-orchestration";
import { InMemoryConfigStore } from "@deepseek/config";
import { registerCoreCodingToolsForRuntime } from "@deepseek/core-coding-tools";
import { InMemoryContextEngine } from "@deepseek/context-engine";
import { FakeCredentialManager } from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider } from "@deepseek/model-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { StaticDistributionUpdateManager } from "@deepseek/distribution-update-management";
import { InMemoryEvolutionEngine } from "@deepseek/evolution-engine";
import { InMemoryExtensionManager } from "@deepseek/extension-system";
import { InMemoryHookSystem } from "@deepseek/hook-system";
import { FakeMcpGateway } from "@deepseek/mcp-gateway";
import { InMemoryCacheManager, InMemoryMemoryManager } from "@deepseek/memory-cache-management";
import { DeterministicMockModelGateway } from "@deepseek/model-gateway";
import { DeterministicToolIntentPreflight } from "@deepseek/tool-intent-preflight";
import { InMemoryObservabilitySink } from "@deepseek/observability";
import { FakePlatformRuntime } from "@deepseek/platform-abstraction";
import { InMemoryPluginManager } from "@deepseek/plugin-system";
import { DefaultPolicyEngine, DevelopmentSandboxRuntime, HeadlessApprovalBroker } from "@deepseek/policy-sandbox";
import { NoopRemoteRuntimeConnectivity } from "@deepseek/remote-runtime-connectivity";
import { InMemoryRuntimeMessageBus } from "@deepseek/runtime-message-bus";
import { InMemorySessionStore, PersistentFilesystemSessionStore, userSessionsDirectory } from "@deepseek/session-store";
import { InMemorySkillSystem } from "@deepseek/skill-system";
import { InMemoryUsageBudgetManager } from "@deepseek/usage-budget-management";
import { SingleTurnWorkflowOrchestrator } from "@deepseek/workflow-orchestration";
import { InMemoryWorkspaceStateManager } from "@deepseek/workspace-state-management";
import { DeterministicRegressionHarness } from "../harness/index.js";

export function createDeterministicRuntimeDependencies(): RuntimeDependencies {
  const runtimePlaceholder = async () => ({
    envelope: {} as never,
    ok: false,
    error: {
      code: "ROUTER_NOT_BOUND",
      message: "Protocol router is not bound to runtime in deterministic dependencies",
      retryable: false,
      redaction: { class: "public" as const }
    }
  });

  const platform = new FakePlatformRuntime();
  const dependencies: RuntimeDependencies = {
    protocol: new PipelineProtocolRouter([], runtimePlaceholder),
    bus: new InMemoryRuntimeMessageBus(),
    workflow: new SingleTurnWorkflowOrchestrator(),
    concurrency: new DeterministicScheduler(),
    agents: new InMemoryAgentManager(),
    models: new DeterministicMockModelGateway(),
    toolIntentPreflight: new DeterministicToolIntentPreflight(),
    capabilities: new InMemoryCapabilityRegistry(),
    commands: new InMemoryCommandSystem(),
    skills: new InMemorySkillSystem(),
    hooks: new InMemoryHookSystem(),
    mcp: new FakeMcpGateway(),
    plugins: new InMemoryPluginManager(),
    extensions: new InMemoryExtensionManager(),
    context: new InMemoryContextEngine(),
    memory: new InMemoryMemoryManager(),
    cache: new InMemoryCacheManager(),
    credentials: new FakeCredentialManager(),
    usage: new InMemoryUsageBudgetManager(),
    workspaceState: new InMemoryWorkspaceStateManager(platform),
    policy: new DefaultPolicyEngine(),
    approvals: new HeadlessApprovalBroker(false),
    sandbox: new DevelopmentSandboxRuntime(),
    sessions: new InMemorySessionStore(),
    platform,
    evolution: new InMemoryEvolutionEngine(),
    codeIntelligence: new DeterministicCodeIntelligenceService(platform),
    remote: new NoopRemoteRuntimeConnectivity(),
    distribution: new StaticDistributionUpdateManager(),
    config: new InMemoryConfigStore(),
    observability: new InMemoryObservabilitySink(),
    regression: new DeterministicRegressionHarness()
  };
  return dependencies;
}

export async function registerDeterministicCoreTools(deps: RuntimeDependencies, workspaceRoot = "/workspace"): Promise<void> {
  await registerCoreCodingToolsForRuntime(deps, workspaceRoot);
}

export interface LiveCliDependencyOptions {
  readonly workspaceRoot?: string;
  readonly credentials?: ModelCredentialProvider;
  readonly transport?: ModelProviderTransport;
  readonly timeoutMs?: number;
  readonly sessionsDirectory?: string;
}

export function createLiveCliDependencies(options: LiveCliDependencyOptions = {}): RuntimeDependencies {
  const base = createDeterministicRuntimeDependencies();
  const platform = new NodePlatformRuntime();
  const modelOptions = {
    ...(options.credentials ? { credentials: options.credentials } : {}),
    ...(options.transport ? { transport: options.transport } : {}),
    timeoutMs: options.timeoutMs ?? 90_000
  };
  const sessionsDir = options.sessionsDirectory ?? userSessionsDirectory();
  const sessions = (() => {
    try {
      return new PersistentFilesystemSessionStore(sessionsDir);
    } catch (error) {
      console.warn(`deepseek: falling back to in-memory sessions because ${sessionsDir} could not be initialized:`, error instanceof Error ? error.message : String(error));
      return new InMemorySessionStore();
    }
  })();
  return {
    ...base,
    platform,
    workspaceState: new InMemoryWorkspaceStateManager(platform),
    codeIntelligence: new DeterministicCodeIntelligenceService(platform),
    models: new DeepSeekOpenAIProvider(modelOptions),
    sessions
  };
}
