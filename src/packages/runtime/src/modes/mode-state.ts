import type {
  AgentModeBinding,
  AgentModeName,
  AgentPhasePlan,
  AgentReasoningEffortMapping,
  AgentModeSessionSummary,
  InteractionModeName,
  InteractionModeState,
  InteractionModeTransition,
  ModelReasoningEffort,
  ModelReasoningProviderEffort,
  RuntimeDependencies,
  SessionId,
  TraceContext,
  TurnId
} from "@deepseek/platform-contracts";
import {
  AGENT_MODE_COMPATIBILITY,
  AGENT_MODE_SCHEMA_VERSION,
  INTERACTION_MODE_COMPATIBILITY,
  INTERACTION_MODE_SCHEMA_VERSION
} from "@deepseek/platform-contracts";

export function createInteractionModeState(input: {
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly mode: InteractionModeName;
  readonly trace: TraceContext;
}): InteractionModeState {
  return {
    schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
    sessionId: input.sessionId,
    turnId: input.turnId,
    mode: input.mode,
    degraded: false,
    degradationReasons: [],
    availableTransitions: ["chat", "headless", "one-shot", "result-list", "approval"],
    diagnostics: [],
    trace: input.trace,
    redaction: { class: "internal" },
    compatibility: INTERACTION_MODE_COMPATIBILITY
  };
}

export function createInteractionModeTransition(input: {
  readonly sessionId: SessionId;
  readonly turnId: TurnId;
  readonly nextMode: InteractionModeName;
  readonly trace: TraceContext;
}): InteractionModeTransition {
  return {
    schemaVersion: INTERACTION_MODE_SCHEMA_VERSION,
    transitionId: `interaction-transition:${input.sessionId}:${input.turnId}`,
    sessionId: input.sessionId,
    turnId: input.turnId,
    previousMode: input.nextMode,
    nextMode: input.nextMode,
    reason: "runtime-phase",
    initiator: "runtime",
    at: new Date(0).toISOString(),
    trace: input.trace,
    diagnostics: [],
    redaction: { class: "internal" },
    compatibility: INTERACTION_MODE_COMPATIBILITY
  };
}

export async function createAgentModeBinding(input: {
  readonly deps: RuntimeDependencies;
  readonly sessionId: SessionId;
  readonly mode: AgentModeName;
  readonly interactionMode: InteractionModeName;
}): Promise<AgentModeBinding> {
  const definition = await input.deps.agents.getDefault();
  const scopes = await input.deps.agents.projectScopes(definition.id, definition.supportedAgentModes.includes(input.mode) ? input.mode : definition.defaultAgentMode);
  const productRole = productRoleFor(input.mode);
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    agentId: definition.id,
    mode: input.mode,
    productRole,
    interactionMode: input.interactionMode,
    scopeIds: [
      ...scopes.capabilities.map((scope) => `capability:${scope}`),
      ...scopes.context.map((scope) => `context:${scope}`),
      ...scopes.policy.map((scope) => `policy:${scope}`)
    ],
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

export function mapReasoningEffort(input: {
  readonly requested?: ModelReasoningEffort;
  readonly providerEffort?: ModelReasoningProviderEffort;
  readonly provider: string;
  readonly model: string;
}): AgentReasoningEffortMapping {
  const providerEffort = input.providerEffort ?? providerEffortFor(input.requested, input.provider, input.model);
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    ...(input.requested ? { requestedEffort: input.requested } : {}),
    ...(providerEffort ? { providerEffort } : {}),
    provider: input.provider,
    model: input.model,
    mapped: input.requested !== undefined,
    supported: true,
    reason: input.requested ? "Runtime mapped user-facing reasoning effort to provider effort." : "No reasoning effort requested.",
    diagnostics: [],
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

export function summarizeModePlan(input: {
  readonly phasePlan: AgentPhasePlan;
  readonly reasoningEffortMapping?: AgentReasoningEffortMapping;
}): AgentModeSessionSummary {
  return {
    schemaVersion: AGENT_MODE_SCHEMA_VERSION,
    interactionMode: input.phasePlan.interactionMode,
    agentMode: input.phasePlan.agentMode,
    phasePlanId: input.phasePlan.planId,
    phaseStatuses: input.phasePlan.phases,
    budgets: input.phasePlan.budgets,
    delegationDecisions: [],
    workerResults: [],
    verifierResults: [],
    ...(input.reasoningEffortMapping ? { reasoningEffort: input.reasoningEffortMapping } : {}),
    redaction: { class: "internal" },
    compatibility: AGENT_MODE_COMPATIBILITY
  };
}

function providerEffortFor(effort: ModelReasoningEffort | undefined, provider: string, model: string): ModelReasoningProviderEffort | undefined {
  if (isDeepSeek(provider, model)) {
    switch (effort) {
      case "low":
      case "medium":
      case "high":
        return "high";
      case "xhigh":
        return "max";
      case undefined:
        return undefined;
    }
  }
  switch (effort) {
    case "low":
      return "low";
    case "medium":
      return "medium";
    case "high":
      return "high";
    case "xhigh":
      return "max";
    case undefined:
      return undefined;
  }
}

function isDeepSeek(provider: string, model: string): boolean {
  return provider.toLowerCase().includes("deepseek") || model.toLowerCase().startsWith("deepseek-");
}

function productRoleFor(mode: AgentModeName): AgentModeBinding["productRole"] {
  switch (mode) {
    case "evidence":
      return "evidence-researcher";
    case "planner":
      return "planner";
    case "implementer":
      return "implementer";
    case "verifier":
      return "verifier";
    case "coordinator":
      return "coordinator";
    case "worker":
      return "worker";
    case "repair":
      return "repairer";
    case "synthesis":
      return "synthesizer";
    case "default":
      return "default-coding-agent";
  }
}
