import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { JsonObject, ModelGateway, ModelRequest, ModelStreamEvent, SkillManifest } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";
import { defaultDeepSeekProfile } from "@deepseek/model-gateway";

class SingleToolThenFinishModelGateway implements ModelGateway {
  constructor(private readonly toolName: string, private readonly input: JsonObject) {}
  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    if (request.messages?.some((message) => message.role === "tool")) {
      yield { kind: "delta", text: "done" };
      yield { kind: "finish", reason: "stop" };
      yield { kind: "done" };
      return;
    }
    yield { kind: "tool-call", id: "call-skill-test", name: this.toolName, input: this.input };
    yield { kind: "finish", reason: "tool-call" };
    yield { kind: "done" };
  }
  async countTokens(text: string): Promise<number> {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}

function skillManifest(overrides: Partial<SkillManifest> & Pick<SkillManifest, "id" | "name">): SkillManifest {
  return {
    version: "1.0.0",
    source: "built-in",
    trust: "trusted",
    activation: [overrides.name],
    executionModes: ["context"],
    permissions: [],
    metadata: { instructions: [`Use ${overrides.name} when relevant.`] },
    ...overrides
  } as SkillManifest;
}

describe("skill tools wiring", () => {
  it("skill.list returns count:0 when no skills are registered", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const loopDeps = { ...deps, models: new SingleToolThenFinishModelGateway("core.skill.list", {}) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "list skills",
      caller: "skill.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits: { maxModelIterations: 2 }
    }));

    const completed = events.find((event) => event.kind === "capability.completed" && (event.data as { capabilityId?: string }).capabilityId === "core.skill.list");
    assert.ok(completed, "core.skill.list capability.completed event must be present");
    const output = (completed!.data as { output?: { evidence?: { metadata?: { count?: number; skills?: unknown } } } }).output;
    assert.equal(output?.evidence?.metadata?.count, 0);
    assert.deepEqual(output?.evidence?.metadata?.skills, []);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("skill.list returns registered skills sorted by manifest.name", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.skills.registerSkill(skillManifest({ id: asId<"skill">("zebra"), name: "zebra-skill" }));
    await deps.skills.registerSkill(skillManifest({ id: asId<"skill">("alpha"), name: "alpha-skill" }));
    const loopDeps = { ...deps, models: new SingleToolThenFinishModelGateway("core.skill.list", {}) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "list skills",
      caller: "skill.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits: { maxModelIterations: 2 }
    }));

    const completed = events.find((event) => event.kind === "capability.completed" && (event.data as { capabilityId?: string }).capabilityId === "core.skill.list");
    assert.ok(completed);
    const output = (completed!.data as { output?: { evidence?: { metadata?: { count?: number; skills?: readonly { name: string }[] } } } }).output;
    assert.equal(output?.evidence?.metadata?.count, 2);
    const names = (output?.evidence?.metadata?.skills ?? []).map((item) => item.name);
    assert.deepEqual(names, ["alpha-skill", "zebra-skill"]);
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("skill.activate on a registered skill emits skill.activated runtime event", async () => {
    const deps = createDeterministicRuntimeDependencies();
    await deps.skills.registerSkill(skillManifest({ id: asId<"skill">("activateme"), name: "activate-me" }));
    const loopDeps = { ...deps, models: new SingleToolThenFinishModelGateway("core.skill.activate", { name: "activate-me" }) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "activate skill",
      caller: "skill.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits: { maxModelIterations: 2 }
    }));

    const activated = events.find((event) => event.kind === "skill.activated");
    assert.ok(activated, "skill.activated event must be emitted after successful activation");
    const payload = activated!.data as { name?: string; status?: string; segmentCount?: number; loadingState?: string };
    assert.equal(payload.name, "activate-me");
    assert.equal(payload.status, "activated");
    assert.equal(payload.loadingState, "loaded");
    assert.equal(typeof payload.segmentCount, "number");
    assert.equal(events.at(-1)?.kind, "agent.loop.completed");
    await kernel.shutdown();
  });

  it("skill.activate on an unregistered skill returns SKILL_NOT_FOUND and does not emit skill.activated", async () => {
    const deps = createDeterministicRuntimeDependencies();
    const loopDeps = { ...deps, models: new SingleToolThenFinishModelGateway("core.skill.activate", { name: "ghost-skill" }) };
    await registerRuntimeCoreTools(loopDeps, "/workspace");
    const kernel = await createDefaultRuntimeKernel(loopDeps);
    const events = await collectRuntimeEvents(runAgentLoop(loopDeps, kernel, {
      prompt: "activate missing",
      caller: "skill.test",
      workspaceRoot: "/workspace",
      outputMode: "jsonl",
      profile: defaultDeepSeekProfile,
      limits: { maxModelIterations: 2 }
    }));

    assert.equal(events.some((event) => event.kind === "skill.activated"), false, "skill.activated must not be emitted for unregistered skills");
    const failed = events.find((event) => event.kind === "capability.failed" && (event.data as { capabilityId?: string }).capabilityId === "core.skill.activate");
    const resultEvent = events.find((event) => event.kind === "model.tool.result");
    const feedback = resultEvent?.data.feedback as { status?: string } | undefined;
    const hasNotFound = Boolean(failed) || feedback?.status === "rejected" || feedback?.status === "denied" || feedback?.status === "failed";
    assert.equal(hasNotFound, true, "skill.activate against unregistered skill must surface a failure");
    const terminalKind = events.at(-1)?.kind;
    assert.ok(terminalKind === "agent.loop.failed" || terminalKind === "agent.loop.completed", `unexpected terminal event: ${terminalKind}`);
    await kernel.shutdown();
  });
});
