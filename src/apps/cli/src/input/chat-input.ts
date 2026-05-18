import { rawInputEventToKeyName } from "@deepseek/command-system";
import type { CliRawInputEvent } from "@deepseek/platform-contracts";
import type { CliInputStream } from "../types.js";
import type { CliInputStrategy } from "../host/terminal-profile.js";
import { readCliLines } from "./lines.js";
import { readCliRawInputEvents } from "./raw-keys.js";

export type CliLocalInputDispatch = (event: CliRawInputEvent) => boolean;

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
    if (dispatchLocalInput?.(event)) continue;
    const key = rawInputEventToKeyName(event);
    if (!key) continue;
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

