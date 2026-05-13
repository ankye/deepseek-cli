import type { CliInputStream } from "../types.js";
import type { CliInputStrategy } from "../host/terminal-profile.js";

export async function* readCliLines(input: CliInputStream, strategy: CliInputStrategy = "scripted"): AsyncIterable<string> {
  if (strategy === "none") return;
  let pending = "";
  for await (const chunk of input) {
    pending += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) yield line;
  }
  if (pending.length > 0) yield pending;
}
