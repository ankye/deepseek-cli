import { defineBundledPlugin } from "../../shared/define-builtin-plugin.js";
import { commands } from "./contributions/commands.js";
import { keymaps, paletteEntries, rendererHints, resultListProviders } from "./contributions/tui.js";
import { reasoningContributions } from "./contributions/reasoning.js";

export const contextCompactorPlugin = defineBundledPlugin({
  id: "@deepseek/plugin-context-compactor",
  name: "Context Compactor",
  version: "0.1.0",
  integrity: "sha256:242ce336ab9b6e831ffaf5f7a3c8c55a6f7a932ba2f47a5887b27fce85b36d88",
  permissions: ["context:lcm:read", "context:lcm:write", "context:summary", "palette:references:write"],
  commands,
  paletteEntries,
  resultListProviders,
  keymaps,
  rendererHints,
  reasoningContributions,
  metadata: { releaseScope: "R1", compactMode: "lossless", automaticPermanentMemoryWrites: false }
});
