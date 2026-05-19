import { defineBundledPlugin } from "../../shared/define-builtin-plugin.js";
import { commands } from "./contributions/commands.js";
import { keymaps, paletteEntries, rendererHints, resultListProviders } from "./contributions/tui.js";
import { reasoningContributions } from "./contributions/reasoning.js";

export const fileManagerPlugin = defineBundledPlugin({
  id: "@deepseek/plugin-file-manager",
  name: "File Manager",
  version: "0.1.0",
  integrity: "sha256:13d0a2c14e96a65d118b994f2ff78f4a43b125f6f0e0b399a119d305842de314",
  permissions: ["workspace:read"],
  commands,
  paletteEntries,
  resultListProviders,
  keymaps,
  rendererHints,
  reasoningContributions,
  metadata: { releaseScope: "R1", readOnly: true }
});
