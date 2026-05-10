import type {
  CapabilityExecutionContext,
  CoreToolResult,
  JsonObject,
  PlanItemStatus,
  SerializableResult,
  TodoPlanInput
} from "@deepseek/platform-contracts";
import { boundedText, defineToolManifest, failure, objectSchema, replay, success } from "../../shared/tool-kit.js";
import { coreToolIds } from "../../shared/ids.js";

const validStatuses: ReadonlySet<PlanItemStatus> = new Set(["pending", "in_progress", "completed", "blocked"]);

export function defineTodoPlanTool() {
  return defineToolManifest(
    "todo.plan",
    coreToolIds.todoPlan,
    "Todo Plan",
    "none",
    [],
    objectSchema(["items"], { items: { type: "array" } }),
    objectSchema(["evidence"], { evidence: { type: "object" } }),
    (input, context) => planTool(input, context)
  );
}

async function planTool(input: JsonObject, context: CapabilityExecutionContext): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as TodoPlanInput;
  const invalid = parsed.items.filter((item) => !validStatuses.has(item.status));
  if (invalid.length > 0) return failure("todo.plan", "PLAN_STATUS_INVALID", "Plan contains invalid status values.", []);
  return success("todo.plan", [], {
    preview: boundedText(parsed.items.map((item) => `${item.status}: ${item.title}`).join("\n"), 8_000),
    metadata: { items: parsed.items, count: parsed.items.length },
    replay: replay(context)
  });
}
