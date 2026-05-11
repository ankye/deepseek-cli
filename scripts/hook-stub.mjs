#!/usr/bin/env node
// Minimal hook stub used in integration tests.
// Reads a single JSON line from stdin containing the hook invocation input,
// writes a single JSON line to stdout with the typed output record shape.
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.once("line", (raw) => {
  let input = {};
  try { input = JSON.parse(raw); } catch { /* ignore */ }
  const output = {
    ok: true,
    value: [
      {
        hookId: "hook-stub",
        kind: "observation",
        payload: { observed: input },
        redaction: { class: "internal" },
        provenance: { source: "scripts/hook-stub.mjs" },
        replayFingerprint: "hook-stub-fingerprint"
      }
    ]
  };
  process.stdout.write(`${JSON.stringify(output)}\n`);
  setTimeout(() => process.exit(0), 10);
});

rl.on("close", () => process.exit(0));
