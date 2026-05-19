import { keymap, paletteEntry, rendererHint, resultListProvider } from "@deepseek/plugin-api";

export const paletteEntries = [
  paletteEntry({ id: "repo-navigator", title: "Repo Navigator", category: "repo", targetKind: "plugin-command" })
] as const;

export const resultListProviders = [
  resultListProvider({ id: "repo-results", targetKinds: ["workspace-file", "grep-match", "pageindex-turn", "project-index-ref"] })
] as const;

export const keymaps = [
  keymap({ id: "repo.search", mode: "normal", key: "Space f", sequence: ["Space", "f"], action: "search", targetKind: "command", namespace: "repo", helpText: "Open repo search actions.", previewText: "Repo search stays behind command-system descriptors." }),
  keymap({ id: "repo.leader", mode: "normal", key: "Space r", sequence: ["Space", "r"], action: "plugin-action", targetKind: "plugin-contribution", namespace: "repo", helpText: "Open repo navigator plugin actions.", previewText: "Repo navigator plugin actions route through read-only search/index contracts." })
] as const;

export const rendererHints = [
  rendererHint({ id: "repo.result-list", host: "cli-tui", placement: "palette" })
] as const;
