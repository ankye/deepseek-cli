import type { JsonObject, SessionForkResult, SessionResumeResult } from "@deepseek/platform-contracts";
import type { CliOptions, CliRunOptions } from "../types.js";
import { resolveSessionDependencies } from "../host/runtime.js";

export async function runSessionCommand(options: CliOptions, write: (line: string) => Promise<void>, runOptions: CliRunOptions): Promise<void> {
  const deps = await resolveSessionDependencies(runOptions);
  let result: { ok: boolean; value?: SessionResumeResult | SessionForkResult; error?: JsonObject };
  if (options.sessionAction === "fork") {
    result = options.parentSessionId
      ? await deps.sessions.fork({ parentSessionId: options.parentSessionId, reason: "cli session fork" })
      : { ok: false, error: cliSessionError("SESSION_ID_REQUIRED", "session fork requires a parent session id") };
  } else {
    result = options.sessionId
      ? await deps.sessions.resume(options.sessionId)
      : { ok: false, error: cliSessionError("SESSION_ID_REQUIRED", "session resume requires a session id") };
  }
  if (options.output !== "text") {
    await write(JSON.stringify(result));
    return;
  }
  if (!result.ok || !result.value) {
    await write(`[session failed] ${String(result.error?.message ?? options.sessionAction ?? "session")}`);
    return;
  }
  if ("childSessionId" in result.value) {
    await write(`forked ${result.value.parentSessionId} -> ${result.value.childSessionId}`);
    return;
  }
  await write(`resumed ${result.value.sessionId} (${result.value.eventCount} events)`);
}

function cliSessionError(code: string, message: string): JsonObject {
  return { code, message, retryable: false, redaction: { class: "public" } };
}
