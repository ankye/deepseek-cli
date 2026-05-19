import type { DefineBuiltinPluginInput, PluginManifest } from "@deepseek/plugin-api";
import { defineBuiltinPlugin as definePluginBuiltin } from "@deepseek/plugin-api";
import { FIRST_PARTY_DEV_PLUGIN_PACK_ID } from "./constants.js";

export function defineBundledPlugin(input: Omit<DefineBuiltinPluginInput, "packId">): PluginManifest {
  return definePluginBuiltin({ ...input, packId: FIRST_PARTY_DEV_PLUGIN_PACK_ID });
}
