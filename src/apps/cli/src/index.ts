#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { CapabilityId, JsonObject, ModelLiveVerificationResult, ReadinessCommandName, ReadinessCommandResult, RuntimeEvent } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import { invokeLocalReadinessCommand } from "@deepseek/command-system";
import type { LocalReadinessEnvironment } from "@deepseek/command-system";
import { PersistentConfigService } from "@deepseek/config";
import {
  CredentialAuthModelCredentialProvider,
  createDeepSeekCredentialAuthServiceFromEnv,
  createDeepSeekCredentialPresenceEnv
} from "@deepseek/credential-auth-management";
import { DeepSeekOpenAIProvider, DeterministicMockModelGateway, OpenAIModelProviderTransport, defaultDeepSeekProfile } from "@deepseek/model-gateway";
import { NodePlatformRuntime } from "@deepseek/platform-abstraction";
import { createDefaultRuntimeKernel, runtimeEchoCapability } from "@deepseek/runtime";
import { createDeterministicRuntimeDependencies } from "@deepseek/testing-regression";

export interface CliOptions {
  readonly command: "turn" | "run" | "readiness";
  readonly prompt: string;
  readonly output: "text" | "stream-json";
  readonly capabilityId?: CapabilityId;
  readonly readinessCommand?: ReadinessCommandName;
  readonly readinessInput?: JsonObject;
}

const readinessCommands = new Set<ReadinessCommandName>(["init", "config", "auth", "doctor", "privacy", "verify-install"]);

export function parseCliArgs(args: readonly string[]): CliOptions {
  const first = args[0];
  if (isReadinessCommand(first)) {
    const outputFlagIndex = args.indexOf("--output");
    const output = outputFlagIndex >= 0 && args[outputFlagIndex + 1] === "json" ? "stream-json" : "text";
    return { command: "readiness", readinessCommand: first, prompt: "", output, readinessInput: parseReadinessInput(first, args) };
  }
  const command = args[0] === "run" ? "run" : "turn";
  const effectiveArgs = command === "run" ? args.slice(1) : args;
  const promptIndex = effectiveArgs.indexOf("-p");
  const prompt = promptIndex >= 0 ? effectiveArgs[promptIndex + 1] ?? "" : effectiveArgs.filter((arg) => arg !== "--output" && arg !== "stream-json").join(" ");
  const capabilityIndex = effectiveArgs.indexOf("--capability");
  const capabilityId = capabilityIndex >= 0 ? asId<"capability">(effectiveArgs[capabilityIndex + 1] ?? String(runtimeEchoCapability.id)) : runtimeEchoCapability.id;
  const outputFlagIndex = args.indexOf("--output");
  const output = outputFlagIndex >= 0 && args[outputFlagIndex + 1] === "stream-json" ? "stream-json" : "text";
  return { command, prompt, output, capabilityId };
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

export async function runCli(args: readonly string[], write: (line: string) => void = console.log): Promise<void> {
  const options = parseCliArgs(args);
  if (options.command === "readiness") {
    await runReadinessCommand(options, write);
    return;
  }

  const deps = createDeterministicRuntimeDependencies();
  const kernel = await createDefaultRuntimeKernel(deps);
  try {
    for await (const event of kernel.execute({
      capabilityId: options.capabilityId ?? runtimeEchoCapability.id,
      caller: options.command === "run" ? "cli.run" : "cli.turn",
      input: { text: options.prompt, prompt: options.prompt },
      timeoutMs: 30_000
    })) {
      write(options.output === "stream-json" ? renderStreamJson(event) : renderText(event));
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
    platform: process.platform,
    packageName: "deekseek-cli",
    packageVersion: "0.1.0",
    env: createDeepSeekCredentialPresenceEnv(),
    ignoredPaths: [".env", ".env.*", "参考/"],
    availableCommands: ["node", "npm"],
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
