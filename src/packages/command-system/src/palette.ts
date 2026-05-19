import type {
  CliPaletteDiagnostic,
  CliPaletteProjectionEntry,
  CliPaletteProjectionResult,
  CliResultList,
  CliResultListItem,
  CliTargetRef,
  CommandCompositionRecord
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { projectResultList } from "./composition.js";

export function projectCommandPalette(records: readonly CommandCompositionRecord[]): CliPaletteProjectionResult {
  const projection = projectResultList(records);
  const diagnostics: CliPaletteDiagnostic[] = projection.diagnostics.map((diagnostic) => ({
    code: "CLI_PALETTE_RECORD_INVALID",
    message: diagnostic.message,
    retryable: false,
    severity: diagnostic.severity,
    targetIds: diagnostic.targetIds,
    redaction: diagnostic.redaction,
    ...(diagnostic.details ? { details: diagnostic.details } : {})
  }));
  const entries = projection.records.map((record, index) => paletteEntry(record, index));
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    entries,
    resultList: commandPaletteResultList(entries),
    diagnostics,
    redaction: { class: "internal" }
  };
}

export function commandPaletteResultList(entries: readonly CliPaletteProjectionEntry[]): CliResultList {
  const items: CliResultListItem[] = entries.map((entry, index) => ({
    id: `palette-item:${entry.entry.id}`,
    target: entry.target,
    label: entry.entry.title,
    order: index,
    metadata: {
      paletteEntryId: entry.entry.id,
      action: entry.entry.action,
      category: entry.entry.category ?? "",
      aliases: [...entry.aliases],
      source: entry.source,
      permissions: [...entry.permissions],
      sideEffect: entry.sideEffect,
      referencePitFixtureIds: [...entry.referencePitFixtureIds],
      redaction: entry.redaction
    }
  }));
  return {
    id: "result-list:command-palette",
    kind: "generic",
    sourceCommand: "command-palette",
    label: "Command palette",
    items,
    ...(items[0] ? { activeItemId: items[0].id } : {}),
    metadata: { schemaVersion: CLI_PALETTE_SCHEMA_VERSION }
  };
}

function paletteEntry(record: CommandCompositionRecord, order: number): CliPaletteProjectionEntry {
  const target: CliTargetRef = {
    kind: "command",
    id: record.target.id,
    label: record.displayName,
    metadata: {
      compositionRecordId: record.id,
      compositionTargetKind: record.target.kind,
      ownerSubsystem: record.ownerSubsystem,
      sideEffect: record.sideEffect,
      permissions: [...record.permissions],
      source: record.source,
      referencePitFixtureIds: [...record.referencePitFixtureIds],
      ...(record.metadata ? { recordMetadata: record.metadata } : {}),
      ...(record.projection.metadata ? { projectionMetadata: record.projection.metadata } : {})
    }
  };
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    entry: {
      id: `palette:${record.target.kind}:${record.target.id}`,
      title: record.displayName,
      action: "inspect",
      targetKind: "command",
      category: record.projection.group ?? record.kind
    },
    target,
    aliases: record.aliases,
    searchText: [record.displayName, ...record.aliases, record.kind, record.source.kind, record.source.id ?? ""].join(" ").toLowerCase(),
    source: record.source,
    permissions: record.permissions,
    sideEffect: record.sideEffect,
    redaction: record.redaction,
    referencePitFixtureIds: record.referencePitFixtureIds,
    metadata: {
      order,
      compositionRecordId: record.id,
      ownerSubsystem: record.ownerSubsystem,
      targetKind: record.target.kind,
      compatibility: record.compatibility,
      provenance: record.provenance,
      ...(record.metadata ? { recordMetadata: record.metadata } : {}),
      ...(record.projection.metadata ? { projectionMetadata: record.projection.metadata } : {})
    }
  };
}
