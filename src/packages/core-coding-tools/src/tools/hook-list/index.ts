import type {
  CapabilityExecutionContext,
  CoreToolResult,
  HookLifecyclePoint,
  HookSystem,
  JsonObject,
  SerializableResult
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";
import type { CoreCodingToolsDependencies } from "../../shared/workspace.js";
import { requireDeps } from "../../shared/workspace.js";

export interface HookListToolDeps extends CoreCodingToolsDependencies {
  readonly hooks?: HookSystem;
}

interface HookListInput extends JsonObject {
  readonly point?: HookLifecyclePoint;
  readonly limit?: number;
}

export function defineHookListTool(deps: HookListToolDeps | undefined) {
  return defineToolManifest(
    "hook.list",
    coreToolIds.hookList,
    "Hook List",
    "read",
    ["hook:read"],
    objectSchema([], { point: { type: "string" }, limit: { type: "number" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => requireDeps(deps).then((ready) => hookListTool(input, context, ready as HookListToolDeps))
  );
}

async function hookListTool(input: JsonObject, context: CapabilityExecutionContext, deps: HookListToolDeps): Promise<SerializableResult<CoreToolResult>> {
  if (!deps.hooks) {
    return failure("hook.list", "HOOK_SYSTEM_UNAVAILABLE", "No HookSystem registered in runtime dependencies.", []);
  }
  const parsed = input as HookListInput;
  try {
    const summaries = parsed.point
      ? await deps.hooks.listHooks(parsed.point)
      : await deps.hooks.listHooks();
    const limit = parsed.limit ?? 200;
    const sliced = summaries.slice(0, limit);
    const preview = sliced.map((summary) => `[${summary.point}] priority=${summary.ordering?.priority ?? 0} ${summary.name}`).join("\n");
    return success("hook.list", sliced.map((summary) => String(summary.id)), {
      preview: boundedText(preview, 8_000),
      metadata: { count: sliced.length, hooks: sliced as unknown as JsonObject },
      replay: replay(context)
    });
  } catch (error) {
    return failure("hook.list", "HOOK_LIST_FAILED", error instanceof Error ? error.message : "Hook list failed.", []);
  }
}
