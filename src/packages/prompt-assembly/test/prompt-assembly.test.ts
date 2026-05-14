import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { EvidenceFirstRuntimeContext, EvidenceItem, EvidenceSourceCoverage, EvidenceTaskClassification, JsonObject, PromptAssemblyInput, PromptSection } from "@deepseek/platform-contracts";
import { EVIDENCE_FIRST_COMPATIBILITY, EVIDENCE_FIRST_SCHEMA_VERSION, asId } from "@deepseek/platform-contracts";
import { createDefaultPromptAssembler, replayPromptAssembly, type PromptSectionProviderRegistration } from "../src/index.js";

describe("prompt assembly", () => {
  it("preserves the exact user prompt and prepends context as system evidence", async () => {
    const assembler = createDefaultPromptAssembler();
    const result = await assembler.assemble(input({
      prompt: "continue from recall",
      contextContent: "User chose sqlite for local cache"
    }));

    assert.equal(result.status, "assembled");
    assert.equal(result.messages[0]?.role, "system");
    assert.equal(result.messages[0]?.content.includes("Projected runtime context:"), true);
    assert.equal(result.messages.at(-1)?.role, "user");
    assert.equal(result.messages.at(-1)?.content, "continue from recall");
    assert.equal(result.promptText.includes("user: continue from recall"), true);
  });

  it("supports section providers without runtime changes", async () => {
    const provider = providerRegistration("custom.semantic", 750, "semantic recall evidence");
    const assembler = createDefaultPromptAssembler({ providers: [provider] });
    const result = await assembler.assemble(input({ prompt: "find similar context" }));

    assert.equal(result.messages[0]?.content, "semantic recall evidence");
    assert.equal(result.trace.providerIds.includes("custom.semantic"), true);
  });

  it("labels projected PageIndex, semantic, tool, skill, and code evidence separately", async () => {
    const assembler = createDefaultPromptAssembler();
    const result = await assembler.assemble(input({
      prompt: "continue with all evidence",
      projectionNodes: [
        projectionNode("pageindex-node", "memory-ref", "memory", "pageindex exact recall", { pageId: "page-1", scope: "session", freshnessStatus: "fresh" }),
        projectionNode("semantic-node", "summary", "memory", "zvec semantic recall", { providerId: "zvec", recallType: "semantic", similarity: 0.8 }),
        projectionNode("tool-node", "tool-result", "tool", "tool result continuity", { toolCallId: "call-1" }),
        projectionNode("skill-node", "summary", "skill-system", "skill context", { skillName: "frontend" }),
        projectionNode("code-node", "diagnostic", "code-intelligence", "code symbol context", { symbol: "render" })
      ]
    }));

    assert.equal(result.sections.some((section) => section.kind === "context.pageindex-recall" && section.included), true);
    assert.equal(result.sections.some((section) => section.kind === "context.semantic-recall" && section.included), true);
    assert.equal(result.sections.some((section) => section.kind === "context.tool-result" && section.included), true);
    assert.equal(result.sections.some((section) => section.kind === "context.skill" && section.included), true);
    assert.equal(result.sections.some((section) => section.kind === "context.code-intelligence" && section.included), true);
    assert.equal(result.messages.some((message) => message.content.includes("Semantic recall evidence")), true);
  });

  it("weaves evidence-first sections without mutating the exact user prompt", async () => {
    const assembler = createDefaultPromptAssembler();
    const result = await assembler.assemble(input({
      prompt: "生成 website 到 @website 目录",
      mode: "webpage-generation",
      evidenceFirst: evidenceFirstContext()
    }));

    assert.equal(result.status, "assembled");
    assert.equal(result.messages.at(-1)?.role, "user");
    assert.equal(result.messages.at(-1)?.content, "生成 website 到 @website 目录");
    assert.equal(result.messages.some((message) => message.role === "system" && message.content.includes("Evidence-first operating rules:")), true);
    assert.equal(result.messages.some((message) => message.role === "system" && message.content.includes("Selected local project evidence:")), true);
    assert.equal(result.messages.some((message) => message.role === "system" && message.content.includes("evidence.json")), true);
    assert.equal(result.messages.some((message) => message.role === "system" && message.content.includes("website/index.html")), true);
    assert.equal(result.messages.some((message) => message.role === "system" && message.content.includes("generated-webpage/index.html")), false);
  });

  it("records budget exclusions", async () => {
    const assembler = createDefaultPromptAssembler({
      providers: [
        providerRegistration("required", 100, "required text", true),
        providerRegistration("optional", 90, "one two three four five six seven eight nine ten")
      ]
    });
    const result = await assembler.assemble(input({ prompt: "budget", hardLimitTokens: 4 }));

    assert.equal(result.budget.status, "degraded");
    assert.equal(result.budget.excludedSectionCount, 1);
    assert.equal(result.budget.exclusions[0]?.exclusionReason, "budget-exceeded");
  });

  it("deduplicates repeated evidence fingerprints", async () => {
    const assembler = createDefaultPromptAssembler({
      providers: [
        providerRegistration("duplicate-a", 100, "same content"),
        providerRegistration("duplicate-b", 90, "same content")
      ]
    });
    const result = await assembler.assemble(input({ prompt: "dedupe" }));

    assert.equal(result.budget.includedSectionCount, 1);
    assert.equal(result.budget.exclusions[0]?.exclusionReason, "duplicate-fingerprint");
  });

  it("replays matching assembly and reports first drift", async () => {
    const assembler = createDefaultPromptAssembler();
    const first = await assembler.assemble(input({ prompt: "stable" }));
    const second = await assembler.assemble(input({ prompt: "stable" }));
    const third = await assembler.assemble(input({ prompt: "changed" }));

    assert.equal(replayPromptAssembly(first, second).status, "matched");
    const drift = replayPromptAssembly(first, third);
    assert.equal(drift.status, "drifted");
    assert.ok(drift.firstDrift);
  });
});

function providerRegistration(id: string, priority: number, content: string, required = false): PromptSectionProviderRegistration {
  return {
    id,
    version: "1.0.0",
    kind: "context.semantic-recall",
    source: "zvec",
    priority,
    budgetClass: required ? "required" : "optional",
    trust: "semantic",
    required,
    compatibility: { schemaVersion: "1.0.0" },
    provide() {
      const section: PromptSection = {
        id: `section.${id}`,
        providerId: id,
        kind: "context.semantic-recall",
        source: "zvec",
        role: "system",
        content,
        priority,
        budgetClass: required ? "required" : "optional",
        trust: "semantic",
        required,
        estimatedTokens: content.split(/\s+/).length,
        evidenceFingerprint: content,
        provenance: {},
        redaction: { class: "internal", fields: ["content"] },
        compatibility: { schemaVersion: "1.0.0" }
      };
      return [section];
    }
  };
}

function input(options: {
  readonly prompt: string;
  readonly contextContent?: string;
  readonly projectionNodes?: readonly NonNullable<PromptAssemblyInput["contextProjection"]>["selectedNodes"][number][];
  readonly hardLimitTokens?: number;
  readonly mode?: PromptAssemblyInput["mode"];
  readonly evidenceFirst?: EvidenceFirstRuntimeContext;
}): PromptAssemblyInput {
  const selectedNodes = options.projectionNodes ?? (options.contextContent ? [
    projectionNode("context-node-1", "memory-ref", "memory", options.contextContent, { memoryId: "memory-1", scope: "session" })
  ] : []);
  return {
    schemaVersion: "1.0.0",
    sessionId: asId<"session">("session-prompt-assembly"),
    turnId: asId<"turn">("turn-prompt-assembly"),
    prompt: options.prompt,
    mode: options.mode ?? "coding",
    caller: "test",
    workspaceRoot: "/workspace",
    profile: {
      id: asId<"modelProfile">("profile-test"),
      providerId: asId<"modelProvider">("provider-test"),
      model: "test-model"
    },
    trace: {
      traceId: asId<"trace">("trace-prompt-assembly"),
      spanId: asId<"span">("span-prompt-assembly"),
      correlationId: asId<"correlation">("corr-prompt-assembly")
    },
    history: [{ role: "user", content: options.prompt }],
    ...(options.evidenceFirst ? { evidenceFirst: options.evidenceFirst } : {}),
    ...(selectedNodes.length > 0 ? {
      contextProjection: {
        schemaVersion: "1.0.0",
        status: "completed",
        sessionId: asId<"session">("session-prompt-assembly"),
        prompt: options.prompt,
        selectedNodes,
        excludedNodes: [],
        estimatedTokens: selectedNodes.reduce((sum, node) => sum + node.estimatedTokens, 0),
        budget: {
          status: "allowed",
          hardLimitTokens: 128,
          reservedOutputTokens: 0,
          selectedTokens: selectedNodes.reduce((sum, node) => sum + node.estimatedTokens, 0),
          excludedTokens: 0,
          reason: "within-budget"
        },
        redaction: { selected: 1, redacted: 0, excluded: 0, classes: ["internal"], secretLikeBlocked: 0 },
        cache: { namespace: "test", key: "test", hit: false, dependencyFingerprints: selectedNodes.flatMap((node) => node.dependencyFingerprints) },
        ordering: { strategy: "priority-recency-stable", tieBreak: ["priority"] },
        replayFingerprint: "projection-1"
      }
    } : {}),
    availableTools: [],
    toolPolicy: "all",
    budget: { hardLimitTokens: options.hardLimitTokens ?? 1024, reservedOutputTokens: 0 },
    compatibility: { schemaVersion: "1.0.0" }
  };
}

function evidenceFirstContext(): EvidenceFirstRuntimeContext {
  const classification: EvidenceTaskClassification = {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    classificationId: "evidence-classification:test",
    sensitivity: "fact-sensitive" as const,
    intents: ["product", "generated-artifact"] as const,
    factClasses: ["package", "command", "product-copy"] as const,
    evidenceRequired: true,
    reason: "test",
    trace: {},
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal" as const, fields: ["reason"] }
  };
  const plan: NonNullable<EvidenceFirstRuntimeContext["plan"]> = {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    planId: "evidence-plan:test",
    classificationId: classification.classificationId,
    requiredFactClasses: classification.factClasses,
    candidateSourceGroups: [{
      sourceGroup: "package-metadata" as const,
      required: true,
      factClasses: ["package", "executable"] as const,
      minimumItemCount: 1
    }],
    minimumSourceCoverage: 1,
    freshnessPolicy: "local-current-worktree",
    redactionPolicy: "bounded-previews-and-fingerprints",
    stopConditions: ["unsupported strict command"],
    trace: {},
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal" as const, fields: ["stopConditions"] }
  };
  const evidenceItem: EvidenceItem = {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    evidenceId: "evidence:package-json",
    sourceGroup: "package-metadata" as const,
    sourcePath: "src/apps/cli/package.json",
    sourceLabel: "CLI package metadata",
    factClasses: ["package", "executable"] as const,
    preview: "name deepseek-agent-cli, bin deepseek",
    fingerprint: "fnv1a:test",
    freshness: { status: "current" as const },
    trace: {},
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal" as const, fields: ["preview"] }
  };
  const coverage: EvidenceSourceCoverage = {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    sourceGroup: "package-metadata" as const,
    covered: true,
    itemCount: 1,
    factClasses: ["package", "executable"] as const,
    fingerprints: ["fnv1a:test"],
    missingFactClasses: [],
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal" as const, fields: ["fingerprints"] }
  };
  return {
    schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
    classification,
    plan,
    selectedEvidence: [evidenceItem],
    sourceCoverage: [coverage],
    summary: {
      schemaVersion: EVIDENCE_FIRST_SCHEMA_VERSION,
      summaryId: "evidence-summary:test",
      classification,
      plan,
      manifestStatus: "missing",
      evidenceItemCount: 1,
      sourceCoverageRate: 1,
      claimGroundingRate: 0,
      unsupportedClaimCount: 0,
      assumptionCount: 0,
      hallucinatedCommandCount: 0,
      trace: {},
      compatibility: EVIDENCE_FIRST_COMPATIBILITY,
      redaction: { class: "internal", fields: ["classification.reason"] }
    },
    compatibility: EVIDENCE_FIRST_COMPATIBILITY,
    redaction: { class: "internal", fields: ["selectedEvidence.preview"] }
  };
}

function projectionNode(
  id: string,
  kind: NonNullable<PromptAssemblyInput["contextProjection"]>["selectedNodes"][number]["kind"],
  source: NonNullable<PromptAssemblyInput["contextProjection"]>["selectedNodes"][number]["source"],
  content: string,
  provenance: JsonObject
): NonNullable<PromptAssemblyInput["contextProjection"]>["selectedNodes"][number] {
  return {
    id: asId<"contextNode">(id),
    kind,
    source,
    content,
    estimatedTokens: Math.max(1, content.split(/\s+/).length),
    priority: 10,
    redaction: { class: "internal" },
    provenance,
    dependencyFingerprints: [id]
  };
}
