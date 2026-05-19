import { rawInputEventToKeyName } from "@deepseek/command-system";
import type { CliRawInputEvent } from "@deepseek/platform-contracts";
import type { ChatTui } from "./chat-tui.js";
import type { CliLocalInputContext, CliLocalInputDispatchOutcome } from "../input/chat-input.js";

export function dispatchRawInputToTui(
  tui: ChatTui,
  event: CliRawInputEvent,
  context: CliLocalInputContext = { pending: "" }
): boolean | CliLocalInputDispatchOutcome {
  if (!tui.enabled) return false;
  const key = rawInputEventToKeyName(event);
  if (!key) return true;
  const snapshot = tui.snapshot();
  if (snapshot.mode === "prompt" && key === "/" && context.pending.length === 0) {
    const result = tui.dispatchKey("/");
    return result.ok || result.kind !== "diagnostic";
  }
  if (snapshot.mode === "prompt" && key !== "Tab" && key !== "Shift+Tab" && key !== "BackTab" && key !== "S-Tab" && key !== "Escape") return false;
  const result = tui.dispatchInputEvent(event);
  if (result.kind === "command" && result.commandSuggestionId) {
    const bridge = bridgeCommandBarAcceptance(result.commandName, result.previewText);
    if (bridge) {
      tui.dispatchKey("Escape");
      return bridge;
    }
  }
  return result.ok || result.kind !== "diagnostic";
}

function bridgeCommandBarAcceptance(
  commandName: string | undefined,
  previewText: string | undefined
): CliLocalInputDispatchOutcome | undefined {
  if (!commandName?.startsWith("/")) return undefined;
  if (previewText?.includes("<")) {
    return {
      handled: true,
      insertText: `${commandName} `
    };
  }
  return {
    handled: true,
    submitText: commandName
  };
}
