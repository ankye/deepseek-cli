import type {
  AgentLoopToolProjection,
  CapabilityManifest,
  JsonObject,
  ModelChatMessage,
  PromptAssembler,
  PromptAssemblyInput,
  PromptAssemblyReplayReport,
  PromptAssemblyResult,
  PromptAssemblyReplayEvidence,
  PromptAssemblyStage,
  PromptBudgetReport,
  PromptSection,
  PromptSectionBudgetClass,
  PromptSectionExclusionReason,
  PromptSectionKind,
  PromptSectionSource,
  PromptSectionTrace,
  PromptSectionTrust,
  PromptToolPlan,
  RedactedError
} from "@deepseek/platform-contracts";
import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { defaultPromptSectionProviders } from "./providers.js";
import { stableHash } from "./sections.js";

export type PromptSectionProvider = (input: PromptAssemblyInput) => readonly PromptSection[] | Promise<readonly PromptSection[]>;

export interface PromptSectionProviderRegistration {
  readonly id: string;
  readonly version: string;
  readonly kind: PromptSectionKind;
  readonly source: PromptSectionSource;
  readonly priority: number;
  readonly budgetClass: PromptSectionBudgetClass;
  readonly trust: PromptSectionTrust;
  readonly required: boolean;
  readonly compatibility: import("@deepseek/platform-contracts").CompatibilityMetadata;
  readonly provide: PromptSectionProvider;
}

export interface PromptAssemblerOptions {
  readonly providers?: readonly PromptSectionProviderRegistration[];
  readonly packageVersion?: string;
  readonly previewChars?: number;
}

const DEFAULT_PACKAGE_VERSION = "0.1.0";
const DEFAULT_PREVIEW_CHARS = 160;
const STAGES: readonly PromptAssemblyStage[] = ["normalize", "collect-sections", "order-sections", "budget", "weave-messages", "project-tools", "trace"];
const EMPTY_REDACTION = { class: "internal" as const };

export function createDefaultPromptAssembler(options: PromptAssemblerOptions = {}): PromptAssembler {
  return new DefaultPromptAssembler(options);
}

export class DefaultPromptAssembler implements PromptAssembler {
  private readonly providers: readonly PromptSectionProviderRegistration[];
  private readonly packageVersion: string;
  private readonly previewChars: number;

  constructor(options: PromptAssemblerOptions = {}) {
    this.providers = options.providers ?? defaultPromptSectionProviders();
    this.packageVersion = options.packageVersion ?? DEFAULT_PACKAGE_VERSION;
    this.previewChars = options.previewChars ?? DEFAULT_PREVIEW_CHARS;
  }

  async assemble(input: PromptAssemblyInput): Promise<PromptAssemblyResult> {
    const diagnostics: RedactedError[] = [];
    const rawSections = await collectProviderSections(input, this.providers, diagnostics);
    const ordered = orderSections(rawSections);
    const budgeted = applyBudget(ordered, input, this.previewChars);
    const messages = weaveMessages(budgeted.included, input.history);
    const toolPlan = projectTools(input.availableTools, input.toolPolicy);
    const promptText = messages.map((message) => `${message.role}: ${message.content}`).join("\n");
    const registryFingerprint = stableHash(this.providers.map((provider) => providerFingerprint(provider)).join("|"));
    const replay = createReplayEvidence({
      input,
      packageVersion: this.packageVersion,
      registryFingerprint,
      included: budgeted.included,
      budget: budgeted.report,
      toolPlan,
      messages
    });
    const trace = {
      schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION,
      stageOrder: STAGES,
      providerIds: this.providers.map((provider) => provider.id),
      sections: [...budgeted.included.map((section) => sectionTrace(section, true, undefined, this.previewChars)), ...budgeted.report.exclusions],
      diagnostics,
      replay,
      redaction: { class: "internal", fields: ["sections.preview", "diagnostics.details"] },
      compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION }
    } as const;
    const fingerprint = stableHash(JSON.stringify({
      schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION,
      replay,
      promptText,
      sectionFingerprints: budgeted.included.map((section) => section.evidenceFingerprint)
    }));
    return {
      schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION,
      status: budgeted.report.status === "rejected" ? "rejected" : "assembled",
      messages,
      promptText,
      sections: trace.sections,
      toolPlan,
      budget: budgeted.report,
      trace,
      fingerprint,
      diagnostics,
      redaction: { class: "internal", fields: ["promptText", "messages.content", "sections.preview", "diagnostics.details"] },
      compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION }
    };
  }
}

export function replayPromptAssembly(
  captured: Pick<PromptAssemblyResult, "fingerprint" | "trace">,
  replayed: PromptAssemblyResult
): PromptAssemblyReplayReport {
  if (captured.fingerprint === replayed.fingerprint) {
    return {
      schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION,
      status: "matched",
      capturedFingerprint: captured.fingerprint,
      replayedFingerprint: replayed.fingerprint,
      redaction: EMPTY_REDACTION
    };
  }
  const firstDrift = firstReplayDrift(captured.trace.replay, replayed.trace.replay, captured.fingerprint, replayed.fingerprint);
  return {
    schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION,
    status: "drifted",
    capturedFingerprint: captured.fingerprint,
    replayedFingerprint: replayed.fingerprint,
    ...(firstDrift ? { firstDrift } : {}),
    redaction: EMPTY_REDACTION
  };
}


async function collectProviderSections(
  input: PromptAssemblyInput,
  providers: readonly PromptSectionProviderRegistration[],
  diagnostics: RedactedError[]
): Promise<readonly PromptSection[]> {
  const sections: PromptSection[] = [];
  for (const provider of providers) {
    try {
      const provided = await provider.provide(input);
      for (const section of provided) {
        if (section.providerId !== provider.id || !section.content) {
          diagnostics.push(providerDiagnostic(provider.id, "PROMPT_SECTION_INVALID", "Prompt section provider returned invalid section data"));
          continue;
        }
        sections.push(section);
      }
    } catch (error) {
      diagnostics.push(providerDiagnostic(provider.id, provider.required ? "PROMPT_REQUIRED_PROVIDER_FAILED" : "PROMPT_PROVIDER_FAILED", error instanceof Error ? error.message : "Prompt section provider failed"));
    }
  }
  return sections;
}

function orderSections(sections: readonly PromptSection[]): readonly PromptSection[] {
  return [...sections].sort((left, right) => {
    if (right.priority !== left.priority) return right.priority - left.priority;
    if (left.providerId !== right.providerId) return left.providerId.localeCompare(right.providerId);
    return left.id.localeCompare(right.id);
  });
}

function applyBudget(
  sections: readonly PromptSection[],
  input: PromptAssemblyInput,
  previewChars: number
): { readonly included: readonly PromptSection[]; readonly report: PromptBudgetReport } {
  const seen = new Set<string>();
  const included: PromptSection[] = [];
  const exclusions: PromptSectionTrace[] = [];
  let selectedTokens = 0;
  let excludedTokens = 0;
  const hardLimit = Math.max(1, input.budget.hardLimitTokens);
  const reservedOutputTokens = input.budget.reservedOutputTokens ?? 0;
  const effectiveLimit = Math.max(1, hardLimit - reservedOutputTokens);

  for (const section of sections) {
    if (seen.has(section.evidenceFingerprint)) {
      excludedTokens += section.estimatedTokens;
      exclusions.push(sectionTrace(section, false, "duplicate-fingerprint", previewChars));
      continue;
    }
    seen.add(section.evidenceFingerprint);

    if (selectedTokens + section.estimatedTokens > effectiveLimit && !section.required) {
      excludedTokens += section.estimatedTokens;
      exclusions.push(sectionTrace(section, false, "budget-exceeded", previewChars));
      continue;
    }

    included.push(section);
    selectedTokens += section.estimatedTokens;
  }

  const requiredDropped = exclusions.some((trace) => trace.required && trace.exclusionReason !== "duplicate-fingerprint");
  const status = requiredDropped ? "rejected" : exclusions.length > 0 ? "degraded" : "within-budget";
  return {
    included,
    report: {
      status,
      hardLimitTokens: hardLimit,
      ...(input.budget.softLimitTokens !== undefined ? { softLimitTokens: input.budget.softLimitTokens } : {}),
      reservedOutputTokens,
      selectedTokens,
      excludedTokens,
      includedSectionCount: included.length,
      excludedSectionCount: exclusions.length,
      exclusions,
      redaction: { class: "internal", fields: ["exclusions.preview"] }
    }
  };
}

function weaveMessages(sections: readonly PromptSection[], history: readonly ModelChatMessage[]): readonly ModelChatMessage[] {
  const messages: ModelChatMessage[] = [];
  for (const section of sections) {
    if (section.role === "user") continue;
    messages.push({ role: section.role, content: section.content });
  }
  messages.push(...history);
  return messages;
}

function projectTools(tools: readonly CapabilityManifest[], policy: AgentLoopToolProjection): PromptToolPlan {
  const visibleTools: JsonObject[] = [];
  const excludedTools: JsonObject[] = [];
  for (const tool of tools) {
    const schema = modelToolSchema(tool);
    if (isToolVisible(tool, policy)) {
      visibleTools.push(schema);
    } else {
      excludedTools.push({
        capabilityId: tool.id,
        sideEffect: tool.sideEffect,
        reason: "tool-policy-excluded"
      });
    }
  }
  return {
    policy,
    visibleToolCount: visibleTools.length,
    excludedToolCount: excludedTools.length,
    visibleTools,
    excludedTools,
    redaction: { class: "internal", fields: ["visibleTools.function.parameters", "excludedTools"] }
  };
}

function isToolVisible(tool: CapabilityManifest, policy: AgentLoopToolProjection): boolean {
  if (policy === "all") return true;
  if (policy === "read-write") return tool.sideEffect === "none" || tool.sideEffect === "read" || tool.sideEffect === "write";
  return tool.sideEffect === "none" || tool.sideEffect === "read";
}

function modelToolSchema(manifest: CapabilityManifest): JsonObject {
  const safeName = toSafeToolName(String(manifest.id));
  return {
    type: "function",
    function: {
      name: safeName,
      description: manifest.description ?? manifest.name,
      parameters: manifest.inputSchema
    },
    metadata: {
      capabilityId: manifest.id,
      version: manifest.version,
      sideEffect: manifest.sideEffect,
      permissions: manifest.permissions,
      timeoutMs: manifest.timeoutMs ?? 30_000,
      replayPolicy: manifest.replayPolicy ?? {}
    }
  };
}

function toSafeToolName(capabilityId: string): string {
  return /^[a-zA-Z0-9_-]+$/.test(capabilityId) ? capabilityId : capabilityId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function sectionTrace(
  section: PromptSection,
  included: boolean,
  exclusionReason: PromptSectionExclusionReason | undefined,
  previewChars: number
): PromptSectionTrace {
  return {
    id: section.id,
    providerId: section.providerId,
    kind: section.kind,
    source: section.source,
    priority: section.priority,
    budgetClass: section.budgetClass,
    trust: section.trust,
    required: section.required,
    estimatedTokens: section.estimatedTokens,
    evidenceFingerprint: section.evidenceFingerprint,
    included,
    ...(exclusionReason ? { exclusionReason } : {}),
    preview: preview(section.content, previewChars),
    redaction: { class: "internal", fields: ["preview"] },
    compatibility: section.compatibility
  };
}

function createReplayEvidence(input: {
  readonly input: PromptAssemblyInput;
  readonly packageVersion: string;
  readonly registryFingerprint: string;
  readonly included: readonly PromptSection[];
  readonly budget: PromptBudgetReport;
  readonly toolPlan: PromptToolPlan;
  readonly messages: readonly ModelChatMessage[];
}): PromptAssemblyReplayEvidence {
  return {
    schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION,
    packageVersion: input.packageVersion,
      inputFingerprint: stableHash(JSON.stringify({
        schemaVersion: input.input.schemaVersion,
        sessionId: input.input.sessionId,
        turnId: input.input.turnId,
        prompt: input.input.prompt,
        mode: input.input.mode,
        profile: input.input.profile,
        toolPolicy: input.input.toolPolicy,
        budget: input.input.budget,
        contextFingerprint: input.input.contextProjection?.replayFingerprint,
        evidenceFirst: input.input.evidenceFirst
          ? {
              summaryId: input.input.evidenceFirst.summary.summaryId,
              classificationId: input.input.evidenceFirst.classification.classificationId,
              evidenceFingerprints: input.input.evidenceFirst.selectedEvidence.map((item) => item.fingerprint)
            }
          : undefined
      })),
    registryFingerprint: input.registryFingerprint,
    sectionOrderFingerprint: stableHash(input.included.map((section) => `${section.id}:${section.evidenceFingerprint}`).join("|")),
    budgetFingerprint: stableHash(JSON.stringify({
      status: input.budget.status,
      selectedTokens: input.budget.selectedTokens,
      excludedTokens: input.budget.excludedTokens,
      exclusions: input.budget.exclusions.map((section) => `${section.id}:${section.exclusionReason}`)
    })),
    toolPlanFingerprint: stableHash(JSON.stringify({
      policy: input.toolPlan.policy,
      visibleToolCount: input.toolPlan.visibleToolCount,
      excludedToolCount: input.toolPlan.excludedToolCount,
      visibleTools: input.toolPlan.visibleTools.map((tool) => JSON.stringify(tool))
    })),
    messageRoles: input.messages.map((message) => message.role),
    redaction: EMPTY_REDACTION
  };
}

function firstReplayDrift(
  captured: PromptAssemblyReplayEvidence,
  replayed: PromptAssemblyReplayEvidence,
  capturedFingerprint: string,
  replayedFingerprint: string
): PromptAssemblyReplayReport["firstDrift"] {
  if (captured.packageVersion !== replayed.packageVersion) {
    return drift("provider-version", "Prompt assembly package version changed", { packageVersion: captured.packageVersion }, { packageVersion: replayed.packageVersion });
  }
  if (captured.registryFingerprint !== replayed.registryFingerprint) {
    return drift("provider-version", "Prompt section registry changed", { registryFingerprint: captured.registryFingerprint }, { registryFingerprint: replayed.registryFingerprint });
  }
  if (captured.sectionOrderFingerprint !== replayed.sectionOrderFingerprint) {
    return drift("section-fingerprint", "Prompt section order or evidence fingerprint changed", { sectionOrderFingerprint: captured.sectionOrderFingerprint }, { sectionOrderFingerprint: replayed.sectionOrderFingerprint });
  }
  if (captured.budgetFingerprint !== replayed.budgetFingerprint) {
    return drift("budget-estimate", "Prompt budget decisions changed", { budgetFingerprint: captured.budgetFingerprint }, { budgetFingerprint: replayed.budgetFingerprint });
  }
  if (captured.toolPlanFingerprint !== replayed.toolPlanFingerprint) {
    return drift("tool-projection", "Prompt tool projection changed", { toolPlanFingerprint: captured.toolPlanFingerprint }, { toolPlanFingerprint: replayed.toolPlanFingerprint });
  }
  return drift("fingerprint", "Prompt assembly fingerprint changed", { fingerprint: capturedFingerprint }, { fingerprint: replayedFingerprint });
}

function drift(kind: NonNullable<PromptAssemblyReplayReport["firstDrift"]>["kind"], message: string, captured: JsonObject, replayed: JsonObject): NonNullable<PromptAssemblyReplayReport["firstDrift"]> {
  return { kind, message, captured, replayed, redaction: EMPTY_REDACTION };
}

function providerFingerprint(provider: PromptSectionProviderRegistration): string {
  return JSON.stringify({
    id: provider.id,
    version: provider.version,
    kind: provider.kind,
    source: provider.source,
    priority: provider.priority,
    budgetClass: provider.budgetClass,
    trust: provider.trust,
    required: provider.required,
    compatibility: provider.compatibility
  });
}

function providerDiagnostic(providerId: string, code: string, message: string): RedactedError {
  return {
    code,
    message,
    retryable: false,
    details: { providerId },
    redaction: { class: "internal", fields: ["details"] }
  };
}

function preview(text: string, limit: number): string {
  const safe = redactSecretLikeText(text);
  return safe.length > limit ? safe.slice(0, limit) : safe;
}

function redactSecretLikeText(text: string): string {
  return text.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-REDACTED");
}
