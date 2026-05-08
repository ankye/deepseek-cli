import type { JsonObject } from "./common.js";
import type { PluginId } from "./ids.js";

export interface PermissionDiff {
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

export interface PluginManifest {
  readonly id: PluginId;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly integrity: string;
  readonly permissions: readonly string[];
  readonly contributions: JsonObject;
}

export interface PluginManager {
  install(manifest: PluginManifest): Promise<PermissionDiff>;
  uninstall(id: PluginId): Promise<void>;
  list(): Promise<readonly PluginManifest[]>;
}
