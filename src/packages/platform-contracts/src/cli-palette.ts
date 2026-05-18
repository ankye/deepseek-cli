import type {
  CliActionKind,
  CliCompositionSnapshot,
  CliInteractionContribution,
  CliInteractionMode,
  CliJumpEntry,
  CliPaletteEntry,
  CliReferenceSet,
  CliResultList,
  CliTargetRef
} from "./cli-composition.js";
import type { JsonObject, RedactedError, RedactionMetadata } from "./common.js";

export const CLI_PALETTE_SCHEMA_VERSION = "1.0.0";

export type CliPaletteDiagnosticCode =
  | "CLI_PALETTE_RECORD_INVALID"
  | "CLI_PALETTE_KEYMAP_CONFLICT"
  | "CLI_PALETTE_SEQUENCE_INCOMPLETE"
  | "CLI_PALETTE_SEQUENCE_UNBOUND"
  | "CLI_ACTION_TARGET_NOT_FOUND"
  | "CLI_ACTION_UNSUPPORTED";

export type CliKeymapProfileName = "core" | "vi-minimal" | "vi-professional";

export interface CliPaletteProjectionEntry extends JsonObject {
  readonly schemaVersion: string;
  readonly entry: CliPaletteEntry;
  readonly target: CliTargetRef;
  readonly aliases: readonly string[];
  readonly searchText: string;
  readonly source: JsonObject;
  readonly permissions: readonly string[];
  readonly sideEffect: string;
  readonly redaction: RedactionMetadata;
  readonly referencePitFixtureIds: readonly string[];
  readonly metadata: JsonObject;
}

export interface CliPaletteDiagnostic extends RedactedError {
  readonly code: CliPaletteDiagnosticCode;
  readonly severity: "info" | "warning" | "error";
  readonly targetIds: readonly string[];
}

export interface CliPaletteProjectionResult extends JsonObject {
  readonly schemaVersion: string;
  readonly entries: readonly CliPaletteProjectionEntry[];
  readonly resultList: CliResultList;
  readonly diagnostics: readonly CliPaletteDiagnostic[];
  readonly redaction: RedactionMetadata;
}

export interface CliActionStateUpdate extends JsonObject {
  readonly activeTarget?: CliTargetRef;
  readonly resultLists?: readonly CliResultList[];
  readonly referenceSets?: readonly CliReferenceSet[];
  readonly jumpEntry?: CliJumpEntry;
  readonly commandDescriptor?: JsonObject;
}

export interface CliActionResolutionResult extends JsonObject {
  readonly schemaVersion: string;
  readonly ok: boolean;
  readonly action: CliActionKind;
  readonly mode: CliInteractionMode;
  readonly target: CliTargetRef;
  readonly snapshot: CliCompositionSnapshot;
  readonly update?: CliActionStateUpdate;
  readonly diagnostics: readonly CliPaletteDiagnostic[];
  readonly redaction: RedactionMetadata;
}

export interface CliKeymapProfile extends JsonObject {
  readonly schemaVersion: string;
  readonly name: CliKeymapProfileName;
  readonly contributions: readonly CliInteractionContribution[];
  readonly diagnostics: readonly CliPaletteDiagnostic[];
  readonly redaction: RedactionMetadata;
}
