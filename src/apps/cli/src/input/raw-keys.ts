import type { CliRawInputEvent } from "@deepseek/platform-contracts";
import { CLI_PALETTE_SCHEMA_VERSION } from "@deepseek/platform-contracts";
import type { CliInputStream } from "../types.js";

type RawModeCapableInput = CliInputStream & {
  readonly isTTY?: boolean;
  setRawMode?(enabled: boolean): unknown;
  pause?(): unknown;
  resume?(): unknown;
};

export interface CliRawInputSession {
  readonly enabled: boolean;
  teardown(): void;
}

export function enterCliRawInputSession(input: CliInputStream, enabled: boolean): CliRawInputSession {
  const candidate = input as RawModeCapableInput;
  if (!enabled || candidate.isTTY !== true || typeof candidate.setRawMode !== "function") {
    return { enabled: false, teardown: () => undefined };
  }
  candidate.setRawMode(true);
  candidate.resume?.();
  return {
    enabled: true,
    teardown: () => {
      candidate.setRawMode?.(false);
      candidate.pause?.();
    }
  };
}

export async function* readCliRawInputEvents(input: CliInputStream): AsyncIterable<CliRawInputEvent> {
  for await (const chunk of input) {
    for (const event of decodeRawKeyChunk(chunk)) yield event;
  }
}

export function decodeRawKeyChunk(chunk: Uint8Array | string): readonly CliRawInputEvent[] {
  const value = typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
  const events: CliRawInputEvent[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const remaining = value.slice(index);
    const escapeMatch = decodeEscapeSequence(remaining);
    if (escapeMatch) {
      events.push(escapeMatch.event);
      index += escapeMatch.length - 1;
      continue;
    }
    const char = value[index] ?? "";
    events.push(decodeChar(char));
  }
  return events;
}

function decodeEscapeSequence(value: string): { readonly event: CliRawInputEvent; readonly length: number } | undefined {
  if (!value.startsWith("\x1b")) return undefined;
  const known: readonly [string, CliRawInputEvent][] = [
    ["\x1b[200~", event("paste-start", { sequence: "\\x1b[200~" })],
    ["\x1b[201~", event("paste-end", { sequence: "\\x1b[201~" })],
    ["\x1b[A", event("key", { key: "ArrowUp", sequence: "\\x1b[A" })],
    ["\x1b[B", event("key", { key: "ArrowDown", sequence: "\\x1b[B" })],
    ["\x1b[C", event("key", { key: "ArrowRight", sequence: "\\x1b[C" })],
    ["\x1b[D", event("key", { key: "ArrowLeft", sequence: "\\x1b[D" })],
    ["\x1b[Z", event("key", { key: "Shift+Tab", shift: true, sequence: "\\x1b[Z" })]
  ];
  const match = known.find(([prefix]) => value.startsWith(prefix));
  if (match) return { event: match[1], length: match[0].length };
  if (value.length >= 2 && value[1] && value[1] !== "[") {
    return { event: event("key", { key: value[1], alt: true, sequence: "\\x1b" }), length: 2 };
  }
  return { event: event("key", { key: "Escape", sequence: "\\x1b" }), length: 1 };
}

function decodeChar(char: string): CliRawInputEvent {
  if (char === "\r" || char === "\n") return event("key", { key: "Enter", sequence: "\\n" });
  if (char === "\t") return event("key", { key: "Tab", sequence: "\\t" });
  if (char === "\x7f" || char === "\b") return event("key", { key: "Backspace", sequence: "\\b" });
  const code = char.charCodeAt(0);
  if (code >= 1 && code <= 26) {
    const key = String.fromCharCode("a".charCodeAt(0) + code - 1);
    return event("key", { key, ctrl: true, sequence: `Ctrl+${key}` });
  }
  return event("key", { key: char === " " ? " " : char, text: char, sequence: char });
}

function event(kind: CliRawInputEvent["kind"], fields: Omit<CliRawInputEvent, "schemaVersion" | "kind" | "redaction">): CliRawInputEvent {
  return {
    schemaVersion: CLI_PALETTE_SCHEMA_VERSION,
    kind,
    ...fields,
    redaction: { class: fields.text ? "internal" : "public", fields: fields.text ? ["text"] : [] }
  };
}
