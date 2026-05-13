import type {
  CliInteractionContribution,
  CliKeymapProfile,
  CliPaletteDiagnostic
} from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION, validateCliInteractionContributions } from "@deepseek/platform-contracts";

export function coreKeymapProfile(): CliKeymapProfile {
  return keymapProfile("core", [
    key("core.next", "result-list", "ArrowDown", "next", "result-list"),
    key("core.previous", "result-list", "ArrowUp", "previous", "result-list"),
    key("core.open", "result-list", "Enter", "open", "result-list-item"),
    key("core.inspect", "result-list", "?", "inspect", "result-list-item"),
    key("core.command", "normal", ":", "inspect", "command")
  ]);
}

export function viMinimalKeymapProfile(): CliKeymapProfile {
  return keymapProfile("vi-minimal", [
    key("vi.next", "result-list", "j", "next", "result-list"),
    key("vi.previous", "result-list", "k", "previous", "result-list"),
    key("vi.first", "result-list", "gg", "first", "result-list"),
    key("vi.last", "result-list", "G", "last", "result-list"),
    key("vi.open", "result-list", "Enter", "open", "result-list-item"),
    key("vi.inspect", "result-list", "i", "inspect", "result-list-item"),
    key("vi.command", "normal", ":", "inspect", "command"),
    key("vi.quit", "normal", "q", "inspect", "command")
  ]);
}

export function validateKeymapProfile(contributions: readonly CliInteractionContribution[]): readonly CliPaletteDiagnostic[] {
  const validation = validateCliInteractionContributions(contributions);
  return [
    ...validation.conflicts.map((conflict): CliPaletteDiagnostic => ({
      code: "CLI_PALETTE_KEYMAP_CONFLICT",
      message: conflict.reason,
      retryable: false,
      severity: "warning",
      targetIds: [conflict.winnerId, ...conflict.loserIds],
      redaction: { class: "public" },
      details: { kind: conflict.kind, winnerId: conflict.winnerId, loserIds: conflict.loserIds }
    })),
    ...validation.diagnostics.map((message): CliPaletteDiagnostic => ({
      code: "CLI_PALETTE_RECORD_INVALID",
      message,
      retryable: false,
      severity: "error",
      targetIds: [],
      redaction: { class: "public" }
    }))
  ];
}

function keymapProfile(name: "core" | "vi-minimal", contributions: readonly CliInteractionContribution[]): CliKeymapProfile {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    name,
    contributions,
    diagnostics: validateKeymapProfile(contributions),
    redaction: { class: "internal" }
  };
}

function key(
  id: string,
  mode: CliInteractionContribution["keymap"] extends infer T ? T extends { readonly mode: infer M } ? M : never : never,
  keyName: string,
  action: NonNullable<CliInteractionContribution["action"]>,
  targetKind: NonNullable<CliInteractionContribution["targetKind"]>
): CliInteractionContribution {
  return {
    id,
    kind: "keymap",
    source: "core",
    action,
    targetKind,
    keymap: { id, mode, key: keyName, action, targetKind }
  };
}
