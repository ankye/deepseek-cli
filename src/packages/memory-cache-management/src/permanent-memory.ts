import type {
  JsonObject,
  MemoryEntry,
  MemoryId,
  MemoryScope,
  PermanentMemoryAuditRecord,
  PermanentMemoryCandidateInput,
  PermanentMemoryConflict,
  PermanentMemoryEntry,
  PermanentMemoryExportBundle,
  PermanentMemoryFreshness,
  PermanentMemoryHook,
  PermanentMemoryHookEvent,
  PermanentMemoryHookResult,
  PermanentMemoryImportResult,
  PermanentMemoryMutationResult,
  PermanentMemoryProvider,
  PermanentMemoryProviderManifest,
  PermanentMemoryPromotionDecision,
  PermanentMemoryQuery,
  PermanentMemorySettings,
  PermanentMemorySourceEvidence,
  PermanentMemoryUpdatePatch,
  PlatformRuntime,
  SessionId
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

const PERMANENT_MEMORY_SCHEMA_VERSION = "1.0.0";
const DEFAULT_HOOK_TIMEOUT_MS = 2_000;

export interface PermanentMemoryStoreSnapshot extends JsonObject {
  readonly schemaVersion?: "1.0.0";
  readonly settings: PermanentMemorySettings;
  readonly entries: readonly PermanentMemoryEntry[];
  readonly audit?: readonly PermanentMemoryAuditRecord[];
}

export interface PermanentMemoryStorageAdapter {
  read(): Promise<PermanentMemoryStoreSnapshot | undefined>;
  write(snapshot: PermanentMemoryStoreSnapshot): Promise<void>;
}

export class InMemoryPermanentMemoryStorageAdapter implements PermanentMemoryStorageAdapter {
  private snapshot: PermanentMemoryStoreSnapshot | undefined;

  async read(): Promise<PermanentMemoryStoreSnapshot | undefined> {
    return this.snapshot ? clonePermanentMemorySnapshot(this.snapshot) : undefined;
  }

  async write(snapshot: PermanentMemoryStoreSnapshot): Promise<void> {
    this.snapshot = clonePermanentMemorySnapshot(snapshot);
  }
}

export class FilesystemPermanentMemoryStorageAdapter implements PermanentMemoryStorageAdapter {
  constructor(private readonly platform: Pick<PlatformRuntime, "readFile" | "atomicWriteFile">, private readonly path: string) {}

  async read(): Promise<PermanentMemoryStoreSnapshot | undefined> {
    try {
      const raw = await this.platform.readFile(this.path);
      const parsed = JSON.parse(raw) as unknown;
      return isPermanentMemorySnapshot(parsed) ? parsed : undefined;
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as { readonly code?: string }).code === "ENOENT") return undefined;
      if (error instanceof Error && /not found|enoent/i.test(error.message)) return undefined;
      throw error;
    }
  }

  async write(snapshot: PermanentMemoryStoreSnapshot): Promise<void> {
    const result = await this.platform.atomicWriteFile(this.path, `${JSON.stringify(snapshot, null, 2)}\n`);
    if (!result.ok) throw new Error(result.error?.message ?? "Permanent memory write failed.");
  }
}

export interface DurablePermanentMemoryProviderOptions {
  readonly adapter?: PermanentMemoryStorageAdapter;
  readonly providerId?: string;
  readonly requirePromotionApproval?: boolean;
  readonly maxQueryResults?: number;
  readonly enabled?: boolean;
  readonly hooks?: readonly PermanentMemoryHook[];
  readonly now?: () => Date;
}

export class DurablePermanentMemoryProvider implements PermanentMemoryProvider {
  private readonly adapter: PermanentMemoryStorageAdapter;
  private readonly providerId: string;
  private readonly hooks: readonly PermanentMemoryHook[];
  private readonly now: () => Date;
  private readonly defaultSettings: PermanentMemorySettings;

  constructor(options: DurablePermanentMemoryProviderOptions = {}) {
    this.adapter = options.adapter ?? new InMemoryPermanentMemoryStorageAdapter();
    this.providerId = options.providerId ?? "permanent-memory.local-json";
    this.hooks = options.hooks ?? [];
    this.now = options.now ?? (() => new Date());
    this.defaultSettings = {
      enabled: options.enabled ?? true,
      providerId: this.providerId,
      requirePromotionApproval: options.requirePromotionApproval ?? true,
      maxQueryResults: options.maxQueryResults ?? 50,
      readEnabled: true,
      generateEnabled: true,
      injectEnabled: true,
      autoPromoteEnabled: options.requirePromotionApproval === false,
      backgroundExtractionEnabled: true,
      minimumCandidateChars: 24,
      maxCandidatesPerTurn: 3,
      extractionLockId: "permanent-memory.cli-background-extraction",
      excludedSourceKinds: ["mcp", "web", "connector", "browser-screen", "third-party-document"]
    };
  }

  manifest(): PermanentMemoryProviderManifest {
    return {
      providerId: this.providerId,
      durability: "local-json",
      locality: "local",
      scopes: ["project", "user", "semantic", "skill"],
      encryption: "host",
      provenance: true,
      deleteSemantics: "soft-delete",
      exportImport: true,
      migrations: true,
      hookSupport: true,
      redaction: { class: "internal" }
    };
  }

  async settings(): Promise<PermanentMemorySettings> {
    return (await this.snapshot()).settings;
  }

  async setEnabled(enabled: boolean): Promise<PermanentMemorySettings> {
    return this.configure({ enabled });
  }

  async configure(settingsPatch: Partial<PermanentMemorySettings>): Promise<PermanentMemorySettings> {
    const snapshot = await this.snapshot();
    const settings = {
      ...snapshot.settings,
      ...definedSettings(settingsPatch),
      providerId: snapshot.settings.providerId
    };
    await this.adapter.write(withAudit({ ...snapshot, settings }, this.auditRecord("settings.updated", "completed")));
    await this.emit({ kind: "permanent-memory.settings.updated", providerId: settings.providerId, settings });
    return settings;
  }

  async put(entry: MemoryEntry, sessionId?: SessionId): Promise<void> {
    const snapshot = await this.snapshot();
    if (!snapshot.settings.enabled) return;
    const now = this.now().toISOString();
    const permanent: PermanentMemoryEntry = {
      ...entry,
      content: redactMemoryContent(entry.content),
      state: "promoted",
      createdAt: now,
      updatedAt: now,
      ...(sessionId ? { sourceSessionId: sessionId } : {}),
      tags: [],
      candidateKind: "fact",
      ...(entry.scope === "working" || entry.scope === "session" ? {} : { scopeSelector: { scope: entry.scope } }),
      sourceEvidence: [{
        sourceKind: "runtime-event",
        sourceId: String(entry.provenance.source ?? "MemoryManager.put"),
        sourceHash: stableHash(entry.content),
        redaction: { class: "internal" }
      }],
      freshness: freshMemory([], now),
      conflict: noConflict(),
      governance: {
        promotionMode: "manual",
        approvalRequired: false,
        approved: true,
        reason: "MemoryManager.put compatibility"
      }
    };
    await this.adapter.write(withAudit(
      { ...snapshot, entries: upsertPermanentMemory(snapshot.entries, permanent) },
      this.auditRecord("compat.put.promoted", "completed", permanent.id)
    ));
  }

  async query(scope: MemoryScope, sessionId?: SessionId): Promise<readonly MemoryEntry[]> {
    const permanentScope = scope === "working" || scope === "session" ? undefined : scope;
    const entries = await this.queryPermanent({
      ...(permanentScope ? { scope: permanentScope } : {}),
      includeCandidates: false
    });
    return entries
      .filter((entry) => entry.scope === scope && (scope !== "session" || sessionId === undefined || entry.sourceSessionId === undefined || entry.sourceSessionId === sessionId))
      .map((entry) => memoryEntryFromPermanent(entry));
  }

  async putCandidate(input: PermanentMemoryCandidateInput): Promise<PermanentMemoryMutationResult> {
    const snapshot = await this.snapshot();
    if (!snapshot.settings.enabled) return permanentMutation(false, "disabled", undefined, ["permanent-memory.disabled"]);
    if (snapshot.settings.generateEnabled === false) return permanentMutation(false, "disabled", undefined, ["permanent-memory.generation-disabled"]);

    const now = this.now().toISOString();
    const candidateKind: NonNullable<PermanentMemoryEntry["candidateKind"]> = input.candidateKind ?? inferCandidateKind(input.content);
    const routeDiagnostics = workflowRouteDiagnostics(input, candidateKind);
    const sourceDiagnostics = sourcePolicyDiagnostics(input.sourceEvidence, snapshot.settings);
    const diagnostics = [...routeDiagnostics, ...sourceDiagnostics];
    const routedAway = diagnostics.length > 0;
    const approved = !routedAway && !snapshot.settings.requirePromotionApproval && snapshot.settings.autoPromoteEnabled !== false && input.promotionMode === "auto";
    const entry: PermanentMemoryEntry = {
      id: asId<"memory">(`permanent-memory:${stableHash(JSON.stringify({
        scope: input.scope,
        content: input.content,
        sessionId: input.sessionId ?? "",
        tags: input.tags ?? []
      }))}`),
      scope: input.scope,
      content: redactMemoryContent(input.content),
      provenance: {
        source: "permanent-memory.candidate",
        contentHash: stableHash(input.content),
        ...(input.provenance ?? {})
      },
      redaction: memoryRedactionFor(input.content),
      ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
      state: approved ? "promoted" : routedAway ? "dismissed" : "candidate",
      createdAt: now,
      updatedAt: now,
      ...(input.sessionId ? { sourceSessionId: input.sessionId } : {}),
      tags: [...(input.tags ?? [])].sort(),
      candidateKind,
      scopeSelector: input.scopeSelector ?? { scope: input.scope },
      sourceEvidence: input.sourceEvidence ?? explicitSourceEvidence(input),
      freshness: freshMemory((input.sourceEvidence ?? []).map((source) => source.sourceId), now),
      conflict: noConflict(),
      ...(input.procedure ?? candidateKind === "workflow-procedure"
        ? { procedure: input.procedure ?? { routeTo: "skill", reason: "repeatable workflow candidate" } }
        : {}),
      governance: {
        promotionMode: input.promotionMode ?? "manual",
        approvalRequired: snapshot.settings.requirePromotionApproval,
        approved,
        reason: routedAway ? diagnostics.join("; ") : "candidate captured"
      }
    };
    await this.adapter.write(withAudit(
      { ...snapshot, entries: upsertPermanentMemory(snapshot.entries, entry) },
      this.auditRecord(routedAway ? "candidate.routed" : "candidate.created", routedAway ? "rejected" : "completed", entry.id, diagnostics)
    ));
    const hookResults = await this.emit({ kind: "permanent-memory.candidate.created", providerId: snapshot.settings.providerId, entry });
    const enriched = mergeHookPatches(hookResults);
    if (enriched) {
      const updated = await this.update(entry.id, enriched);
      if (updated.entry) {
        await this.emit({ kind: "permanent-memory.candidate.enriched", providerId: snapshot.settings.providerId, entry: updated.entry });
        return permanentMutation(!routedAway, routedAway ? "rejected" : "completed", updated.entry, diagnostics);
      }
    }
    return permanentMutation(!routedAway, routedAway ? "rejected" : "completed", entry, diagnostics);
  }

  async promote(id: MemoryId, decision: PermanentMemoryPromotionDecision): Promise<PermanentMemoryMutationResult> {
    const snapshot = await this.snapshot();
    if (!snapshot.settings.enabled) return permanentMutation(false, "disabled", undefined, ["permanent-memory.disabled"]);
    const entry = snapshot.entries.find((item) => item.id === id && item.state !== "deleted");
    if (!entry) return permanentMutation(false, "not-found", undefined, ["permanent-memory.not-found"]);
    if (!decision.approved) return permanentMutation(false, "rejected", entry, ["permanent-memory.promotion-not-approved"]);
    if (entry.procedure && entry.procedure.routeTo !== "memory") return permanentMutation(false, "rejected", entry, [`permanent-memory.routed-to-${entry.procedure.routeTo}`]);

    const promoted: PermanentMemoryEntry = {
      ...entry,
      state: "promoted",
      updatedAt: this.now().toISOString(),
      ...(decision.confidence !== undefined ? { confidence: decision.confidence } : {}),
      tags: [...new Set([...entry.tags, ...(decision.tags ?? [])])].sort(),
      governance: {
        ...entry.governance,
        approved: true,
        ...(decision.actor ? { actor: decision.actor } : {}),
        ...(decision.reason ? { reason: decision.reason } : { reason: "approved" }),
        reviewedAt: this.now().toISOString()
      }
    };
    await this.adapter.write(withAudit(
      { ...snapshot, entries: upsertPermanentMemory(snapshot.entries, promoted) },
      this.auditRecord("candidate.promoted", "completed", promoted.id)
    ));
    await this.emit({ kind: "permanent-memory.candidate.promoted", providerId: snapshot.settings.providerId, entry: promoted });
    return permanentMutation(true, "completed", promoted, []);
  }

  async dismiss(id: MemoryId, reason = "dismissed"): Promise<PermanentMemoryMutationResult> {
    return this.transition(id, "dismissed", reason, "permanent-memory.candidate.dismissed");
  }

  async delete(id: MemoryId, reason = "deleted"): Promise<PermanentMemoryMutationResult> {
    return this.transition(id, "deleted", reason, "permanent-memory.entry.deleted");
  }

  async update(id: MemoryId, patch: PermanentMemoryUpdatePatch): Promise<PermanentMemoryMutationResult> {
    const snapshot = await this.snapshot();
    if (!snapshot.settings.enabled) return permanentMutation(false, "disabled", undefined, ["permanent-memory.disabled"]);
    const entry = snapshot.entries.find((item) => item.id === id && item.state !== "deleted");
    if (!entry) return permanentMutation(false, "not-found", undefined, ["permanent-memory.not-found"]);
    const updated: PermanentMemoryEntry = {
      ...entry,
      ...(patch.content !== undefined ? { content: redactMemoryContent(patch.content), redaction: memoryRedactionFor(patch.content) } : {}),
      ...(patch.confidence !== undefined ? { confidence: patch.confidence } : {}),
      ...(patch.tags ? { tags: [...new Set(patch.tags)].sort() } : {}),
      ...(patch.freshness ? { freshness: patch.freshness } : {}),
      ...(patch.conflict ? { conflict: patch.conflict } : {}),
      ...(patch.procedure ? { procedure: patch.procedure } : {}),
      updatedAt: this.now().toISOString(),
      governance: {
        ...entry.governance,
        ...(patch.governance ?? {})
      }
    };
    await this.adapter.write(withAudit(
      { ...snapshot, entries: upsertPermanentMemory(snapshot.entries, updated) },
      this.auditRecord("entry.updated", "completed", updated.id)
    ));
    await this.emit({ kind: "permanent-memory.entry.updated", providerId: snapshot.settings.providerId, entry: updated });
    return permanentMutation(true, "completed", updated, []);
  }

  async explain(id: MemoryId): Promise<import("@deepseek/platform-contracts").PermanentMemoryExplainResult> {
    const snapshot = await this.snapshot();
    const entry = snapshot.entries.find((item) => item.id === id && item.state !== "deleted");
    if (!entry) {
      return { ok: false, status: "not-found", sourceEvidence: [], diagnostics: ["permanent-memory.not-found"], redaction: { class: "internal" } };
    }
    return {
      ok: true,
      status: "completed",
      entry,
      sourceEvidence: entry.sourceEvidence ?? [],
      diagnostics: diagnosticsForEntry(entry),
      redaction: { class: "internal", fields: ["entry.content", "sourceEvidence.sourceId"] }
    };
  }

  async queryPermanent(query: PermanentMemoryQuery): Promise<readonly PermanentMemoryEntry[]> {
    const snapshot = await this.snapshot();
    if (!snapshot.settings.enabled || snapshot.settings.readEnabled === false) return [];
    const needle = query.query?.trim().toLowerCase();
    const limit = Math.max(0, Math.min(query.limit ?? snapshot.settings.maxQueryResults, snapshot.settings.maxQueryResults));
    const entries = snapshot.entries
      .filter((entry) => query.scope === undefined || entry.scope === query.scope)
      .filter((entry) => entry.state === "promoted" || (query.includeCandidates && entry.state === "candidate") || (query.includeDismissed && entry.state === "dismissed"))
      .filter((entry) => query.includeStale || !entry.freshness || entry.freshness.status === "fresh")
      .filter((entry) => query.includeConflicted || !entry.conflict || entry.conflict.status === "none")
      .filter((entry) => matchesScopeSelector(entry, query.scopeSelector))
      .filter((entry) => matchesPath(entry, query.path))
      .filter((entry) => !needle || permanentMemorySearchHaystack(entry).includes(needle))
      .slice(0, limit);
    await Promise.all(entries.map((entry) => this.emit({
      kind: "permanent-memory.entry.retrieved",
      providerId: snapshot.settings.providerId,
      entry,
      payload: { query: query.query ?? "", scope: query.scope ?? "", path: query.path ?? "" }
    })));
    await Promise.all(entries.map((entry) => this.emit({
      kind: "permanent-memory.entry.injected",
      providerId: snapshot.settings.providerId,
      entry,
      payload: { query: query.query ?? "", scope: query.scope ?? "" }
    })));
    return entries;
  }

  async export(): Promise<PermanentMemoryExportBundle> {
    const snapshot = await this.snapshot();
    const bundle: PermanentMemoryExportBundle = {
      schemaVersion: PERMANENT_MEMORY_SCHEMA_VERSION,
      providerManifest: this.manifest(),
      settings: snapshot.settings,
      entries: snapshot.entries,
      audit: snapshot.audit ?? [],
      exportedAt: this.now().toISOString(),
      replayFingerprint: `permanent-memory.export:${stableHash(JSON.stringify({
        providerId: snapshot.settings.providerId,
        entries: snapshot.entries.map((entry) => [entry.id, entry.updatedAt, entry.state]),
        auditCount: snapshot.audit?.length ?? 0
      }))}`,
      redaction: { class: "internal", fields: ["entries.content", "audit"] }
    };
    await this.emit({ kind: "permanent-memory.exported", providerId: snapshot.settings.providerId, payload: { entryCount: bundle.entries.length, replayFingerprint: bundle.replayFingerprint } });
    return bundle;
  }

  async import(bundle: PermanentMemoryExportBundle): Promise<PermanentMemoryImportResult> {
    const snapshot = await this.snapshot();
    const incompatibilities = importIncompatibilities(bundle.providerManifest, this.manifest());
    if (incompatibilities.length > 0) {
      return { ok: false, importedCount: 0, skippedCount: bundle.entries.length, diagnostics: incompatibilities, redaction: { class: "internal" } };
    }
    let entries = snapshot.entries;
    let importedCount = 0;
    let skippedCount = 0;
    for (const entry of bundle.entries) {
      const existing = entries.find((item) => item.id === entry.id);
      if (existing && existing.updatedAt >= entry.updatedAt) {
        skippedCount++;
        continue;
      }
      entries = upsertPermanentMemory(entries, entry);
      importedCount++;
    }
    await this.adapter.write(withAudit({
      schemaVersion: PERMANENT_MEMORY_SCHEMA_VERSION,
      settings: snapshot.settings,
      entries,
      audit: [...(snapshot.audit ?? []), ...bundle.audit]
    }, this.auditRecord("import.completed", "completed", undefined, [])));
    await this.emit({ kind: "permanent-memory.imported", providerId: snapshot.settings.providerId, payload: { importedCount, skippedCount } });
    return { ok: true, importedCount, skippedCount, diagnostics: [], redaction: { class: "internal" } };
  }

  async audit(limit = 100): Promise<readonly PermanentMemoryAuditRecord[]> {
    const snapshot = await this.snapshot();
    return [...(snapshot.audit ?? [])].slice(-Math.max(0, limit));
  }

  private async transition(
    id: MemoryId,
    state: "dismissed" | "deleted",
    reason: string,
    kind: "permanent-memory.candidate.dismissed" | "permanent-memory.entry.deleted"
  ): Promise<PermanentMemoryMutationResult> {
    const snapshot = await this.snapshot();
    if (!snapshot.settings.enabled) return permanentMutation(false, "disabled", undefined, ["permanent-memory.disabled"]);
    const entry = snapshot.entries.find((item) => item.id === id && item.state !== "deleted");
    if (!entry) return permanentMutation(false, "not-found", undefined, ["permanent-memory.not-found"]);
    const updated: PermanentMemoryEntry = {
      ...entry,
      state,
      updatedAt: this.now().toISOString(),
      ...(state === "deleted" ? { deletedAt: this.now().toISOString() } : {}),
      governance: {
        ...entry.governance,
        reason
      }
    };
    await this.adapter.write(withAudit(
      { ...snapshot, entries: upsertPermanentMemory(snapshot.entries, updated) },
      this.auditRecord(state === "deleted" ? "entry.deleted" : "candidate.dismissed", "completed", updated.id)
    ));
    await this.emit({ kind, providerId: snapshot.settings.providerId, entry: updated });
    return permanentMutation(true, "completed", updated, []);
  }

  private async snapshot(): Promise<PermanentMemoryStoreSnapshot> {
    const snapshot = await this.adapter.read();
    const migrated = migrateSnapshot(snapshot, this.defaultSettings);
    if (snapshot && snapshot.schemaVersion !== PERMANENT_MEMORY_SCHEMA_VERSION) {
      await this.emit({
        kind: "permanent-memory.migration.checked",
        providerId: migrated.settings.providerId,
        payload: { fromSchemaVersion: snapshot?.schemaVersion ?? "none", toSchemaVersion: PERMANENT_MEMORY_SCHEMA_VERSION }
      });
    }
    return migrated;
  }

  async scoreEvidence(payload: JsonObject = {}): Promise<void> {
    const snapshot = await this.snapshot();
    await this.emit({ kind: "permanent-memory.scored", providerId: snapshot.settings.providerId, payload });
  }

  private async emit(event: {
    readonly kind: PermanentMemoryHookEvent["kind"];
    readonly providerId: string;
    readonly entry?: PermanentMemoryHookEvent["entry"];
    readonly settings?: PermanentMemoryHookEvent["settings"];
    readonly payload?: PermanentMemoryHookEvent["payload"];
    readonly replayId?: string;
    readonly redaction?: PermanentMemoryHookEvent["redaction"];
  }): Promise<readonly PermanentMemoryHookResult[]> {
    const payload: PermanentMemoryHookEvent = {
      kind: event.kind,
      providerId: event.providerId,
      ...(event.entry ? { entry: event.entry } : {}),
      ...(event.settings ? { settings: event.settings } : {}),
      ...(event.payload ? { payload: event.payload } : {}),
      replayId: event.replayId ?? `permanent-memory.hook:${stableHash(JSON.stringify({ kind: event.kind, entryId: event.entry?.id ?? "", providerId: event.providerId }))}`,
      redaction: event.redaction ?? { class: "internal", fields: ["entry.content", "payload"] }
    };
    const results: PermanentMemoryHookResult[] = [];
    for (const hook of this.hooks) {
      const manifest = hook.manifest;
      if (manifest && !manifest.events.includes(payload.kind)) continue;
      const maxRetries = Math.max(0, manifest?.maxRetries ?? 0);
      let lastError: unknown;
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
          const result = await withTimeout(hook.invoke(payload), manifest?.timeoutMs ?? DEFAULT_HOOK_TIMEOUT_MS);
          if (isHookResult(result)) results.push(result);
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError && manifest?.failurePolicy === "enforce") throw lastError;
    }
    return results;
  }

  private auditRecord(
    action: string,
    status: PermanentMemoryAuditRecord["status"],
    entryId?: MemoryId,
    diagnostics: readonly string[] = []
  ): PermanentMemoryAuditRecord {
    const at = this.now().toISOString();
    const replayFingerprint = `permanent-memory.audit:${stableHash(JSON.stringify({
      providerId: this.providerId,
      action,
      status,
      entryId: entryId ?? "",
      diagnostics
    }))}`;
    return {
      schemaVersion: PERMANENT_MEMORY_SCHEMA_VERSION,
      auditId: `audit:${stableHash(`${this.providerId}:${action}:${entryId ?? ""}:${at}:${diagnostics.join(",")}`)}`,
      at,
      action,
      ...(entryId ? { entryId } : {}),
      providerId: this.providerId,
      status,
      diagnostics,
      replayFingerprint,
      redaction: { class: "internal", fields: ["diagnostics"] }
    };
  }
}

function clonePermanentMemorySnapshot(snapshot: PermanentMemoryStoreSnapshot): PermanentMemoryStoreSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as PermanentMemoryStoreSnapshot;
}

function isPermanentMemorySnapshot(value: unknown): value is PermanentMemoryStoreSnapshot {
  if (!isJsonObject(value)) return false;
  if (!isJsonObject(value.settings)) return false;
  if (!Array.isArray(value.entries)) return false;
  return typeof value.settings.providerId === "string" && typeof value.settings.enabled === "boolean";
}

function migrateSnapshot(snapshot: PermanentMemoryStoreSnapshot | undefined, defaults: PermanentMemorySettings): PermanentMemoryStoreSnapshot {
  if (!snapshot) return { schemaVersion: PERMANENT_MEMORY_SCHEMA_VERSION, settings: defaults, entries: [], audit: [] };
  const now = new Date(0).toISOString();
  return {
    schemaVersion: PERMANENT_MEMORY_SCHEMA_VERSION,
    settings: {
      ...defaults,
      ...snapshot.settings,
      providerId: snapshot.settings.providerId || defaults.providerId
    },
    entries: snapshot.entries.map((entry) => {
      const scoped = entry.scopeSelector ?? defaultScopeSelector(entry.scope);
      return {
        ...entry,
        ...(scoped ? { scopeSelector: scoped } : {}),
        sourceEvidence: entry.sourceEvidence ?? [],
        freshness: entry.freshness ?? freshMemory([], now),
        conflict: entry.conflict ?? noConflict()
      };
    }),
    audit: snapshot.audit ?? []
  };
}

function upsertPermanentMemory(entries: readonly PermanentMemoryEntry[], entry: PermanentMemoryEntry): readonly PermanentMemoryEntry[] {
  const index = entries.findIndex((item) => item.id === entry.id);
  if (index < 0) return [...entries, entry];
  return entries.map((item, itemIndex) => itemIndex === index ? entry : item);
}

function memoryEntryFromPermanent(entry: PermanentMemoryEntry): MemoryEntry {
  return {
    id: entry.id,
    scope: entry.scope,
    content: entry.content,
    provenance: {
      ...entry.provenance,
      permanentMemory: true,
      permanentMemoryState: entry.state,
      candidateKind: entry.candidateKind ?? "",
      freshnessStatus: entry.freshness?.status ?? "fresh",
      conflictStatus: entry.conflict?.status ?? "none",
      sourceEvidenceIds: (entry.sourceEvidence ?? []).map((source) => source.sourceId),
      scopeSelector: entry.scopeSelector ?? {}
    },
    redaction: entry.redaction,
    ...(entry.ttlMs !== undefined ? { ttlMs: entry.ttlMs } : {}),
    ...(entry.confidence !== undefined ? { confidence: entry.confidence } : {})
  };
}

function permanentMutation(ok: boolean, status: PermanentMemoryMutationResult["status"], entry: PermanentMemoryEntry | undefined, diagnostics: readonly string[]): PermanentMemoryMutationResult {
  return {
    ok,
    status,
    ...(entry ? { entry } : {}),
    diagnostics
  };
}

function permanentMemorySearchHaystack(entry: PermanentMemoryEntry): string {
  return [
    entry.scope,
    entry.content,
    ...entry.tags,
    JSON.stringify(entry.provenance),
    entry.candidateKind ?? "",
    entry.freshness?.status ?? "",
    entry.conflict?.status ?? ""
  ].join("\n").toLowerCase();
}

function memoryRedactionFor(content: string): MemoryEntry["redaction"] {
  return isSecretLike(content) ? { class: "secret", fields: ["content"] } : { class: "internal", fields: ["content"] };
}

function redactMemoryContent(content: string): string {
  return content
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/g, "Bearer [REDACTED:token]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED:api-key]")
    .replace(/\b[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s"',;]+/gi, (match) => {
      const [key] = match.split("=");
      return `${key}=[REDACTED:secret]`;
    });
}

function isSecretLike(content: string): boolean {
  return redactMemoryContent(content) !== content;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function definedSettings(patch: Partial<PermanentMemorySettings>): Partial<PermanentMemorySettings> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<PermanentMemorySettings>;
}

function explicitSourceEvidence(input: PermanentMemoryCandidateInput): readonly PermanentMemorySourceEvidence[] {
  return [{
    sourceKind: "user-explicit",
    sourceId: input.sessionId ?? "manual",
    sourceHash: stableHash(input.content),
    redaction: { class: "internal" }
  }];
}

function defaultScopeSelector(scope: MemoryScope): PermanentMemoryEntry["scopeSelector"] {
  return scope === "working" || scope === "session" ? undefined : { scope };
}

function freshMemory(evidenceIds: readonly string[], checkedAt: string): PermanentMemoryFreshness {
  return { status: "fresh", checkedAt, evidenceIds };
}

function noConflict(): PermanentMemoryConflict {
  return { status: "none", conflictingEvidenceIds: [] };
}

function workflowRouteDiagnostics(input: PermanentMemoryCandidateInput, candidateKind: NonNullable<PermanentMemoryEntry["candidateKind"]>): readonly string[] {
  const procedure = input.procedure;
  if (procedure && procedure.routeTo !== "memory") return [`permanent-memory.routed-to-${procedure.routeTo}`];
  if (candidateKind === "workflow-procedure") return ["permanent-memory.workflow-routed-to-skill"];
  const content = input.content.toLowerCase();
  if (/\b(step|first|then|finally|run|command|workflow|procedure)\b/.test(content) && /\b(always|whenever|repeat|each time)\b/.test(content)) {
    return ["permanent-memory.workflow-routed-to-procedure"];
  }
  return [];
}

function sourcePolicyDiagnostics(sourceEvidence: readonly PermanentMemorySourceEvidence[] | undefined, settings: PermanentMemorySettings): readonly string[] {
  const excluded = new Set(settings.excludedSourceKinds ?? []);
  return (sourceEvidence ?? [])
    .filter((source) => excluded.has(source.sourceKind) || (source.sourceClass !== undefined && excluded.has(source.sourceClass)))
    .map((source) => `permanent-memory.source-excluded:${source.sourceKind}`);
}

function inferCandidateKind(content: string): NonNullable<PermanentMemoryEntry["candidateKind"]> {
  if (/\b(prefer|preference|like|use .+ by default)\b/i.test(content)) return "preference";
  if (/\b(decision|decide|architecture|adr)\b/i.test(content)) return "project-decision";
  if (/\b(correction|actually|not .+ but)\b/i.test(content)) return "correction";
  if (/\b(step|workflow|procedure|run .* then)\b/i.test(content)) return "workflow-procedure";
  return "fact";
}

function matchesScopeSelector(entry: PermanentMemoryEntry, selector: PermanentMemoryQuery["scopeSelector"]): boolean {
  if (!selector) return true;
  const entrySelector = entry.scopeSelector;
  if (selector.scope && entry.scope !== selector.scope) return false;
  if (selector.workspaceRoot && entrySelector?.workspaceRoot && selector.workspaceRoot !== entrySelector.workspaceRoot) return false;
  if (selector.userId && entrySelector?.userId && selector.userId !== entrySelector.userId) return false;
  if (selector.agentId && entrySelector?.agentId && selector.agentId !== entrySelector.agentId) return false;
  if (selector.threadId && entrySelector?.threadId && selector.threadId !== entrySelector.threadId) return false;
  if (selector.pathPrefix && entrySelector?.pathPrefix && !entrySelector.pathPrefix.startsWith(selector.pathPrefix) && !selector.pathPrefix.startsWith(entrySelector.pathPrefix)) return false;
  return true;
}

function matchesPath(entry: PermanentMemoryEntry, path: string | undefined): boolean {
  if (!path) return true;
  const prefix = entry.scopeSelector?.pathPrefix;
  return !prefix || path.startsWith(prefix);
}

function diagnosticsForEntry(entry: PermanentMemoryEntry): readonly string[] {
  return [
    ...(entry.freshness && entry.freshness.status !== "fresh" ? [`permanent-memory.${entry.freshness.status}`] : []),
    ...(entry.conflict && entry.conflict.status !== "none" ? [`permanent-memory.conflict:${entry.conflict.status}`] : []),
    ...(entry.procedure && entry.procedure.routeTo !== "memory" ? [`permanent-memory.routed-to-${entry.procedure.routeTo}`] : [])
  ];
}

function isHookResult(value: unknown): value is PermanentMemoryHookResult {
  return isJsonObject(value) && (value.status === "completed" || value.status === "failed" || value.status === "timed-out") && Array.isArray(value.diagnostics);
}

function mergeHookPatches(results: readonly PermanentMemoryHookResult[]): PermanentMemoryUpdatePatch | undefined {
  const patches = results.map((result) => result.patch).filter((patch): patch is PermanentMemoryUpdatePatch => Boolean(patch));
  if (patches.length === 0) return undefined;
  return patches.reduce<PermanentMemoryUpdatePatch>((merged, patch) => ({
    ...merged,
    ...patch,
    ...(merged.tags || patch.tags ? { tags: [...new Set([...(merged.tags ?? []), ...(patch.tags ?? [])])].sort() } : {})
  }), {});
}

function withAudit(snapshot: PermanentMemoryStoreSnapshot, audit: PermanentMemoryAuditRecord): PermanentMemoryStoreSnapshot {
  return {
    schemaVersion: PERMANENT_MEMORY_SCHEMA_VERSION,
    settings: snapshot.settings,
    entries: snapshot.entries,
    audit: [...(snapshot.audit ?? []), audit]
  };
}

function importIncompatibilities(source: PermanentMemoryProviderManifest, target: PermanentMemoryProviderManifest): readonly string[] {
  const diagnostics: string[] = [];
  if (source.provenance && !target.provenance) diagnostics.push("permanent-memory.import.provenance-unsupported");
  if (source.deleteSemantics === "tombstone" && target.deleteSemantics === "hard-delete") diagnostics.push("permanent-memory.import.delete-semantics-unsupported");
  for (const scope of source.scopes) {
    if (!target.scopes.includes(scope)) diagnostics.push(`permanent-memory.import.scope-unsupported:${scope}`);
  }
  return diagnostics;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Permanent memory hook timed out.")), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
