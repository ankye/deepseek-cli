import type { JsonObject } from "./common.js";
import type { SkillId } from "./ids.js";
import type { TrustStatus } from "./capability.js";

export interface SkillManifest {
  readonly id: SkillId;
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly trust: TrustStatus;
  readonly activation: readonly string[];
  readonly executionModes: readonly string[];
  readonly permissions: readonly string[];
  readonly metadata?: JsonObject;
}

export interface SkillSystem {
  register(manifest: SkillManifest): Promise<void>;
  activate(name: string, context: JsonObject): Promise<SkillManifest | undefined>;
  list(): Promise<readonly SkillManifest[]>;
}
