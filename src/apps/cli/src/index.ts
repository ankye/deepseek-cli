#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { CapabilityId, JsonObject, ModelLiveVerificationResult, ReadinessCommandName, ReadinessCommandResult, RuntimeEvent, RuntimeKernel } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { invokeInteractiveCommand, invokeLocalReadinessCommand, isInteractiveControlCommandName } from "@deepseek/command-system";
import type { InteractiveControlCommandName, InteractiveControlResult } from "@deepseek/command-system";
import type { LocalReadinessEnvironment } from "@deepseek/command-system";
import { PersistentConfigService } from "@deepseek/config";
import {
  CredentialAuthModelCredentialProvider,
  createDeepSeekCredentialAuthServiceFromEnv,
  createDeepSeekCredentialPresenceEnv
} from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider, DeterministicMockModelGateway, OpenAIModelProviderTransport, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { collectRuntimeEvents, createDefaultRuntimeKernel, executeProjectedRuntimeTurn, registerRuntimeCoreTools, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies, registerDeterministicCoreTools } from "@deepseek/testing-regression";
import { coreToolIds } from "@deepseek/core-coding-tools";
import type { RuntimeDependencies, SessionForkResult, SessionId, SessionResumeResult } from "@deepseek/platform-contracts";

export interface CliTerminalFlags {
  readonly stdinIsTTY: boolean;
  readonly stdoutIsTTY: boolean;
}

export interface CliOptions {
  readonly command: "turn" | "run" | "readiness" | "tools-smoke" | "interactive" | "help" | "session";
  readonly prompt: string;
  readonly output: "text" | "stream-json";
  readonly capabilityId?: CapabilityId;
  readonly readinessCommand?: ReadinessCommandName;
  readonly readinessInput?: JsonObject;
  readonly sessionAction?: "resume" | "fork";
  readonly sessionId?: SessionId;
  readonly parentSessionId?: SessionId;
}

const readinessCommands = new Set<ReadinessCommandName>(["init", "config", "auth", "doctor", "privacy", "verify-install"]);
const defaultTerminalFlags: CliTerminalFlags = { stdinIsTTY: false, stdoutIsTTY: false };

interface TerminalFlagSource {
  readonly isTTY?: boolean;
}

export function parseCliArgs(args: readonly string[], terminal: CliTerminalFlags = defaultTerminalFlags): CliOptions {
  const first = args[0];
  const outputFlagIndex = args.indexOf("--output");
  const output = outputFlagIndex >= 0 && args[outputFlagIndex + 1] === "stream-json" ? "stream-json" : "text";
  if (!first) {
    return terminal.stdinIsTTY && terminal.stdoutIsTTY
      ? { command: "interactive", prompt: "", output }
      : { command: "help", prompt: "", output };
  }
  if (first === "interactive") {
    return { command: "interactive", prompt: "", output };
  }
  if (first === "help" || first === "--help" || first === "-h") {
    return { command: "help", prompt: "", output };
  }
  if (first === "tools-smoke") {
    return { command: "tools-smoke", prompt: "", output };
  }
  if (first === "session") {
    const action = args[1] === "fork" ? "fork" : "resume";
    const sessionId = args[2] ? asId<"session">(args[2]) : undefined;
    const base: CliOptions = {
      command: "session",
      prompt: "",
      output,
      sessionAction: action
    };
    if (action === "fork" && sessionId) return { ...base, parentSessionId: sessionId };
    if (action === "resume" && sessionId) return { ...base, sessionId };
    return base;
  }
  if (isReadinessCommand(first)) {
    const readinessOutput = outputFlagIndex >= 0 && (args[outputFlagIndex + 1] === "json" || args[outputFlagIndex + 1] === "stream-json") ? "stream-json" : "text";
    return { command: "readiness", readinessCommand: first, prompt: "", output: readinessOutput, readinessInput: parseReadinessInput(first, args) };
  }
  if (!args.includes("-p") && !args.includes("--capability") && first.startsWith("-")) {
    return { command: "help", prompt: "", output };
  }
  const command = args[0] === "run" ? "run" : "turn";
  const effectiveArgs = command === "run" ? args.slice(1) : args;
  const promptIndex = effectiveArgs.indexOf("-p");
  const prompt = promptIndex >= 0 ? effectiveArgs[promptIndex + 1] ?? "" : effectiveArgs.filter((arg) => arg !== "--output" && arg !== "stream-json").join(" ");
  const capabilityIndex = effectiveArgs.indexOf("--capability");
  const capabilityId = capabilityIndex >= 0 ? asId<"capability">(effectiveArgs[capabilityIndex + 1] ?? String(runtimeEchoCapability.id)) : runtimeEchoCapability.id;
  return { command, prompt, output, capabilityId };
}

export function cliUsageLines(): readonly string[] {
  return [
    "DeepSeek CLI",
    "Usage:",
    "  deepseek interactive",
    "  deepseek -p <prompt> [--output stream-json]",
    "  deepseek run -p <prompt> [--capability <id>]",
    "  deepseek session resume <session-id> [--output stream-json]",
    "  deepseek session fork <session-id> [--output stream-json]",
    "  deepseek tools-smoke [--output stream-json]",
    "  deepseek <init|config|auth|doctor|privacy|verify-install>"
  ];
}

export interface InteractivePromptInput {
  readonly kind: "prompt";
  readonly text: string;
}

export interface InteractiveCommandInput {
  readonly kind: "command";
  readonly name: InteractiveControlCommandName;
  readonly raw: string;
  readonly args: readonly string[];
}

export interface InteractiveUnknownCommandInput {
  readonly kind: "unknown-command";
  readonly name: string;
  readonly raw: string;
}

export interface InteractiveEmptyInput {
  readonly kind: "empty";
}

export type InteractiveParsedInput = InteractivePromptInput | InteractiveCommandInput | InteractiveUnknownCommandInput | InteractiveEmptyInput;

export function parseInteractiveInput(line: string): InteractiveParsedInput {
  const text = line.trim();
  if (!text) return { kind: "empty" };
  if (!text.startsWith("/")) return { kind: "prompt", text };
  const commandName = text.slice(1).split(/\s+/)[0] ?? "";
  const args = text.slice(1).split(/\s+/).slice(1);
  if (isInteractiveControlCommandName(commandName)) {
    return { kind: "command", name: commandName, raw: text, args };
  }
  return { kind: "unknown-command", name: commandName, raw: text };
}

export type CliWrite = (line: string) => void | Promise<void>;
export type InteractiveInputChunk = Uint8Array | string;
export type InteractiveInputStream = AsyncIterable<InteractiveInputChunk> | Iterable<InteractiveInputChunk>;

export interface InteractiveCliOptions {
  readonly input: InteractiveInputStream;
  readonly write: CliWrite;
  readonly output?: CliOptions["output"];
  readonly capabilityId?: CapabilityId;
  readonly createKernel?: () => Promise<RuntimeKernel>;
  readonly createDependencies?: () => Promise<RuntimeDependencies> | RuntimeDependencies;
  readonly caller?: string;
  readonly promptTimeoutMs?: number;
}

export interface InteractiveCliResult extends JsonObject {
  readonly status: "completed" | "failed";
  readonly prompts: number;
  readonly commands: number;
  readonly cancellations: number;
  readonly activeSessionId?: string;
}

interface ActiveInteractiveTurn {
  invocationId?: string;
  cancelRequested?: string;
  done: Promise<void>;
}

export async function runInteractiveCli(options: InteractiveCliOptions): Promise<InteractiveCliResult> {
  const output = options.output ?? "text";
  const capabilityId = options.capabilityId ?? runtimeEchoCapability.id;
  const deps = options.createKernel ? undefined : await createCliRuntimeDependencies();
  const kernel = options.createKernel ? await options.createKernel() : await createDefaultRuntimeKernel(deps as RuntimeDependencies);
  const write = (line: string) => Promise.resolve(options.write(line));
  let active: ActiveInteractiveTurn | undefined;
  let activeSessionId: SessionId | undefined;
  let prompts = 0;
  let commands = 0;
  let cancellations = 0;
  let failed = false;

  await writeInteractiveLine(write, output, { kind: "interactive.started", data: { controls: ["/help", "/exit", "/quit", "/clear", "/cancel"] } });

  const startPromptTurn = (prompt: string): void => {
    prompts += 1;
    const turn: ActiveInteractiveTurn = {
      done: Promise.resolve()
    };
    turn.done = (async () => {
      try {
        const eventStream = deps
          ? executeProjectedRuntimeTurn(deps, kernel, {
              capabilityId,
              caller: options.caller ?? "cli.interactive",
              input: { text: prompt, prompt },
              prompt,
              ...(activeSessionId ? { sessionId: activeSessionId } : {}),
              timeoutMs: options.promptTimeoutMs ?? 30_000
            })
          : kernel.execute({
              capabilityId,
              caller: options.caller ?? "cli.interactive",
              input: { text: prompt, prompt },
              ...(activeSessionId ? { sessionId: activeSessionId } : {}),
              timeoutMs: options.promptTimeoutMs ?? 30_000
            });
        for await (const event of eventStream) {
          activeSessionId = event.sessionId;
          const envelope = event.kind === "execution.envelope.created" ? event.data.envelope : undefined;
          if (isEnvelopeWithInvocationId(envelope)) {
            turn.invocationId = envelope.invocationId;
            if (turn.cancelRequested) {
              await kernel.cancel(turn.invocationId, turn.cancelRequested);
            }
          }
          await write(output === "stream-json" ? renderStreamJson(event) : renderText(event));
        }
      } catch (error) {
        failed = true;
        await writeInteractiveLine(write, output, {
          kind: "interactive.error",
          data: { message: error instanceof Error ? error.message : "Interactive prompt failed" }
        });
      } finally {
        if (active === turn) active = undefined;
      }
    })();
    active = turn;
  };

  for await (const line of readInteractiveLines(options.input)) {
    const parsed = parseInteractiveInput(line);
    if (parsed.kind === "empty") continue;
    if (parsed.kind === "prompt") {
      if (active) {
        await writeInteractiveLine(write, output, { kind: "interactive.busy", data: { message: "A turn is already active. Use /cancel before submitting another prompt." } });
        continue;
      }
      startPromptTurn(parsed.text);
      continue;
    }
    if (parsed.kind === "unknown-command") {
      commands += 1;
      await writeInteractiveLine(write, output, { kind: "interactive.command.failed", data: { command: parsed.raw, code: "INTERACTIVE_COMMAND_NOT_FOUND" } });
      continue;
    }

    commands += 1;
    const result = await invokeInteractiveCommand(parsed.name, {
      reason: "interactive command",
      sessionId: parsed.args[0] ?? "",
      parentSessionId: parsed.args[0] ?? ""
    });
    if (!result.ok || !result.value) {
      failed = true;
      await writeInteractiveLine(write, output, { kind: "interactive.command.failed", data: { command: parsed.raw, error: result.error ?? {} } });
      continue;
    }
    if (result.value.action === "cancel") {
      cancellations += 1;
      if (active?.invocationId) {
        await kernel.cancel(active.invocationId, result.value.message);
      } else if (active) {
        active.cancelRequested = result.value.message;
      }
      await writeInteractiveControlResult(write, output, active ? result.value : { ...result.value, message: "No active turn to cancel." });
      continue;
    }
    if (result.value.action === "resume") {
      if (!deps) {
        await writeInteractiveLine(write, output, { kind: "interactive.command.failed", data: { command: parsed.raw, code: "INTERACTIVE_SESSION_UNAVAILABLE" } });
        continue;
      }
      const sessionId = typeof result.value.sessionId === "string" && result.value.sessionId ? asId<"session">(result.value.sessionId) : undefined;
      const resumed = sessionId ? await deps.sessions.resume(sessionId) : { ok: false, error: cliSessionError("SESSION_ID_REQUIRED", "Resume requires a session id") };
      const resumedValue = "value" in resumed ? resumed.value : undefined;
      if (!resumed.ok || !resumedValue) {
        await writeInteractiveLine(write, output, { kind: "interactive.command.failed", data: { command: parsed.raw, error: resumed.error ?? {} } });
        continue;
      }
      activeSessionId = resumedValue.sessionId;
      await writeInteractiveControlResult(write, output, { ...result.value, sessionId: activeSessionId, message: `Resumed session ${activeSessionId}` });
      continue;
    }
    if (result.value.action === "fork") {
      if (!deps) {
        await writeInteractiveLine(write, output, { kind: "interactive.command.failed", data: { command: parsed.raw, code: "INTERACTIVE_SESSION_UNAVAILABLE" } });
        continue;
      }
      const parentSessionId = typeof result.value.parentSessionId === "string" && result.value.parentSessionId ? asId<"session">(result.value.parentSessionId) : activeSessionId;
      const forked = parentSessionId ? await deps.sessions.fork({ parentSessionId, reason: "interactive fork" }) : { ok: false, error: cliSessionError("SESSION_ID_REQUIRED", "Fork requires a parent session id") };
      const forkedValue = "value" in forked ? forked.value : undefined;
      if (!forked.ok || !forkedValue) {
        await writeInteractiveLine(write, output, { kind: "interactive.command.failed", data: { command: parsed.raw, error: forked.error ?? {} } });
        continue;
      }
      activeSessionId = forkedValue.childSessionId;
      await writeInteractiveControlResult(write, output, { ...result.value, sessionId: activeSessionId, parentSessionId: forkedValue.parentSessionId, message: `Forked session ${forkedValue.parentSessionId} -> ${activeSessionId}` });
      continue;
    }
    await writeInteractiveControlResult(write, output, result.value);
    if (result.value.action === "exit") break;
  }

  if (active) await active.done;
  await kernel.shutdown("interactive-exit");
  await writeInteractiveLine(write, output, { kind: "interactive.completed", data: { prompts, commands, cancellations, status: failed ? "failed" : "completed" } });
  return { status: failed ? "failed" : "completed", prompts, commands, cancellations, ...(activeSessionId ? { activeSessionId } : {}) };
}

async function createCliRuntimeDependencies(workspaceRoot = process.cwd()): Promise<RuntimeDependencies> {
  const deps = createDeterministicRuntimeDependencies();
  await registerRuntimeCoreTools(deps, workspaceRoot);
  return deps;
}

async function* readInteractiveLines(input: InteractiveInputStream): AsyncIterable<string> {
  let pending = "";
  for await (const chunk of input) {
    pending += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) yield line;
  }
  if (pending.length > 0) yield pending;
}

async function writeInteractiveControlResult(write: (line: string) => Promise<void>, output: CliOptions["output"], result: InteractiveControlResult): Promise<void> {
  await writeInteractiveLine(write, output, { kind: "interactive.command.completed", data: result });
}

async function writeInteractiveLine(write: (line: string) => Promise<void>, output: CliOptions["output"], event: JsonObject): Promise<void> {
  if (output === "stream-json") {
    await write(JSON.stringify(event));
    return;
  }
  const kind = String(event.kind ?? "interactive.event");
  const data = event.data && typeof event.data === "object" && !Array.isArray(event.data) ? event.data as JsonObject : {};
  if (kind === "interactive.started") {
    await write("DeepSeek interactive");
    await write("Type /help for controls.");
    return;
  }
  if (kind === "interactive.completed") {
    await write("[interactive completed]");
    return;
  }
  if (kind === "interactive.command.completed") {
    await write(String(data.message ?? "[command completed]"));
    if (Array.isArray(data.controls)) {
      for (const control of data.controls) {
        if (control && typeof control === "object" && "name" in control) {
          await write(`- ${String((control as { name?: unknown }).name)}`);
        }
      }
    }
    return;
  }
  if (kind === "interactive.command.failed") {
    await write(`[command failed] ${String(data.command ?? data.code ?? "")}`.trim());
    return;
  }
  if (kind === "interactive.busy") {
    await write(`[busy] ${String(data.message ?? "")}`.trim());
    return;
  }
  if (kind === "interactive.error") {
    await write(`[interactive error] ${String(data.message ?? "")}`.trim());
  }
}

function isEnvelopeWithInvocationId(value: unknown): value is { readonly invocationId: string } {
  return typeof value === "object" && value !== null && "invocationId" in value && typeof (value as { invocationId?: unknown }).invocationId === "string";
}

function terminalFlagsFromProcess(stdin: TerminalFlagSource = process.stdin, stdout: TerminalFlagSource = process.stdout): CliTerminalFlags {
  return { stdinIsTTY: stdin.isTTY === true, stdoutIsTTY: stdout.isTTY === true };
}

export function renderText(event: RuntimeEvent): string {
  if (event.kind === "model.delta") return String(event.data.text ?? "");
  if (event.kind === "capability.output") return String((event.data.output as { text?: string } | undefined)?.text ?? "");
  if (event.kind === "capability.completed") return "[kernel completed]";
  if (event.kind === "execution.rejected") return `[rejected] ${event.error?.message ?? ""}`.trim();
  if (event.kind === "turn.completed") return "[completed]";
  return `[${event.kind}]`;
}

export function renderStreamJson(event: RuntimeEvent): string {
  return JSON.stringify(event);
}

export async function runCli(args: readonly string[], write: (line: string) => void = console.log, input: InteractiveInputStream = process.stdin, terminal: CliTerminalFlags = terminalFlagsFromProcess()): Promise<void> {
  const options = parseCliArgs(args, terminal);
  if (options.command === "help") {
    for (const line of cliUsageLines()) write(line);
    return;
  }
  if (options.command === "interactive") {
    await runInteractiveCli({ input, write, output: options.output });
    return;
  }
  if (options.command === "readiness") {
    await runReadinessCommand(options, write);
    return;
  }
  if (options.command === "tools-smoke") {
    await runCoreToolsSmoke(write, options.output);
    return;
  }
  if (options.command === "session") {
    await runSessionCommand(options, write);
    return;
  }

  const deps = createDeterministicRuntimeDependencies();
  await registerRuntimeCoreTools(deps, process.cwd());
  const kernel = await createDefaultRuntimeKernel(deps);
  try {
    for await (const event of executeProjectedRuntimeTurn(deps, kernel, {
      capabilityId: options.capabilityId ?? runtimeEchoCapability.id,
      caller: options.command === "run" ? "cli.run" : "cli.turn",
      input: { text: options.prompt, prompt: options.prompt },
      prompt: options.prompt,
      timeoutMs: 30_000
    })) {
      write(options.output === "stream-json" ? renderStreamJson(event) : renderText(event));
    }
  } finally {
    await kernel.shutdown();
  }
}

async function runSessionCommand(options: CliOptions, write: (line: string) => void): Promise<void> {
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
  if (options.output === "stream-json") {
    write(JSON.stringify(result));
    return;
  }
  if (!result.ok || !result.value) {
    write(`[session failed] ${String(result.error?.message ?? options.sessionAction ?? "session")}`);
    return;
  }
  if ("childSessionId" in result.value) {
    write(`forked ${result.value.parentSessionId} -> ${result.value.childSessionId}`);
    return;
  }
  write(`resumed ${result.value.sessionId} (${result.value.eventCount} events)`);
}

function cliSessionError(code: string, message: string): JsonObject {
  return { code, message, retryable: false, redaction: { class: "public" } };
}

async function runCoreToolsSmoke(write: (line: string) => void, output: CliOptions["output"]): Promise<void> {
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
    for (const step of sequences) {
      const events = await collectRuntimeEvents(kernel.execute({
        capabilityId: step.capabilityId,
        caller: "cli.tools-smoke",
        input: step.input
      }));
      for (const event of events) {
        write(output === "stream-json" ? renderStreamJson(event) : renderText(event));
      }
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

async function runReadinessCommand(options: CliOptions, write: (line: string) => void): Promise<void> {
  if (!options.readinessCommand) return;
  const environment = await createCliReadinessEnvironment(options);
  const result = await invokeLocalReadinessCommand(options.readinessCommand, options.readinessInput ?? {}, environment);
  if (!result.ok || !result.value) {
    write(options.output === "stream-json" ? JSON.stringify(result) : `[readiness failed] ${result.error?.message ?? options.readinessCommand}`);
    return;
  }
  if (options.output === "stream-json") {
    write(JSON.stringify(result.value));
    return;
  }
  for (const line of renderReadinessText(result.value)) write(line);
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
          : missingLiveVerifierResult();
      }
    : undefined;

  const environment: LocalReadinessEnvironment = {
    cwd: workspaceRoot,
    nodeVersion: process.version,
    platform: `${platformDescriptor.os}:${platformDescriptor.environmentKind}`,
    packageName: "deekseek-cli",
    packageVersion: "0.1.0",
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
  return environment;
}

function missingLiveVerifierResult(): ModelLiveVerificationResult {
  return {
    ok: false,
    provider: { provider: "deepseek", protocol: "openai-chat-completions", model: defaultDeepSeekProfile.model },
    reachable: false,
    terminalStatus: "failed",
    eventKinds: [],
    diagnostics: [],
    redaction: { class: "internal" }
  };
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

function isReadinessCommand(value: string | undefined): value is ReadinessCommandName {
  return typeof value === "string" && readinessCommands.has(value as ReadinessCommandName);
}

export function isCliEntryPoint(entryPath = process.argv[1]): boolean {
  if (!entryPath) return false;
  return pathToFileURL(resolve(entryPath)).href === import.meta.url;
}

if (isCliEntryPoint()) {
  await runCli(process.argv.slice(2));
}
