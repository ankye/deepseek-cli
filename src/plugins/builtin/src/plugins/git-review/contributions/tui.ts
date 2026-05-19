import { keymap, paletteEntry, rendererHint, resultListProvider } from "@deepseek/plugin-api";

export const paletteEntries = [
  paletteEntry({ id: "git-review", title: "Git Review", category: "git", targetKind: "plugin-command" })
] as const;

export const resultListProviders = [
  resultListProvider({ id: "git-review-results", targetKinds: ["git-file", "git-hunk", "git-diagnostic"] })
] as const;

export const keymaps = [
  keymap({ id: "git.leader", mode: "normal", key: "Space g", sequence: ["Space", "g"], action: "plugin-action", targetKind: "plugin-contribution", namespace: "git", helpText: "Open git review plugin actions.", previewText: "Git review plugin actions are read-only descriptors." })
] as const;

export const rendererHints = [
  rendererHint({ id: "git.review.summary", host: "cli-tui", placement: "status" })
] as const;
