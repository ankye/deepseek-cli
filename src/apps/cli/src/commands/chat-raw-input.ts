import { rawInputEventToKeyName } from "@deepseek/command-system";
import type { CliRawInputEvent } from "@deepseek/platform-contracts";
import type { ChatTui } from "./chat-tui.js";

export function dispatchRawInputToTui(tui: ChatTui, event: CliRawInputEvent): boolean {
  if (!tui.enabled) return false;
  const key = rawInputEventToKeyName(event);
  if (!key) return true;
  const snapshot = tui.snapshot();
  if (snapshot.mode === "prompt" && key !== "Tab" && key !== "Shift+Tab" && key !== "BackTab" && key !== "S-Tab" && key !== "Escape") return false;
  const result = tui.dispatchInputEvent(event);
  return result.ok || result.kind !== "diagnostic";
}

