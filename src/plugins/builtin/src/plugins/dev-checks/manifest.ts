import { defineBundledPlugin } from "../../shared/define-builtin-plugin.js";
import { commands } from "./contributions/commands.js";
import { keymaps, paletteEntries, rendererHints, resultListProviders } from "./contributions/tui.js";
import { reasoningContributions } from "./contributions/reasoning.js";

export const devChecksPlugin = defineBundledPlugin({
  id: "@deepseek/plugin-dev-checks",
  name: "Dev Checks",
  version: "0.1.0",
  integrity: "sha256:75db8c9ad03d3430d7e97a7458c178a55de2697c3f340fd974537f57de49cc12",
  permissions: ["process:predeclared", "workspace:read", "diagnostics:write"],
  commands,
  paletteEntries,
  resultListProviders,
  keymaps,
  rendererHints,
  reasoningContributions,
  metadata: { releaseScope: "R1", acceptsFreeFormShell: false }
});
