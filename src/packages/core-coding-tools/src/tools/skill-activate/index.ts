import type {
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  SerializableResult,
  SkillSystem
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps } from "../../shared/workspace.js";

export interface SkillActivateToolDeps extends CoreCodingToolsDependencies {
  readonly skills?: SkillSystem;
}

interface SkillActivateInput extends JsonObject {
  readonly name: string;
  readonly context?: JsonObject;
}

export function defineSkillActivateTool(deps: SkillActivateToolDeps | undefined) {
  return defineToolManifest(
    "skill.activate",
    coreToolIds.skillActivate,
    "Skill Activate",
    "process",
    ["skill:activate"],
    objectSchema(["name"], { name: { type: "string" }, context: { type: "object" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => skillActivateTool(input, context, ready as SkillActivateToolDeps))
  );
}

async function skillActivateTool(input: JsonObject, context: CapabilityExecutionContext, deps: SkillActivateToolDeps): Promise<SerializableResult<CoreToolResult>> {
  if (!deps.skills) {
    return failure("skill.activate", "SKILL_SYSTEM_UNAVAILABLE", "No SkillSystem registered in runtime dependencies.", []);
  }
  const parsed = input as SkillActivateInput;
  if (!parsed.name) {
    return failure("skill.activate", "SKILL_NAME_REQUIRED", "skill.activate requires a name.", []);
  }
  try {
    const sessionId = context.envelope.sessionId;
    const activator = deps.skills as { activateSkill: SkillSystem["activateSkill"] };
    const result = await activator.activateSkill({
      schemaVersion: "1.0.0",
      name: parsed.name,
      trigger: "explicit",
      context: parsed.context ?? {},
      ...(sessionId ? { sessionId } : {})
    });
    if (result.status === "not-found") {
      return failure("skill.activate", "SKILL_NOT_FOUND", `skill not registered: ${parsed.name}`, [parsed.name]);
    }
    const segmentCount = result.contextSegments.length;
    const estimatedTokens = result.contextSegments.reduce((acc, segment) => acc + segment.estimatedTokens, 0);
    const preview = `skill=${parsed.name} status=${result.status} segments=${segmentCount} tokens~=${estimatedTokens}`;
    return success("skill.activate", [parsed.name], {
      preview: boundedText(preview, 1_000),
      metadata: {
        status: result.status,
        name: parsed.name,
        segmentCount,
        loadingState: result.loadingState,
        estimatedTokens,
        diagnostics: result.diagnostics as unknown as JsonObject
      },
      replay: replay(context),
      status: result.status === "activated" ? "completed" : "failed"
    });
  } catch (error) {
    return failure("skill.activate", "SKILL_ACTIVATE_FAILED", error instanceof Error ? error.message : "skill.activate failed.", [parsed.name]);
  }
}
