import { keymap, paletteEntry, rendererHint, resultListProvider } from "@deepseek/plugin-api";

export const paletteEntries = [
  paletteEntry({ id: "file-manager", title: "File Manager", category: "files", targetKind: "plugin-command" })
] as const;

export const resultListProviders = [
  resultListProvider({ id: "file-manager-results", targetKinds: ["workspace-file", "file-preview", "reference-target"] })
] as const;

export const keymaps = [
  keymap({ id: "file.manager", mode: "normal", key: "Space e", sequence: ["Space", "e"], action: "plugin-action", targetKind: "plugin-contribution", namespace: "files", helpText: "Open file manager plugin actions.", previewText: "File manager routes read-only file workflows through host-owned adapters." }),
  keymap({ id: "file.preview", mode: "result-list", key: "p", action: "preview", targetKind: "file", namespace: "files", helpText: "Preview the active file target.", previewText: "Preview stays read-only and host-owned." })
] as const;

export const rendererHints = [
  rendererHint({ id: "file-manager.result-list", host: "cli-tui", placement: "palette" })
] as const;
