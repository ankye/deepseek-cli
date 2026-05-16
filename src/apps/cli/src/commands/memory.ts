import type { JsonObject, MemoryId, MemoryScope, PermanentMemoryManager } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import type { CliOptions, CliRunOptions } from "../types.js";
import { resolveSessionDependencies } from "../host/runtime.js";

type PermanentScope = Exclude<MemoryScope, "working" | "session">;

export async function runMemoryCommand(options: CliOptions, write: (line: string) => Promise<void>, runOptions: CliRunOptions): Promise<void> {
  const deps = await resolveSessionDependencies(runOptions);
  const memory = permanentMemoryManager(deps.memory);
  if (!memory) {
    const result = { ok: false, status: "unavailable", message: "Permanent memory provider is not configured." };
    await write(options.output === "text" ? `memory: ${result.status} - ${result.message}` : JSON.stringify(result));
    return;
  }
  const action = options.memoryAction ?? "status";
  const input = options.memoryInput ?? {};
  const result = await executeMemoryAction(memory, action, input);
  if (options.output !== "text") {
    await write(JSON.stringify(result));
    return;
  }
  for (const line of renderMemoryText(action, result)) await write(line);
}

async function executeMemoryAction(memory: PermanentMemoryManager, action: NonNullable<CliOptions["memoryAction"]>, input: JsonObject): Promise<JsonObject> {
  if (action === "status") {
    const settings = await memory.settings();
    const audit = await memory.audit(20);
    return { ok: true, action, manifest: memory.manifest(), settings, auditCount: audit.length };
  }
  if (action === "enable" || action === "disable") {
    return { ok: true, action, settings: await memory.configure({ enabled: action === "enable" }) };
  }
  if (action === "list" || action === "candidates") {
    const scope = permanentScope(input.scope);
    const query = stringInput(input.query);
    const entries = await memory.queryPermanent({
      ...(scope ? { scope } : {}),
      ...(query ? { query } : {}),
      includeCandidates: action === "candidates" || input.includeCandidates === true,
      includeDismissed: input.includeDismissed === true,
      includeStale: true,
      includeConflicted: true
    });
    return { ok: true, action, count: entries.length, entries };
  }
  if (action === "remember") {
    const content = requiredString(input.content, "content");
    const scope = permanentScope(input.scope) ?? "project";
    return await memory.putCandidate({
      scope,
      content,
      tags: stringArray(input.tags),
      promotionMode: "manual",
      candidateKind: scope === "user" ? "preference" : "fact",
      provenance: { source: "cli.memory.remember" },
      sourceEvidence: [{
        sourceKind: "user-explicit",
        sourceId: "cli.memory.remember",
        sourceHash: hash(content),
        redaction: { class: "internal" }
      }]
    }) as unknown as JsonObject;
  }
  if (action === "approve") {
    return await memory.promote(memoryId(input), { approved: true, actor: "cli", reason: stringInput(input.reason) ?? "cli approval", tags: stringArray(input.tags) }) as unknown as JsonObject;
  }
  if (action === "reject") {
    return await memory.dismiss(memoryId(input), stringInput(input.reason) ?? "cli rejected") as unknown as JsonObject;
  }
  if (action === "edit") {
    return await memory.update(memoryId(input), {
      ...(typeof input.content === "string" ? { content: input.content } : {}),
      ...(Array.isArray(input.tags) ? { tags: stringArray(input.tags) } : {}),
      governance: { reason: stringInput(input.reason) ?? "cli edit" }
    }) as unknown as JsonObject;
  }
  if (action === "delete") {
    return await memory.delete(memoryId(input), stringInput(input.reason) ?? "cli forget requested") as unknown as JsonObject;
  }
  if (action === "explain") {
    return await memory.explain(memoryId(input)) as unknown as JsonObject;
  }
  if (action === "export") {
    return await memory.export() as unknown as JsonObject;
  }
  return { ok: false, action, status: "unsupported" };
}

function renderMemoryText(action: string, result: JsonObject): readonly string[] {
  if (action === "status") {
    const settings = result.settings as { readonly enabled?: boolean; readonly providerId?: string } | undefined;
    const manifest = result.manifest as { readonly providerId?: string; readonly durability?: string; readonly locality?: string } | undefined;
    return [
      `memory: ${settings?.enabled === false ? "disabled" : "enabled"}`,
      `- provider: ${manifest?.providerId ?? settings?.providerId ?? "unknown"}`,
      `- durability: ${manifest?.durability ?? "unknown"} ${manifest?.locality ?? ""}`.trim(),
      `- audit records: ${String(result.auditCount ?? 0)}`
    ];
  }
  if (Array.isArray(result.entries)) {
    const entries = result.entries as readonly { readonly id?: string; readonly state?: string; readonly scope?: string; readonly content?: string }[];
    return [`memory ${action}: ${entries.length}`, ...entries.map((entry) => `- ${entry.id ?? ""} [${entry.state ?? ""}/${entry.scope ?? ""}] ${entry.content ?? ""}`)];
  }
  return [`memory ${action}: ${String(result.status ?? (result.ok === false ? "failed" : "ok"))}`];
}

function permanentMemoryManager(memory: unknown): PermanentMemoryManager | undefined {
  const candidate = memory as Partial<PermanentMemoryManager>;
  return typeof candidate.queryPermanent === "function" && typeof candidate.putCandidate === "function" && typeof candidate.settings === "function"
    ? candidate as PermanentMemoryManager
    : undefined;
}

function permanentScope(value: unknown): PermanentScope | undefined {
  if (value === "project" || value === "user" || value === "semantic" || value === "skill") return value;
  return undefined;
}

function memoryId(input: JsonObject): MemoryId {
  return asId<"memory">(requiredString(input.id, "id"));
}

function requiredString(value: unknown, name: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(`memory ${name} is required.`);
}

function stringInput(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
}

function hash(value: string): string {
  let hashValue = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hashValue ^= value.charCodeAt(index);
    hashValue = Math.imul(hashValue, 16777619);
  }
  return `h${(hashValue >>> 0).toString(16)}`;
}
