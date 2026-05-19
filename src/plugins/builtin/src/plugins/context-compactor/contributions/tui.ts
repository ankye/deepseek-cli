import { keymap, paletteEntry, rendererHint, resultListProvider } from "@deepseek/plugin-api";

export const paletteEntries = [
  paletteEntry({ id: "context", title: "Context Compactor", category: "context", targetKind: "plugin-command" })
] as const;

export const resultListProviders = [
  resultListProvider({ id: "context-results", targetKinds: ["lossless-node", "summary-node", "context-budget", "context-pin"] })
] as const;

export const keymaps = [
  keymap({ id: "context.expand", mode: "result-list", key: "x", action: "expand", targetKind: "result-list-item", namespace: "context" }),
  keymap({ id: "context.leader", mode: "normal", key: "Space c", sequence: ["Space", "c"], action: "plugin-action", targetKind: "plugin-contribution", namespace: "context", helpText: "Open context plugin actions.", previewText: "Context plugin actions route through shared context commands." })
] as const;

export const rendererHints = [
  rendererHint({ id: "context.status-line", host: "cli-tui", placement: "status" })
] as const;
