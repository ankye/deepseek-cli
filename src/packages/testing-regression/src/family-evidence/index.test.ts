import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TOOL_FAMILY_IDS } from "@deepseek/platform-contracts";
import { createToolFamilyEvidenceCatalog } from "./index.js";

describe("tool family evaluation evidence fixtures", () => {
  it("maps all 64 first-version families to representative task and coverage evidence", () => {
    const catalog = createToolFamilyEvidenceCatalog();
    const taskFamilies = new Set(catalog.taskEvidence.flatMap((evidence) => evidence.requiredFamilyIds));
    const coverageFamilies = new Set(catalog.coverageEvidence.map((evidence) => evidence.familyId));

    assert.equal(catalog.taskEvidence.length, TOOL_FAMILY_IDS.length);
    assert.equal(catalog.coverageEvidence.length, TOOL_FAMILY_IDS.length);
    assert.equal(TOOL_FAMILY_IDS.every((familyId) => taskFamilies.has(familyId)), true);
    assert.equal(TOOL_FAMILY_IDS.every((familyId) => coverageFamilies.has(familyId)), true);
  });

  it("records fake-first representative evidence without package-gap credit", () => {
    const catalog = createToolFamilyEvidenceCatalog();
    const memory = catalog.taskEvidence.find((evidence) => evidence.requiredFamilyIds.includes("memory.read-write"));
    const remote = catalog.coverageEvidence.find((evidence) => evidence.familyId === "remote.runtime");
    const schedule = catalog.coverageEvidence.find((evidence) => evidence.familyId === "schedule.sleep-cron");
    const context = catalog.coverageEvidence.find((evidence) => evidence.familyId === "context.project-index");

    assert.equal(memory?.outcome, "solved");
    assert.deepEqual(memory?.usedFamilyIds, ["memory.read-write"]);
    assert.equal(context?.evidenceMode, "fake");
    assert.equal(context?.providerNativeSupport, "not_applicable");
    assert.equal(remote?.providerNativeSupport, "connector");
    assert.equal(remote?.packageGap, undefined);
    assert.equal(schedule?.providerNativeSupport, "not_applicable");
    assert.equal(catalog.packageGaps.length, 0);
  });
});
