import type { CliOptions } from "../types.js";

export async function writeChatLocalLines(kind: string, lines: readonly string[], options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  for (const line of lines) {
    if (options.output === "jsonl") {
      await write(JSON.stringify({ kind, record: JSON.parse(line) as unknown }));
    } else {
      await write(line);
    }
  }
}

export async function writeLocalFailure(command: string, code: string, options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  if (options.output === "text") {
    await write(`[chat] ${command} command invalid`);
    return;
  }
  await write(JSON.stringify({ kind: "chat.command.local-failure", command, code }));
}
