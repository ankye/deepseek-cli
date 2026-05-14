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
  const parsed = normalizeTodoPlanInput(input);
  const invalid = parsed.items.filter((item) => !validStatuses.has(item.status));
  if (invalid.length > 0) return failure("todo.plan", "PLAN_STATUS_INVALID", "Plan contains invalid status values.", []);
  return success("todo.plan", [], {
    preview: boundedText(parsed.items.map((item) => `${item.status}: ${item.title}`).join("\n"), 8_000),
    metadata: { items: parsed.items, count: parsed.items.length },
    replay: replay(context)
  });
}

function normalizeTodoPlanInput(input: JsonObject): TodoPlanInput {
  const rawItems = Array.isArray(input.items) ? input.items : [];
  return {
    items: rawItems.map((item, index) => {
      const record = isJsonObject(item) ? item : {};
      const status = normalizeStatus(record.status, record.done);
      const title = typeof record.title === "string" && record.title.trim().length > 0
        ? record.title
        : typeof record.description === "string" && record.description.trim().length > 0
          ? record.description
          : `Step ${index + 1}`;
      return {
        id: typeof record.id === "string" && record.id.trim().length > 0 ? record.id : String(index + 1),
        title,
        status
      };
    })
  };
}

function normalizeStatus(status: unknown, done: unknown): PlanItemStatus {
  if (typeof status === "string" && validStatuses.has(status as PlanItemStatus)) return status as PlanItemStatus;
  if (done === true) return "completed";
  if (done === false) return "pending";
  return "pending";
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
