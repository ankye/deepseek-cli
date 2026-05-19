import { defineBundledPlugin } from "../../shared/define-builtin-plugin.js";
import { commands } from "./contributions/commands.js";
import { keymaps, paletteEntries, rendererHints, resultListProviders } from "./contributions/tui.js";
import { reasoningContributions } from "./contributions/reasoning.js";

export const gitReviewPlugin = defineBundledPlugin({
  id: "@deepseek/plugin-git-review",
  name: "Git Review",
  version: "0.1.0",
  integrity: "sha256:42d1653f2ce7b9680d15a2038c3ca944611a7b1c9cf0b8b1d7e3491e9f9f437e",
  permissions: ["git:read", "workspace:read"],
  commands,
  paletteEntries,
  resultListProviders,
  keymaps,
  rendererHints,
  reasoningContributions,
  metadata: { releaseScope: "R1", destructiveOperations: false }
});
