import type {
  ContextProjectionResult,
  JsonObject,
  ModelChatMessage,
  PromptSection,
  PromptSectionBudgetClass,
  PromptSectionKind,
  PromptSectionSource,
  PromptSectionTrust
} from "@deepseek/platform-contracts";
import { PROMPT_ASSEMBLY_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export interface CreatePromptSectionInput {
  readonly id: string;
  readonly providerId: string;
  readonly kind: PromptSectionKind;
  readonly source: PromptSectionSource;
  readonly role: ModelChatMessage["role"];
  readonly content: string;
  readonly priority: number;
  readonly budgetClass: PromptSectionBudgetClass;
  readonly trust: PromptSectionTrust;
  readonly required: boolean;
  readonly provenance: JsonObject;
  readonly stale?: boolean;
}

export function createPromptSection(input: CreatePromptSectionInput): PromptSection {
  return {
    ...input,
    estimatedTokens: estimateTokens(input.content),
    evidenceFingerprint: stableHash(JSON.stringify({
      providerId: input.providerId,
      kind: input.kind,
      source: input.source,
      role: input.role,
      content: input.content,
      provenance: input.provenance
    })),
    redaction: { class: "internal", fields: ["content"] },
    compatibility: { schemaVersion: PROMPT_ASSEMBLY_SCHEMA_VERSION }
  };
}

export function projectionSections(
  projection: ContextProjectionResult | undefined,
  options: {
    readonly providerId: string;
    readonly kind: PromptSectionKind;
    readonly source: PromptSectionSource;
    readonly priority: number;
    readonly budgetClass: PromptSectionBudgetClass;
    readonly trust: PromptSectionTrust;
    readonly predicate: (node: ContextProjectionResult["selectedNodes"][number]) => boolean;
    readonly label: string;
  }
): readonly PromptSection[] {
  const nodes = projection?.selectedNodes.filter(options.predicate) ?? [];
  return nodes.map((node, index) => createPromptSection({
    id: `section.${options.providerId}.${index + 1}`,
    providerId: options.providerId,
    kind: options.kind,
    source: options.source,
    role: "system",
    content: [
      `${options.label}:`,
      recallLabelFor(node.source, node.provenance),
      `Source: ${String(node.provenance.path ?? node.provenance.pageId ?? node.provenance.memoryId ?? node.provenance.symbol ?? node.id)}`,
      node.content
    ].filter(Boolean).join("\n"),
    priority: options.priority,
    budgetClass: options.budgetClass,
    trust: options.trust,
    required: false,
    provenance: {
      nodeId: String(node.id),
      nodeKind: node.kind,
      nodeSource: node.source,
      projectionFingerprint: projection?.replayFingerprint ?? "",
      dependencyFingerprints: node.dependencyFingerprints
    },
    ...(node.provenance.freshnessStatus === "stale" ? { stale: true } : {})
  }));
}

export function contextMessageContent(projection: ContextProjectionResult | undefined): string | undefined {
  const referenceNodes = projection?.selectedNodes.filter((node) => {
    if (node.kind !== "file" && node.kind !== "summary" && node.kind !== "memory-ref" && node.kind !== "diagnostic") return false;
    return node.source === "host" || node.source === "memory" || node.source === "code-intelligence";
  }) ?? [];
  if (referenceNodes.length === 0) return undefined;
  return [
    "Projected runtime context:",
    ...referenceNodes.map((node, index) => [
      `[#${index + 1}] ${String(node.provenance.path ?? node.provenance.pageId ?? node.provenance.memoryId ?? node.provenance.symbol ?? node.id)}`,
      recallLabelFor(node.source, node.provenance),
      node.content
    ].filter(Boolean).join("\n"))
  ].join("\n\n");
}

export function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, trimmed.split(/\s+/).length);
}

function recallLabelFor(source: string, provenance: JsonObject): string | undefined {
  if (source === "memory") {
    const pageIndex = provenance.pageId || provenance.memoryId || provenance.scope;
    return pageIndex ? `Evidence type: exact historical recall (${String(pageIndex)})` : "Evidence type: exact historical recall";
  }
  if (source === "code-intelligence") return "Evidence type: workspace code intelligence";
  return undefined;
}
