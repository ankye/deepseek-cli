import type {
  CliInteractionMode,
  CliKeySequenceResolution,
  CliKeySequenceState,
  CliKeymapEntry,
  CliKeymapProfile,
  CliRawInputEvent
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import { viProfessionalKeymapProfile } from "./keymap.js";

export interface ResolveViKeySequenceInput {
  readonly mode: CliInteractionMode;
  readonly keys: readonly string[];
  readonly profile?: CliKeymapProfile;
  readonly elapsedMs?: number;
  readonly sequenceTimeoutMs?: number;
}

export function rawInputEventToKeyName(event: CliRawInputEvent): string | undefined {
  if (event.kind !== "key") return undefined;
  if (event.ctrl && event.key) return `Ctrl+${event.key.toLocaleLowerCase("en")}`;
  if (event.alt && event.key) return `Alt+${event.key}`;
  if (event.key === " ") return "Space";
  return event.key ?? event.text;
}

export function createViKeySequenceState(input: {
  readonly mode: CliInteractionMode;
  readonly keys?: readonly string[];
}): CliKeySequenceState {
  const normalized = normalizeKeys(input.keys ?? []);
  const { count, commandKeys } = splitCount(normalized);
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    profile: "vi-professional",
    mode: input.mode,
    keys: normalized,
    ...(count !== undefined ? { count } : {}),
    leaderActive: commandKeys[0] === "Space",
    status: "pending",
    redaction: { class: "public" }
  };
}

export function resolveViKeySequence(input: ResolveViKeySequenceInput): CliKeySequenceResolution {
  const profile = input.profile ?? viProfessionalKeymapProfile();
  const state = createViKeySequenceState({ mode: input.mode, keys: input.keys });
  const { count, commandKeys } = splitCount(state.keys);
  if (commandKeys.length === 0) return pending(state);
  const first = commandKeys[0];
  const bindings = profile.contributions
    .map((contribution) => contribution.keymap)
    .filter((entry): entry is CliKeymapEntry => entry !== undefined && entry.mode === input.mode);
  const exact = bindings.find((entry) => sameSequence(entrySequence(entry), commandKeys));
  if (exact && exact.targetKind !== "command") return resolvedFromEntry(state, exact, count);
  if (first === "Escape") return cancelled({ ...state, status: "cancelled" });
  const commandMode = commandModeForKey(first);
  if (commandMode && commandKeys.length === 1) {
    return {
      schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
      state: { ...state, status: "resolved" },
      status: "resolved",
      action: commandMode === "search" ? "search" : "inspect",
      targetKind: "command",
      ...(count !== undefined ? { count } : {}),
      commandMode,
      previewText: commandMode === "search" ? "Open search command bar." : commandMode === "help" ? "Show key/action help." : "Open command bar.",
      redaction: { class: "public" }
    };
  }

  if (exact) return resolvedFromEntry(state, exact, count);
  if (bindings.some((entry) => isPrefix(commandKeys, entrySequence(entry)))) {
    if ((input.elapsedMs ?? 0) > (input.sequenceTimeoutMs ?? 1000)) {
      return {
        schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
        state: { ...state, status: "unbound" },
        status: "unbound",
        diagnostic: {
          code: "CLI_KEY_SEQUENCE_UNBOUND",
          message: `Timed out waiting for vi-professional sequence after ${input.elapsedMs}ms.`
        },
        redaction: { class: "public" }
      };
    }
    return pending(state);
  }
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    state: { ...state, status: "unbound" },
    status: "unbound",
    diagnostic: {
      code: "CLI_KEY_SEQUENCE_UNBOUND",
      message: `No vi-professional binding for ${commandKeys.join(" ")} in ${input.mode} mode.`
    },
    redaction: { class: "public" }
  };
}

function resolvedFromEntry(
  state: CliKeySequenceState,
  exact: CliKeymapEntry,
  count: number | undefined
): CliKeySequenceResolution {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    state: { ...state, status: "resolved" },
    status: "resolved",
    action: exact.action,
    ...(exact.targetKind ? { targetKind: exact.targetKind } : {}),
    ...(count !== undefined ? { count } : {}),
    previewText: exact.preview ?? exact.description ?? `${exact.key} -> ${exact.action}`,
    redaction: { class: "public" }
  };
}

function pending(state: CliKeySequenceState): CliKeySequenceResolution {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    state,
    status: "pending",
    diagnostic: {
      code: "CLI_KEY_SEQUENCE_PENDING",
      message: "Waiting for more keys."
    },
    redaction: { class: "public" }
  };
}

function cancelled(state: CliKeySequenceState): CliKeySequenceResolution {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    state,
    status: "cancelled",
    diagnostic: {
      code: "CLI_KEY_SEQUENCE_CANCELLED",
      message: "Key sequence cancelled."
    },
    redaction: { class: "public" }
  };
}

function commandModeForKey(key: string | undefined): "search" | "command" | "help" | undefined {
  if (key === "/") return "search";
  if (key === ":") return "command";
  if (key === "?") return "help";
  return undefined;
}

function normalizeKeys(keys: readonly string[]): readonly string[] {
  return keys.map((key) => key === " " ? "Space" : key).filter((key) => key.length > 0);
}

function splitCount(keys: readonly string[]): { readonly count?: number; readonly commandKeys: readonly string[] } {
  const digits: string[] = [];
  let index = 0;
  while (index < keys.length && /^[0-9]$/.test(keys[index] ?? "")) {
    digits.push(keys[index]!);
    index += 1;
  }
  const parsed = digits.length > 0 ? Number(digits.join("")) : undefined;
  return {
    ...(parsed !== undefined && Number.isFinite(parsed) && parsed > 0 ? { count: parsed } : {}),
    commandKeys: keys.slice(index)
  };
}

function entrySequence(entry: CliKeymapEntry): readonly string[] {
  if (entry.sequence && entry.sequence.length > 0) return normalizeKeys(entry.sequence);
  return normalizeKeys(entry.key.split(/\s+/));
}

function sameSequence(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function isPrefix(prefix: readonly string[], full: readonly string[]): boolean {
  return prefix.length < full.length && prefix.every((value, index) => value === full[index]);
}
