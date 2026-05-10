import type { EvolutionEngine, FeatureGate, JsonObject, MigrationRecord } from "@deepseek/platform-contracts";

export class InMemoryEvolutionEngine implements EvolutionEngine {
  private readonly gates = new Map<string, FeatureGate>();
  private readonly migrations: MigrationRecord[] = [];

  async isEnabled(gate: string): Promise<boolean> {
    return this.gates.get(gate)?.enabled ?? false;
  }

  async setGate(gate: FeatureGate): Promise<void> {
    this.gates.set(gate.name, gate);
  }

  async checkCompatibility(subject: JsonObject): Promise<readonly string[]> {
    return typeof subject.schemaVersion === "string" ? [] : ["missing schemaVersion"];
  }

  async recordMigration(record: MigrationRecord): Promise<void> {
    this.migrations.push(record);
  }
}
