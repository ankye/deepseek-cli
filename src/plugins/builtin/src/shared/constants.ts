export const FIRST_PARTY_DEV_PLUGIN_PACK_ID = "deepseek.first-party-dev-plugins";
export const FIRST_PARTY_DEV_PLUGIN_PACK_VERSION = "1.0.0";
export const FIRST_PARTY_PLUGIN_MANIFEST_BOUNDARY_PIT = "pit.legacy-contribution-normalization.manifest-boundary";
export const FIRST_PARTY_PLUGIN_PERMISSION_DIFF_PIT = "pit.extension-permission-expansion.permission-diff";

export const FIRST_PARTY_DEV_PLUGIN_IDS = [
  "@deepseek/plugin-context-compactor",
  "@deepseek/plugin-dev-checks",
  "@deepseek/plugin-file-manager",
  "@deepseek/plugin-git-review",
  "@deepseek/plugin-jump-navigator",
  "@deepseek/plugin-repo-navigator"
] as const;

export type FirstPartyDevPluginId = (typeof FIRST_PARTY_DEV_PLUGIN_IDS)[number];
