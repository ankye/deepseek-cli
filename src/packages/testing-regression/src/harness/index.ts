import type { GoldenTrace, JsonObject, RegressionHarness, ReplayResult } from "@deepseek/platform-contracts";

export class DeterministicRegressionHarness implements RegressionHarness {
  async normalize(trace: GoldenTrace): Promise<GoldenTrace> {
    return {
      ...trace,
      protocol: [...trace.protocol],
      bus: [...trace.bus],
      runtime: [...trace.runtime],
      sessions: [...trace.sessions]
    };
  }

  async replay(trace: GoldenTrace): Promise<ReplayResult> {
    const failures: string[] = [];
    if (!trace.name) failures.push("missing trace name");
    if (trace.runtime.length === 0) failures.push("runtime trace is empty");
    return { ok: failures.length === 0, failures };
  }

  async assertSemantic(trace: GoldenTrace, assertion: JsonObject): Promise<ReplayResult> {
    const expectedKind = assertion.expectedKind;
    if (typeof expectedKind === "string" && !trace.runtime.some((event) => event.kind === expectedKind)) {
      return { ok: false, failures: [`missing runtime event kind ${expectedKind}`] };
    }
    return { ok: true, failures: [] };
  }
}
