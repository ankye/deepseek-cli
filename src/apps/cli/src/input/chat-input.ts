import { rawInputEventToKeyName } from "@deepseek/command-system";
import type { CliRawInputEvent } from "@deepseek/platform-contracts";
import type { CliInputStream } from "../types.js";
import type { CliInputStrategy } from "../host/terminal-profile.js";
import { readCliLines } from "./lines.js";
import { readCliRawInputEvents } from "./raw-keys.js";

export interface CliLocalInputContext {
  readonly pending: string;
}

export interface CliLocalInputDispatchOutcome {
  readonly handled: boolean;
  readonly insertText?: string;
  readonly submitText?: string;
}

export type CliLocalInputDispatchResult = boolean | CliLocalInputDispatchOutcome;
export type CliLocalInputDispatch = (event: CliRawInputEvent, context: CliLocalInputContext) => CliLocalInputDispatchResult;

export async function* readCliChatPrompts(
  input: CliInputStream,
  strategy: CliInputStrategy,
  dispatchLocalInput?: CliLocalInputDispatch
): AsyncIterable<string> {
  if (strategy !== "raw") {
    yield* readCliLines(input, strategy);
    return;
  }
  let pending = "";
  for await (const event of readCliRawInputEvents(input)) {
    const key = rawInputEventToKeyName(event);
    if (!key) continue;
    const local = dispatchLocalInput?.(event, { pending });
    if (typeof local === "object") {
      if (local.submitText !== undefined) {
        yield local.submitText;
        pending = "";
        continue;
      }
      if (local.insertText !== undefined) pending = local.insertText;
      if (local.handled) continue;
    } else if (local) {
      continue;
    }
    if (key === "Enter") {
      yield pending;
      pending = "";
      continue;
    }
    if (key === "Backspace") {
      pending = pending.slice(0, -1);
      continue;
    }
    if (event.text) pending += event.text;
  }
  if (pending.length > 0) yield pending;
}
