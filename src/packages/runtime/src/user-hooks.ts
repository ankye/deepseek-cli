import type {
  HookHandler,
  HookManifest,
  HookOutputRecord,
  JsonObject,
  RuntimeDependencies,
  SerializableResult
} from "@deepseek/platform-contracts";
import type { NodePlatformRuntime as NodePlatformRuntimeImpl } from "@deepseek/platform-abstraction";

interface UserHookSpec extends JsonObject {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly point: string;
  readonly trust?: string;
  readonly command: string;
  readonly args?: readonly string[];
  readonly timeoutMs?: number;
  readonly failurePolicy?: string;
  readonly priority?: number;
  readonly permissions?: readonly string[];
  readonly isolation?: string;
}

function isSpecArray(value: unknown): value is readonly UserHookSpec[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && typeof (item as { id?: unknown }).id === "string" && typeof (item as { command?: unknown }).command === "string");
}

export async function loadUserHooks(workspaceRoot: string, deps: RuntimeDependencies, platform: NodePlatformRuntimeImpl): Promise<number> {
  const manifestPath = `${workspaceRoot.replace(/\\/g, "/").replace(/\/$/, "")}/.deepseek/hooks.json`;
  let raw: string;
  try {
    raw = await platform.readFile(manifestPath);
  } catch {
    return 0;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn(`deepseek: ignoring malformed ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
  if (!isSpecArray(parsed)) {
    console.warn(`deepseek: ${manifestPath} must be an array of hook specs`);
    return 0;
  }

  let registered = 0;
  for (const spec of parsed) {
    try {
      const manifest = buildHookManifest(spec);
      const handler = buildUserHookHandler(spec, platform);
      await deps.hooks.registerHook(manifest, handler);
      registered += 1;
    } catch (error) {
      console.warn(`deepseek: failed to register user hook "${spec.id}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return registered;
}

function buildHookManifest(spec: UserHookSpec): HookManifest {
  return {
    schemaVersion: "1.0.0",
    id: spec.id as never,
    name: spec.name,
    version: spec.version ?? "0.0.1",
    point: spec.point as never,
    source: "user" as never,
    trust: (spec.trust ?? "trusted") as never,
    ordering: { priority: spec.priority ?? 100 },
    timeoutMs: spec.timeoutMs ?? 5000,
    failurePolicy: (spec.failurePolicy ?? "continue") as never,
    isolation: (spec.isolation ?? "in-process-observe-only") as never,
    permissions: spec.permissions ?? [],
    inputSchema: { type: "object" },
    outputSchema: { type: "object" }
  } as HookManifest;
}

function buildUserHookHandler(spec: UserHookSpec, platform: NodePlatformRuntimeImpl): HookHandler {
  const command = spec.command;
  const args = spec.args ?? [];
  const timeoutMs = spec.timeoutMs ?? 5000;
  return async (input: JsonObject, context): Promise<SerializableResult<HookOutputRecord | readonly HookOutputRecord[]>> => {
    try {
      const subprocess = platform.spawnMcpServer(command, args);
      const envelope: Record<string, unknown> = { input, point: context.manifest.point };
      if (context.trace) envelope.trace = context.trace;
      subprocess.stdin.write(`${JSON.stringify(envelope)}\n`);
      subprocess.stdin.end();
      const output = await readOneLine(subprocess.stdout, timeoutMs);
      subprocess.kill();
      if (!output) {
        return { ok: false, error: { code: "HOOK_NO_OUTPUT", message: "User hook produced no stdout line", retryable: false, redaction: { class: "internal" } } };
      }
      const parsed = JSON.parse(output) as SerializableResult<HookOutputRecord | readonly HookOutputRecord[]>;
      return parsed;
    } catch (error) {
      return { ok: false, error: { code: "HOOK_HANDLER_FAILED", message: error instanceof Error ? error.message : "User hook handler failed", retryable: false, redaction: { class: "internal" } } };
    }
  };
}

async function readOneLine(stream: import("node:stream").Readable, timeoutMs: number): Promise<string | undefined> {
  return await new Promise<string | undefined>((resolve) => {
    let buffer = "";
    const timer = setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, timeoutMs);
    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const idx = buffer.indexOf("\n");
      if (idx >= 0) {
        cleanup();
        resolve(buffer.slice(0, idx));
      }
    };
    const onClose = () => {
      cleanup();
      resolve(buffer.length > 0 ? buffer : undefined);
    };
    const cleanup = () => {
      clearTimeout(timer);
      stream.off("data", onData);
      stream.off("close", onClose);
    };
    stream.on("data", onData);
    stream.on("close", onClose);
  });
}
