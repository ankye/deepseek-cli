import { keymap, paletteEntry, rendererHint, resultListProvider } from "@deepseek/plugin-api";

export const paletteEntries = [
  paletteEntry({ id: "jump-navigator", title: "Jump Navigator", category: "jump", targetKind: "plugin-command" })
] as const;

export const resultListProviders = [
  resultListProvider({ id: "jump-navigator-results", targetKinds: ["workspace-file", "grep-match", "symbol"] })
] as const;

export const keymaps = [
  keymap({ id: "jump.open", mode: "normal", key: "Space j", sequence: ["Space", "j"], action: "plugin-action", targetKind: "plugin-contribution", namespace: "jump", helpText: "Open jump navigator plugin actions.", previewText: "Jump navigator routes quick file/text jumps through host-owned adapters." }),
  keymap({ id: "jump.next", mode: "result-list", key: "o", action: "open", targetKind: "result-list-item", namespace: "jump", helpText: "Open the active jump target.", previewText: "Jump target activation stays local to the TUI workbench." })
] as const;

export const rendererHints = [
  rendererHint({ id: "jump-navigator.result-list", host: "cli-tui", placement: "palette" })
] as const;
