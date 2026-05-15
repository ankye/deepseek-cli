import type { CliOptions } from "../types.js";
import { renderScriptableModeControl } from "./chat-mode-controls.js";

export async function runModeCommand(options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  for (const line of renderScriptableModeControl(options)) {
    await write(line);
  }
}
