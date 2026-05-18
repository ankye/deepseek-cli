import type {
  CliInteractionContribution,
  CliInteractionMode,
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

export function viProfessionalKeymapProfile(): CliKeymapProfile {
  return keymapProfile("vi-professional", [
    key("vi.pro.result.next", "result-list", "j", "next", "result-list", { description: "Move to the next result." }),
    key("vi.pro.result.previous", "result-list", "k", "previous", "result-list", { description: "Move to the previous result." }),
    key("vi.pro.result.first", "result-list", "gg", "first", "result-list", { sequence: ["g", "g"], description: "Move to the first result." }),
    key("vi.pro.result.last", "result-list", "G", "last", "result-list", { description: "Move to the last result." }),
    key("vi.pro.result.page-down", "result-list", "Ctrl+d", "next", "result-list", { description: "Move down by a count or half-page." }),
    key("vi.pro.result.page-up", "result-list", "Ctrl+u", "previous", "result-list", { description: "Move up by a count or half-page." }),
    key("vi.pro.result.back", "result-list", "h", "back", "result-list", { description: "Jump back." }),
    key("vi.pro.result.open", "result-list", "l", "open", "result-list-item", { description: "Open active result." }),
    key("vi.pro.result.enter", "result-list", "Enter", "open", "result-list-item", { description: "Open active result." }),
    key("vi.pro.result.inspect", "result-list", "?", "preview", "result-list-item", { description: "Preview active result before action." }),
    key("vi.pro.result.search", "result-list", "/", "search", "command", { description: "Open search." }),
    key("vi.pro.result.command", "result-list", ":", "inspect", "command", { description: "Open command bar." }),
    key("vi.pro.result.quit", "result-list", "q", "cancel", "command", { description: "Close result-list focus." }),

    key("vi.pro.normal.search", "normal", "/", "search", "command", { description: "Open search." }),
    key("vi.pro.normal.command", "normal", ":", "inspect", "command", { description: "Open command bar." }),
    key("vi.pro.normal.help", "normal", "?", "preview", "command", { description: "Show action preview/help." }),
    key("vi.pro.normal.quit", "normal", "q", "cancel", "command", { description: "Cancel or close current local mode." }),
    key("vi.pro.normal.plugin-leader", "normal", "Space p", "plugin-action", "plugin-contribution", { sequence: ["Space", "p"], namespace: "plugin", description: "Open plugin contribution actions." }),

    ...panelNavigation("transcript"),
    ...panelNavigation("reasoning-inspector"),
    ...panelNavigation("plugin-inspector"),
    ...panelNavigation("activity-feed"),

    key("vi.pro.approval.accept", "approval", "Enter", "accept", "approval-request", { description: "Accept active approval." }),
    key("vi.pro.approval.deny", "approval", "q", "deny", "approval-request", { description: "Deny active approval." }),
    key("vi.pro.approval.inspect", "approval", "?", "inspect", "approval-request", { description: "Inspect active approval." }),

    key("vi.pro.command.escape", "command", "Escape", "cancel", "command", { description: "Close command bar." }),
    key("vi.pro.search.escape", "search", "Escape", "cancel", "command", { description: "Close search." })
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

function keymapProfile(name: CliKeymapProfile["name"], contributions: readonly CliInteractionContribution[]): CliKeymapProfile {
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
  mode: CliInteractionMode,
  keyName: string,
  action: NonNullable<CliInteractionContribution["action"]>,
  targetKind: NonNullable<CliInteractionContribution["targetKind"]>,
  options: {
    readonly sequence?: readonly string[];
    readonly namespace?: string;
    readonly description?: string;
  } = {}
): CliInteractionContribution {
  return {
    id,
    kind: "keymap",
    source: "core",
    action,
    targetKind,
    ...(options.namespace ? { namespace: options.namespace } : {}),
    conflictGroup: `${mode}:${keyName}`,
    ...(options.description ? { previewText: options.description } : {}),
    keymap: {
      id,
      mode,
      key: keyName,
      action,
      targetKind,
      ...(options.sequence ? { sequence: options.sequence } : {}),
      ...(options.namespace ? { namespace: options.namespace } : {}),
      conflictGroup: `${mode}:${keyName}`,
      ...(options.description ? { description: options.description, preview: options.description } : {})
    }
  };
}

function panelNavigation(mode: Extract<CliInteractionMode, "transcript" | "reasoning-inspector" | "plugin-inspector" | "activity-feed">): readonly CliInteractionContribution[] {
  const prefix = mode.replace(/-/g, ".");
  return [
    key(`vi.pro.${prefix}.down`, mode, "j", "scroll", "panel", { description: `Scroll ${mode} down.` }),
    key(`vi.pro.${prefix}.up`, mode, "k", "scroll", "panel", { description: `Scroll ${mode} up.` }),
    key(`vi.pro.${prefix}.page-down`, mode, "Ctrl+d", "scroll", "panel", { description: `Page ${mode} down.` }),
    key(`vi.pro.${prefix}.page-up`, mode, "Ctrl+u", "scroll", "panel", { description: `Page ${mode} up.` }),
    key(`vi.pro.${prefix}.search`, mode, "/", "search", "command", { description: "Open search." }),
    key(`vi.pro.${prefix}.command`, mode, ":", "inspect", "command", { description: "Open command bar." })
  ];
}
