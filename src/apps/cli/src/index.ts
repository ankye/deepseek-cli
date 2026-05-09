#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  AgentLoopOutputMode,
  AgentLoopSummary,
  JsonObject,
  ModelLiveVerificationResult,
  ModelProfile,
  ReadinessCommandName,
  ReadinessCommandResult,
  RuntimeDependencies,
  RuntimeEvent,
  RuntimeKernel,
  SessionForkResult,
  SessionId,
  SessionResumeResult
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { invokeLocalReadinessCommand } from "@deepseek/command-system";
import type { LocalReadinessEnvironment } from "@deepseek/command-system";
import { PersistentConfigService } from "@deepseek/config";
import {
  CredentialAuthModelCredentialProvider,
  createDeepSeekCredentialAuthServiceFromEnv,
  createDeepSeekCredentialPresenceEnv
} from "@deepseek/credential-auth-management";
import { coreToolIds } from "@deepseek/core-coding-tools";
import { DeepSeekOpenAIProvider, DeterministicMockModelGateway, OpenAIModelProviderTransport, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { collectRuntimeEvents, createDefaultRuntimeKernel, registerRuntimeCoreTools, runAgentLoop } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";

export interface CliTerminalFlags {
  readonly stdinIsTTY: boolean;
  readonly stdoutIsTTY: boolean;
}

export type CliCommand = "run" | "chat" | "readiness" | "tools-smoke" | "help" | "session";

export interface CliOptions {
  readonly command: CliCommand;
  readonly prompt: string;
  readonly output: AgentLoopOutputMode;
  readonly live: boolean;
  readonly timeoutMs?: number;
  readonly readinessCommand?: ReadinessCommandName;
  readonly readinessInput?: JsonObject;
  readonly sessionAction?: "resume" | "fork";
  readonly sessionId?: SessionId;
  readonly parentSessionId?: SessionId;
}

export type CliWrite = (line: string) => void | Promise<void>;
export type CliInputChunk = Uint8Array | string;
export type CliInputStream = AsyncIterable<CliInputChunk> | Iterable<CliInputChunk>;

export interface CliRuntimeFactoryOptions {
  readonly live: boolean;
  readonly workspaceRoot: string;
}

export interface CliRunOptions {
  readonly createRuntime?: (options: CliRuntimeFactoryOptions) => Promise<{ readonly deps: RuntimeDependencies; readonly kernel: RuntimeKernel }>;
}

const readinessCommands = new Set<ReadinessCommandName>(["init", "config", "auth", "doctor", "privacy", "verify-install"]);
const defaultTerminalFlags: CliTerminalFlags = { stdinIsTTY: false, stdoutIsTTY: false };
const defaultOutputMode: AgentLoopOutputMode = "text";

interface TerminalFlagSource {
  readonly isTTY?: boolean;
}

export function parseCliArgs(args: readonly string[], _terminal: CliTerminalFlags = defaultTerminalFlags): CliOptions {
  const output = parseOutputMode(args);
  const timeoutMs = parsePositiveNumberFlag(args, "--timeout-ms");
  const live = args.includes("--live");
  const first = args[0];
  if (!first || first === "help" || first === "--help" || first === "-h") {
    return { command: "help", prompt: "", output, live };
  }
  if (first === "run") {
    return { command: "run", prompt: promptFromArgs(args.slice(1)), output, live, ...(timeoutMs ? { timeoutMs } : {}) };
  }
  if (first === "chat") {
    return { command: "chat", prompt: "", output, live, ...(timeoutMs ? { timeoutMs } : {}) };
  }
  if (first === "tools-smoke") {
    return { command: "tools-smoke", prompt: "", output, live };
  }
  if (first === "session") {
    const action = args[1] === "fork" ? "fork" : "resume";
    const sessionId = args[2] && !args[2].startsWith("-") ? asId<"session">(args[2]) : undefined;
    const base: CliOptions = {
      command: "session",
      prompt: "",
      output,
      live,
      sessionAction: action
    };
    if (action === "fork" && sessionId) return { ...base, parentSessionId: sessionId };
    if (action === "resume" && sessionId) return { ...base, sessionId };
    return base;
  }
  if (isReadinessCommand(first)) {
    return { command: "readiness", readinessCommand: first, prompt: "", output, live, readinessInput: parseReadinessInput(first, args) };
  }
  return { command: "help", prompt: "", output, live };
}

export function cliUsageLines(): readonly string[] {
  return [
    "DeepSeek CLI",
    "Usage:",
    "  deepseek run \"<task>\" [--output text|json|jsonl] [--live] [--timeout-ms <ms>]",
    "  deepseek chat [--output text|json|jsonl] [--live] [--timeout-ms <ms>]",
    "  deepseek session resume <session-id> [--output text|json]",
    "  deepseek session fork <session-id> [--output text|json]",
    "  deepseek tools-smoke [--output text|jsonl]",
    "  deepseek <init|config|auth|doctor|privacy|verify-install> [--output text|json]"
  ];
}

export async function runCli(
  args: readonly string[],
  write: CliWrite = console.log,
  input: CliInputStream = process.stdin,
  terminal: CliTerminalFlags = terminalFlagsFromProcess(),
  runOptions: CliRunOptions = {}
): Promise<void> {
  const options = parseCliArgs(args, terminal);
  const writer = (line: string) => Promise.resolve(write(line));
  if (options.command === "help") {
    for (const line of cliUsageLines()) await writer(line);
    return;
  }
  if (options.command === "readiness") {
    await runReadinessCommand(options, writer);
    return;
  }
  if (options.command === "tools-smoke") {
    await runCoreToolsSmoke(writer, options.output);
    return;
  }
  if (options.command === "session") {
    await runSessionCommand(options, writer);
    return;
  }
  if (options.command === "chat") {
    await runChatCommand(options, writer, input, runOptions);
    return;
  }
  await runOneShotCommand(options, writer, runOptions);
}

async function runOneShotCommand(options: CliOptions, write: (line: string) => Promise<void>, runOptions: CliRunOptions): Promise<void> {
  const workspaceRoot = process.cwd();
  const runtime = await createCliAgentRuntime({ live: options.live, workspaceRoot }, runOptions);
  try {
    const events = await emitAgentLoop(runtime.deps, runtime.kernel, {
      prompt: options.prompt,
      outputMode: options.output,
      workspaceRoot,
      caller: "cli.run",
      profile: defaultDeepSeekProfile,
      live: options.live,
      ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {})
    }, write);
    await renderFinalJsonIfNeeded(options.output, events, write);
  } finally {
    await runtime.kernel.shutdown("cli-run-completed");
  }
}

async function runChatCommand(options: CliOptions, write: (line: string) => Promise<void>, input: CliInputStream, runOptions: CliRunOptions): Promise<void> {
  const workspaceRoot = process.cwd();
  const runtime = await createCliAgentRuntime({ live: options.live, workspaceRoot }, runOptions);
  let sessionId: SessionId | undefined;
  let turns = 0;
  try {
    if (options.output === "text") {
      await write("DeepSeek chat");
      await write("Type /exit or /quit to close.");
    }
    for await (const line of readCliLines(input)) {
      const prompt = line.trim();
      if (!prompt) continue;
      if (prompt === "/exit" || prompt === "/quit") break;
      turns += 1;
      const events = await emitAgentLoop(runtime.deps, runtime.kernel, {
        prompt,
        ...(sessionId ? { sessionId } : {}),
        outputMode: options.output,
        workspaceRoot,
        caller: "cli.chat",
        profile: defaultDeepSeekProfile,
        live: options.live,
        ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {})
      }, write);
      const terminal = finalAgentLoopEvent(events);
      sessionId = terminal?.sessionId ?? sessionId;
      await renderFinalJsonIfNeeded(options.output, events, write);
    }
    if (options.output === "text") {
      await write(`[chat completed] turns=${turns}${sessionId ? ` session=${sessionId}` : ""}`);
    }
  } finally {
    await runtime.kernel.shutdown("cli-chat-completed");
  }
}

async function emitAgentLoop(
  deps: RuntimeDependencies,
  kernel: RuntimeKernel,
  request: Parameters<typeof runAgentLoop>[2],
  write: (line: string) => Promise<void>
): Promise<readonly RuntimeEvent[]> {
  const events: RuntimeEvent[] = [];
  for await (const event of runAgentLoop(deps, kernel, request)) {
    events.push(event);
    if (request.outputMode === "jsonl") {
      await write(renderJsonLine(event));
      continue;
    }
    if (request.outputMode === "text") {
      const line = renderText(event);
      if (line) await write(line);
    }
  }
  return events;
}

async function createCliAgentRuntime(options: CliRuntimeFactoryOptions, runOptions: CliRunOptions): Promise<{ readonly deps: RuntimeDependencies; readonly kernel: RuntimeKernel }> {
  if (runOptions.createRuntime) return runOptions.createRuntime(options);
  const baseDeps = createDeterministicRuntimeDependencies();
  const deps: RuntimeDependencies = options.live
    ? {
        ...baseDeps,
        models: new DeepSeekOpenAIProvider({
          credentials: new CredentialAuthModelCredentialProvider(await createDeepSeekCredentialAuthServiceFromEnv()),
          transport: new OpenAIModelProviderTransport(),
          timeoutMs: 90_000
        })
      }
    : baseDeps;
  await registerRuntimeCoreTools(deps, options.workspaceRoot);
  return { deps, kernel: await createDefaultRuntimeKernel(deps) };
}

function renderText(event: RuntimeEvent): string {
  if (event.kind === "model.delta") return String(event.data.text ?? "");
  if (event.kind === "model.reasoning") return "[reasoning]";
  if (event.kind === "model.requested") return `[model] request iteration=${String(event.data.iteration ?? "")}`;
  if (event.kind === "model.tool.intent") return `[tool] ${String(event.data.name ?? "")}`;
  if (event.kind === "model.tool.repaired") return "[tool repaired]";
  if (event.kind === "model.tool.rejected") return `[tool rejected] ${event.error?.message ?? ""}`.trim();
  if (event.kind === "model.tool.result") return `[tool result] ${String(event.data.terminalKind ?? "")}`;
  if (event.kind === "agent.loop.completed") {
    const summary = event.data as AgentLoopSummary;
    return `[completed] trace=${summary.traceId} session=${summary.sessionId}`;
  }
  if (event.kind === "agent.loop.failed") return `[failed] ${event.error?.message ?? ""}`.trim();
  if (event.kind === "runtime.error") return `[error] ${event.error?.message ?? ""}`.trim();
  return "";
}

function renderJsonLine(event: RuntimeEvent): string {
  return JSON.stringify(event);
}

async function renderFinalJsonIfNeeded(output: AgentLoopOutputMode, events: readonly RuntimeEvent[], write: (line: string) => Promise<void>): Promise<void> {
  if (output !== "json") return;
  const terminal = finalAgentLoopEvent(events);
  const fallback = events.at(-1);
  await write(JSON.stringify({
    schemaVersion: "1.0.0",
    status: String(terminal?.data.status ?? (terminal?.kind === "agent.loop.completed" ? "completed" : "failed")),
    sessionId: terminal?.sessionId ?? fallback?.sessionId ?? "",
    turnId: terminal?.turnId ?? fallback?.turnId ?? "",
    traceId: String(terminal?.trace.traceId ?? fallback?.trace.traceId ?? ""),
    assistantText: String(terminal?.data.assistantText ?? ""),
    diagnostics: Array.isArray(terminal?.data.diagnostics) ? terminal?.data.diagnostics : [],
    redaction: terminal?.data.redaction ?? { class: "internal" }
  }));
}

function finalAgentLoopEvent(events: readonly RuntimeEvent[]): RuntimeEvent | undefined {
  return [...events].reverse().find((event) => event.kind === "agent.loop.completed" || event.kind === "agent.loop.failed");
}

async function runSessionCommand(options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  const deps = await createCliRuntimeDependencies();
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

async function createCliRuntimeDependencies(workspaceRoot = process.cwd()): Promise<RuntimeDependencies> {
  const deps = createDeterministicRuntimeDependencies();
  await registerRuntimeCoreTools(deps, workspaceRoot);
  return deps;
}

function cliSessionError(code: string, message: string): JsonObject {
  return { code, message, retryable: false, redaction: { class: "public" } };
}

async function runCoreToolsSmoke(write: (line: string) => Promise<void>, output: AgentLoopOutputMode): Promise<void> {
  const deps = createDeterministicRuntimeDependencies();
  const workspaceRoot = "/workspace";
  await deps.platform.writeFile(`${workspaceRoot}/README.md`, "hello core tools\n");
  await registerDeterministicCoreTools(deps, workspaceRoot);
  const kernel = await createDefaultRuntimeKernel(deps);
  try {
    const sequences = [
      { capabilityId: coreToolIds.fileRead, input: { path: "README.md", workspaceRoot } },
      { capabilityId: coreToolIds.fileEdit, input: { path: "README.md", expected: "hello", replacement: "hello governed", workspaceRoot } },
      { capabilityId: coreToolIds.testRun, input: { command: "npm", args: ["test"], workspaceRoot, intent: "smoke" } }
    ];
    const events: RuntimeEvent[] = [];
    for (const step of sequences) {
      const stepEvents = await collectRuntimeEvents(kernel.execute({
        capabilityId: step.capabilityId,
        caller: "cli.tools-smoke",
        input: step.input
      }));
      events.push(...stepEvents);
      for (const event of stepEvents) {
        if (output === "jsonl") await write(renderJsonLine(event));
        if (output === "text") {
          const line = renderText(event);
          if (line) await write(line);
        }
      }
    }
    if (output === "json") {
      await write(JSON.stringify({ schemaVersion: "1.0.0", status: "completed", eventCount: events.length, redaction: { class: "internal" } }));
    }
  } finally {
    await kernel.shutdown();
  }
}

export function renderReadinessText(result: ReadinessCommandResult): readonly string[] {
  const lines = [`${result.command}: ${result.status}`];
  for (const check of result.checks) {
    lines.push(`- ${check.id}: ${check.status} - ${check.message}`);
  }
  for (const action of result.suggestedActions) {
    lines.push(`next: ${action}`);
  }
  return lines;
}

async function runReadinessCommand(options: CliOptions, write: (line: string) => Promise<void>): Promise<void> {
  if (!options.readinessCommand) return;
  const environment = await createCliReadinessEnvironment(options);
  const result = await invokeLocalReadinessCommand(options.readinessCommand, options.readinessInput ?? {}, environment);
  if (!result.ok || !result.value) {
    await write(options.output === "text" ? `[readiness failed] ${result.error?.message ?? options.readinessCommand}` : JSON.stringify(result));
    return;
  }
  if (options.output !== "text") {
    await write(JSON.stringify(result.value));
    return;
  }
  for (const line of renderReadinessText(result.value)) await write(line);
}

async function createCliReadinessEnvironment(options: CliOptions): Promise<LocalReadinessEnvironment> {
  const platform = new NodePlatformRuntime();
  const workspaceRoot = process.cwd();
  const config = new PersistentConfigService({
    platform,
    workspaceRoot,
    defaults: {
      model: defaultDeepSeekProfile.model,
      profile: "default",
      telemetry: "disabled",
      privacy: "local",
      output: "text",
      sandbox: "ask"
    }
  });
  const credentialAuth = await createDeepSeekCredentialAuthServiceFromEnv();
  const existingWorkspaceDocument = await config.document("workspace");
  let initializedThisRun = false;
  if (options.readinessCommand === "init" && (!existingWorkspaceDocument || options.readinessInput?.force === true)) {
    await config.set({ scope: "workspace", key: "model", value: defaultDeepSeekProfile.model });
    await config.set({ scope: "workspace", key: "profile", value: "default" });
    await config.set({ scope: "workspace", key: "telemetry", value: "disabled" });
    await config.set({ scope: "workspace", key: "privacy", value: "local" });
    await config.set({ scope: "workspace", key: "output", value: "text" });
    await config.set({ scope: "workspace", key: "sandbox", value: "ask" });
    initializedThisRun = true;
  }
  if (options.readinessCommand === "config" && typeof options.readinessInput?.setKey === "string") {
    await config.set({
      scope: options.readinessInput.scope === "user" ? "user" : "workspace",
      key: options.readinessInput.setKey,
      value: options.readinessInput.setValue ?? ""
    });
  }
  if (options.readinessCommand === "auth" && options.readinessInput?.logout === true) {
    await credentialAuth.deleteDeepSeekCredential();
  }

  const resolvedConfig = await config.resolve();
  const workspaceDocument = await config.document("workspace");
  const credentials = await credentialAuth.listDeepSeekCredentials();
  const workspaceMetadata = platform.workspaceMetadataPath(workspaceRoot, "deepseek");
  const platformDescriptor = await platform.descriptor();
  const liveVerifier = options.readinessInput?.live === true
    ? async () => {
        const providerOptions = {
          credentials: new CredentialAuthModelCredentialProvider(credentialAuth),
          ...(options.readinessInput?.fakeLive === true ? {} : { transport: new OpenAIModelProviderTransport() }),
          timeoutMs: 90000
        };
        const provider = new DeepSeekOpenAIProvider(providerOptions);
        const gateway = options.readinessInput?.fakeLive === true ? new DeterministicMockModelGateway() : provider;
        return gateway.verify
          ? gateway.verify({ profile: defaultDeepSeekProfile, prompt: "Reply with exactly this text: ok", timeoutMs: 90000 })
          : missingLiveVerifierResult(defaultDeepSeekProfile);
      }
    : undefined;

  return {
    cwd: workspaceRoot,
    nodeVersion: process.version,
    platform: `${platformDescriptor.os}:${platformDescriptor.environmentKind}`,
    packageName: "deekseek-cli",
    packageVersion: "0.1.2",
    env: createDeepSeekCredentialPresenceEnv(),
    ignoredPaths: [".env", ".env.*", "参考/"],
    availableCommands: ["node", "npm"],
    platformDescriptor,
    config: Object.fromEntries(resolvedConfig.values.map((value) => [value.key, value.redactedValue])),
    resolvedConfig,
    credentialReferences: credentials,
    ...(liveVerifier ? { liveVerifier } : {}),
    ...(workspaceMetadata.ok && workspaceMetadata.value ? { workspaceMetadataPath: workspaceMetadata.value } : {}),
    initialized: Boolean(existingWorkspaceDocument),
    initializedThisRun: initializedThisRun && Boolean(workspaceDocument)
  };
}

function missingLiveVerifierResult(profile: ModelProfile): ModelLiveVerificationResult {
  return {
    ok: false,
    provider: { provider: "deepseek", protocol: "openai-chat-completions", model: profile.model },
    reachable: false,
    terminalStatus: "failed",
    eventKinds: [],
    diagnostics: [],
    redaction: { class: "internal" }
  };
}

async function* readCliLines(input: CliInputStream): AsyncIterable<string> {
  let pending = "";
  for await (const chunk of input) {
    pending += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) yield line;
  }
  if (pending.length > 0) yield pending;
}

function parseReadinessInput(command: ReadinessCommandName, args: readonly string[]): JsonObject {
  const input: Record<string, unknown> = {};
  if (args.includes("--force")) input.force = true;
  if (command === "doctor" && args.includes("--live")) input.live = true;
  if (command === "doctor" && args.includes("--fake-live")) {
    input.live = true;
    input.fakeLive = true;
  }
  if (command === "auth" && args.includes("logout")) input.logout = true;
  if (command === "config" && args[1] === "set") {
    input.setKey = args[2] ?? "";
    input.setValue = parseConfigValue(args[3] ?? "");
    input.scope = args.includes("--user") ? "user" : "workspace";
  }
  return input as JsonObject;
}

function parseConfigValue(value: string): string | boolean | number {
  if (value === "true") return true;
  if (value === "false") return false;
  const numberValue = Number(value);
  return value.trim() !== "" && Number.isFinite(numberValue) ? numberValue : value;
}

function parseOutputMode(args: readonly string[]): AgentLoopOutputMode {
  const index = args.indexOf("--output");
  const value = index >= 0 ? args[index + 1] : undefined;
  return value === "json" || value === "jsonl" || value === "text" ? value : defaultOutputMode;
}

function parsePositiveNumberFlag(args: readonly string[], name: string): number | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function promptFromArgs(args: readonly string[]): string {
  const filtered: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value) continue;
    if (value === "--output" || value === "--timeout-ms") {
      index += 1;
      continue;
    }
    if (value === "--live") continue;
    filtered.push(value);
  }
  return filtered.join(" ").trim();
}

function isReadinessCommand(value: string | undefined): value is ReadinessCommandName {
  return typeof value === "string" && readinessCommands.has(value as ReadinessCommandName);
}

function terminalFlagsFromProcess(stdin: TerminalFlagSource = process.stdin, stdout: TerminalFlagSource = process.stdout): CliTerminalFlags {
  return { stdinIsTTY: stdin.isTTY === true, stdoutIsTTY: stdout.isTTY === true };
}

export function isCliEntryPoint(entryPath = process.argv[1]): boolean {
  if (!entryPath) return false;
  return pathToFileURL(resolve(entryPath)).href === import.meta.url;
}

if (isCliEntryPoint()) {
  void runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "DeepSeek CLI failed.");
    process.exitCode = 1;
  });
}
