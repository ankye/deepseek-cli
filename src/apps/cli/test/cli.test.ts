import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCliArgs, runCli } from "../src/index.js";

describe("cli host adapter", () => {
  it("parses prompt mode and stream-json rendering", () => {
    assert.deepEqual(parseCliArgs(["-p", "hello", "--output", "stream-json"]), {
      prompt: "hello",
      output: "stream-json"
    });
  });

  it("runs as a thin host over runtime events", async () => {
    const lines: string[] = [];
    await runCli(["-p", "hello", "--output", "stream-json"], (line) => lines.push(line));
    assert.ok(lines.some((line) => JSON.parse(line).kind === "turn.completed"));
  });
});
