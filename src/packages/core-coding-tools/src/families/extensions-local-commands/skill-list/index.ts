import type {
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SerializableResult,
  SkillSystem
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../../shared/tool-kit.js";
import { coreToolIds } from "../../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../../shared/workspace.js";
import { requireDeps } from "../../../shared/workspace.js";

export interface SkillListToolDeps extends CoreCodingToolsDependencies {
  readonly skills?: SkillSystem;
}

export function defineSkillListTool(deps: SkillListToolDeps | undefined) {
  return defineToolManifest(
    "skill.list",
    coreToolIds.skillList,
    "Skill List",
    "read",
    ["skill:read"],
    objectSchema([], {}),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => skillListTool(input, context, ready as SkillListToolDeps))
  );
}

async function skillListTool(_input: JsonObject, context: CapabilityExecutionContext, deps: SkillListToolDeps): Promise<SerializableResult<CoreToolResult>> {
  if (!deps.skills) {
    return failure("skill.list", "SKILL_SYSTEM_UNAVAILABLE", "No SkillSystem registered in runtime dependencies.", []);
  }
  try {
    const summaries = await deps.skills.listSummaries();
    const compact = summaries.map((summary) => ({
      id: String(summary.id),
      name: summary.name,
      version: summary.version,
      trust: summary.trust,
      loadingState: summary.loadingState
    }));
    const preview = compact.map((item) => `${item.trust === "trusted" ? "[trusted]" : `[${item.trust}]`} ${item.name}@${item.version} (${item.loadingState})`).join("\n");
    return success("skill.list", compact.map((item) => item.id), {
      preview: boundedText(preview, 8_000),
      metadata: { count: compact.length, skills: compact as unknown as JsonObject },
      replay: replay(context)
    });
  } catch (error) {
    return failure("skill.list", "SKILL_LIST_FAILED", error instanceof Error ? error.message : "skill.list failed.", []);
  }
}
