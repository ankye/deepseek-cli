import { keymap, paletteEntry, rendererHint, resultListProvider } from "@deepseek/plugin-api";

export const paletteEntries = [
  paletteEntry({ id: "checks", title: "Dev Checks", category: "checks", targetKind: "plugin-command" })
] as const;

export const resultListProviders = [
  resultListProvider({ id: "check-results", targetKinds: ["check-command", "check-diagnostic"] })
] as const;

export const keymaps = [
  keymap({ id: "dev-checks.leader", mode: "normal", key: "Space v", sequence: ["Space", "v"], action: "plugin-action", targetKind: "plugin-contribution", namespace: "checks", helpText: "Open verification plugin actions.", previewText: "Dev check plugin actions route through checks commands." })
] as const;

export const rendererHints = [
  rendererHint({ id: "checks.summary", host: "cli-tui", placement: "diagnostics" })
] as const;
