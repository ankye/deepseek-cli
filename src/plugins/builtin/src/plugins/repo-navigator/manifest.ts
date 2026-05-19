import { defineBundledPlugin } from "../../shared/define-builtin-plugin.js";
import { commands } from "./contributions/commands.js";
import { keymaps, paletteEntries, rendererHints, resultListProviders } from "./contributions/tui.js";
import { reasoningContributions } from "./contributions/reasoning.js";

export const repoNavigatorPlugin = defineBundledPlugin({
  id: "@deepseek/plugin-repo-navigator",
  name: "Repo Navigator",
  version: "0.1.0",
  integrity: "sha256:b125b76eed918bb45007892a8828f364fb75ca9bc8ef15e12d920d822533681c",
  permissions: ["workspace:read", "index:read", "pageindex:read"],
  commands,
  paletteEntries,
  resultListProviders,
  keymaps,
  rendererHints,
  reasoningContributions,
  metadata: { releaseScope: "R1", usesExistingSearchBoundaries: true }
});
