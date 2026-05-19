import { defineBundledPlugin } from "../../shared/define-builtin-plugin.js";
import { commands } from "./contributions/commands.js";
import { keymaps, paletteEntries, rendererHints, resultListProviders } from "./contributions/tui.js";
import { reasoningContributions } from "./contributions/reasoning.js";

export const jumpNavigatorPlugin = defineBundledPlugin({
  id: "@deepseek/plugin-jump-navigator",
  name: "Jump Navigator",
  version: "0.1.0",
  integrity: "sha256:ff8f6172a95f5e64c48985deebf56fb68dd3f0d4878c1b4bcddfa930f64da33b",
  permissions: ["workspace:read", "index:read"],
  commands,
  paletteEntries,
  resultListProviders,
  keymaps,
  rendererHints,
  reasoningContributions,
  metadata: { releaseScope: "R1", symbolRoute: "deferred" }
});
