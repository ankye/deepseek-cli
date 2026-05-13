import type {
  CommandCompositionContribution,
  CommandCompositionDiagnostic,
  CommandCompositionProjectionResult,
  CommandCompositionProjectionScope,
  CommandCompositionRecord,
  CommandManifest
} from "@deepseek/platform-contracts";
import { COMMAND_COMPOSITION_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { commandManifestToCompositionRecord, contributionToCompositionRecord } from "./normalizers.js";
export * from "./normalizers.js";

export interface CommandCompositionRegistry {
  registerRecord(record: CommandCompositionRecord): void;
  registerContribution(contribution: CommandCompositionContribution): CommandCompositionRecord;
  registerCommandManifest(manifest: CommandManifest): CommandCompositionRecord;
  listRecords(): readonly CommandCompositionRecord[];
  project(scope: CommandCompositionProjectionScope): CommandCompositionProjectionResult;
}

export function createCommandCompositionRegistry(records: readonly CommandCompositionRecord[] = []): CommandCompositionRegistry {
  return new InMemoryCommandCompositionRegistry(records);
}

export function projectCommandComposition(
  records: readonly CommandCompositionRecord[],
  scope: CommandCompositionProjectionScope
): CommandCompositionProjectionResult {
  const diagnostics: CommandCompositionDiagnostic[] = [];
  const eligible: CommandCompositionRecord[] = [];

  for (const record of records) {
    if (!record.schemaVersion) {
      diagnostics.push(diagnostic("COMPOSITION_SCHEMA_VERSION_MISSING", "error", scope, [record.target.id], "Composition record is missing schemaVersion."));
      continue;
    }
    if (isDisabledOrHidden(record)) continue;
    if (!isVisibleInScope(record, scope)) continue;
    if (scope === "model-visible") {
      const reason = modelVisibilityRejection(record);
      if (reason) {
        diagnostics.push(diagnostic("COMPOSITION_MODEL_VISIBILITY_REJECTED", "warning", scope, [record.target.id], reason));
        continue;
      }
    }
    eligible.push(record);
  }

  diagnostics.push(...collisionDiagnostics(eligible, scope));
  const collision = diagnostics.some((item) => item.code === "COMPOSITION_ALIAS_COLLISION" || item.code === "COMPOSITION_NAME_COLLISION");

  return {
    schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION,
    scope,
    ok: !collision && !diagnostics.some((item) => item.severity === "error"),
    records: collision ? [] : sortRecords(eligible),
    diagnostics,
    redaction: { class: "internal" },
    compatibility: { schemaVersion: COMMAND_COMPOSITION_SCHEMA_VERSION }
  };
}

export function projectUserVisible(records: readonly CommandCompositionRecord[]): CommandCompositionProjectionResult {
  return projectCommandComposition(records, "user-visible");
}

export function projectHostVisible(records: readonly CommandCompositionRecord[]): CommandCompositionProjectionResult {
  return projectCommandComposition(records, "host-visible");
}

export function projectModelVisible(records: readonly CommandCompositionRecord[]): CommandCompositionProjectionResult {
  return projectCommandComposition(records, "model-visible");
}

export function projectResultList(records: readonly CommandCompositionRecord[]): CommandCompositionProjectionResult {
  return projectCommandComposition(records, "result-list");
}

class InMemoryCommandCompositionRegistry implements CommandCompositionRegistry {
  private readonly records = new Map<string, CommandCompositionRecord>();

  constructor(records: readonly CommandCompositionRecord[]) {
    for (const record of records) this.registerRecord(record);
  }

  registerRecord(record: CommandCompositionRecord): void {
    this.records.set(record.id, record);
  }

  registerContribution(contribution: CommandCompositionContribution): CommandCompositionRecord {
    const record = contributionToCompositionRecord(contribution);
    this.registerRecord(record);
    return record;
  }

  registerCommandManifest(manifest: CommandManifest): CommandCompositionRecord {
    const record = commandManifestToCompositionRecord(manifest);
    this.registerRecord(record);
    return record;
  }

  listRecords(): readonly CommandCompositionRecord[] {
    return [...this.records.values()];
  }

  project(scope: CommandCompositionProjectionScope): CommandCompositionProjectionResult {
    return projectCommandComposition(this.listRecords(), scope);
  }
}

function isVisibleInScope(record: CommandCompositionRecord, scope: CommandCompositionProjectionScope): boolean {
  if (scope === "user-visible") return record.projection.userVisible !== false;
  if (scope === "host-visible") return record.projection.hostVisible !== false;
  if (scope === "model-visible") return record.projection.modelVisible === true;
  return record.projection.resultListVisible !== false;
}

function isDisabledOrHidden(record: CommandCompositionRecord): boolean {
  return record.projection.disabled === true || record.projection.hidden === true;
}

function modelVisibilityRejection(record: CommandCompositionRecord): string | undefined {
  if (record.projection.hostOnly === true) return "Host-only records are not model-visible.";
  if (record.sideEffect !== "none" && record.sideEffect !== "read") return `Side effect ${record.sideEffect} is not model-visible.`;
  if (record.source.trust !== "trusted" && record.source.kind !== "built-in" && record.source.kind !== "core") return "Untrusted provenance is not model-visible.";
  if (!record.outputSchema) return "Model-visible records require an explicit output schema.";
  if (!record.schemaVersion) return "Model-visible records require schemaVersion.";
  return undefined;
}

function collisionDiagnostics(records: readonly CommandCompositionRecord[], scope: CommandCompositionProjectionScope): readonly CommandCompositionDiagnostic[] {
  const diagnostics: CommandCompositionDiagnostic[] = [];
  const seen = new Map<string, CommandCompositionRecord>();
  for (const record of records) {
    const names = [record.displayName, ...record.aliases].map(normalizeToken).filter((token) => token.length > 0);
    for (const token of names) {
      const existing = seen.get(token);
      if (!existing) {
        seen.set(token, record);
        continue;
      }
      if (existing.id === record.id) continue;
      diagnostics.push(
        diagnostic(
          token === normalizeToken(record.displayName) || token === normalizeToken(existing.displayName) ? "COMPOSITION_NAME_COLLISION" : "COMPOSITION_ALIAS_COLLISION",
          "error",
          scope,
          [existing.target.id, record.target.id],
          `Duplicate composition token: ${token}`,
          token
        )
      );
    }
  }
  return diagnostics;
}

function sortRecords(records: readonly CommandCompositionRecord[]): readonly CommandCompositionRecord[] {
  return [...records].sort((a, b) => compareRecords(a, b));
}

function compareRecords(a: CommandCompositionRecord, b: CommandCompositionRecord): number {
  return (
    compareString(a.projection.group ?? "", b.projection.group ?? "") ||
    trustRank(a.source.trust, a.source.kind) - trustRank(b.source.trust, b.source.kind) ||
    compareString(a.source.kind, b.source.kind) ||
    compareString(a.displayName, b.displayName) ||
    compareString(a.target.id, b.target.id)
  );
}

function trustRank(trust: string | undefined, kind: string): number {
  if (trust === "trusted" || kind === "built-in" || kind === "core") return 0;
  if (trust === "workspace" || kind === "workspace") return 1;
  if (kind === "user") return 2;
  if (trust === "quarantined") return 4;
  return 3;
}

function compareString(a: string, b: string): number {
  return a.localeCompare(b, "en");
}

function normalizeToken(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
}

function diagnostic(
  code: CommandCompositionDiagnostic["code"],
  severity: CommandCompositionDiagnostic["severity"],
  scope: CommandCompositionProjectionScope,
  targetIds: readonly string[],
  message: string,
  token?: string
): CommandCompositionDiagnostic {
  return {
    code,
    message,
    retryable: false,
    severity,
    scope,
    targetIds,
    ...(token ? { token } : {}),
    redaction: { class: "public" },
    details: { targetIds }
  };
}
