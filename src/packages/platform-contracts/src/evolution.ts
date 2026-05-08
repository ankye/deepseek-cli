import type { JsonObject } from "./common.js";

export interface FeatureGate {
  readonly name: string;
  readonly enabled: boolean;
  readonly owner: string;
}

export interface MigrationRecord {
  readonly id: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly reversible: boolean;
}

export interface EvolutionEngine {
  isEnabled(gate: string): Promise<boolean>;
  setGate(gate: FeatureGate): Promise<void>;
  checkCompatibility(subject: JsonObject): Promise<readonly string[]>;
  recordMigration(record: MigrationRecord): Promise<void>;
}
