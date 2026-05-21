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
export interface CliRawPromptUpdate {
  readonly pending: string;
  readonly key: string;
  readonly handledLocally: boolean;
  readonly submitted: boolean;
}
export type CliRawPromptUpdateHandler = (update: CliRawPromptUpdate) => void | Promise<void>;

export async function* readCliChatPrompts(
  input: CliInputStream,
  strategy: CliInputStrategy,
  dispatchLocalInput?: CliLocalInputDispatch,
  onRawPromptUpdate?: CliRawPromptUpdateHandler
): AsyncIterable<string> {
  if (strategy !== "raw") {
    yield* readCliLines(input, strategy);
    return;
  }
  let pending = "";
  let bracketedPaste = false;
  for await (const event of readCliRawInputEvents(input)) {
    if (event.kind === "paste-start") {
      bracketedPaste = true;
      await onRawPromptUpdate?.({ pending, key: "PasteStart", handledLocally: true, submitted: false });
      continue;
    }
    if (event.kind === "paste-end") {
      bracketedPaste = false;
      await onRawPromptUpdate?.({ pending, key: "PasteEnd", handledLocally: true, submitted: false });
      continue;
    }
    const key = rawInputEventToKeyName(event);
    if (!key) continue;
    if (bracketedPaste) {
      if (key === "Enter") pending += "\n";
      else if (key === "Tab") pending += "\t";
      else if (key === "Escape") pending += "\x1b";
      else if (event.text) pending += event.text;
      await onRawPromptUpdate?.({ pending, key, handledLocally: false, submitted: false });
      continue;
    }
    const local = dispatchLocalInput?.(event, { pending });
    if (typeof local === "object") {
      if (local.submitText !== undefined) {
        pending = "";
        await onRawPromptUpdate?.({ pending, key, handledLocally: true, submitted: true });
        yield local.submitText;
        continue;
      }
      if (local.insertText !== undefined) pending = local.insertText;
      if (local.handled || ("ok" in local) || ("kind" in local)) {
        await onRawPromptUpdate?.({ pending, key, handledLocally: true, submitted: false });
        continue;
      }
    } else if (local) {
      await onRawPromptUpdate?.({ pending, key, handledLocally: true, submitted: false });
      continue;
    }
    if (key === "Enter") {
      const submitted = pending;
      pending = "";
      await onRawPromptUpdate?.({ pending, key, handledLocally: false, submitted: true });
      yield submitted;
      continue;
    }
    if (key === "Backspace") {
      pending = pending.slice(0, -1);
      await onRawPromptUpdate?.({ pending, key, handledLocally: false, submitted: false });
      continue;
    }
    if (event.text) {
      pending += event.text;
      await onRawPromptUpdate?.({ pending, key, handledLocally: false, submitted: false });
    }
  }
  if (pending.length > 0) yield pending;
}
