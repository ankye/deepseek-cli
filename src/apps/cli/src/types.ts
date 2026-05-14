import type {
  AgentLoopOutputMode,
  DiagnosticsCommandName,
  ExtensionManagementCommandKind,
  JsonObject,
  CliKeymapProfileName,
  ReadinessCommandName,
  RuntimeDependencies,
  RuntimeKernel,
  SessionId,
  TurnId,
  WorkspaceRevertRequestTarget
} from "@deepseek/platform-contracts";

export interface CliTerminalFlags {
  readonly stdinIsTTY: boolean;
  readonly stdoutIsTTY: boolean;
}

export type CliCommand = "run" | "chat" | "readiness" | "diagnostics" | "extension" | "palette" | "revert" | "tools-smoke" | "help" | "session" | "mcp" | "index-provider";
export type CliPaletteAction = "list" | "keymap" | "action";
export type CliRevertAction = "preview" | "apply";
export type CliIndexProviderAction = "status" | "set";

export interface CliOptions {
  readonly command: CliCommand;
  readonly prompt: string;
  readonly output: AgentLoopOutputMode;
  readonly live: boolean;
  readonly timeoutMs?: number;
  readonly readinessCommand?: ReadinessCommandName;
  readonly readinessInput?: JsonObject;
  readonly diagnosticsCommand?: DiagnosticsCommandName;
  readonly diagnosticsInput?: JsonObject;
  readonly extensionCommand?: ExtensionManagementCommandKind;
  readonly extensionInput?: JsonObject;
  readonly paletteAction?: CliPaletteAction;
  readonly paletteKeymapProfile?: CliKeymapProfileName;
  readonly paletteActionName?: string;
  readonly paletteTargetId?: string;
  readonly revertAction?: CliRevertAction;
  readonly revertTarget?: WorkspaceRevertRequestTarget;
  readonly revertReason?: string;
  readonly sessionAction?: "resume" | "fork";
  readonly sessionId?: SessionId;
  readonly turnId?: TurnId;
  readonly parentSessionId?: SessionId;
  readonly mcpAction?: "test";
  readonly mcpManifestPath?: string;
  readonly mcpCallTool?: string;
  readonly mcpCallInput?: string;
  readonly enableRealMcp?: boolean;
  readonly indexProviderAction?: CliIndexProviderAction;
  readonly indexProviderId?: string;
  readonly indexProviderStatus?: string;
  readonly indexProviderScope?: "workspace" | "user";
  readonly toolProjection?: "read-only" | "read-write" | "all";
}

export type CliWrite = (line: string) => void | Promise<void>;
export type CliInputChunk = Uint8Array | string;
export type CliInputStream = AsyncIterable<CliInputChunk> | Iterable<CliInputChunk>;

export interface CliRuntimeFactoryOptions {
  readonly live: boolean;
  readonly workspaceRoot: string;
  readonly toolProjection?: CliOptions["toolProjection"];
}

export interface CliRunOptions {
  readonly createRuntime?: (options: CliRuntimeFactoryOptions) => Promise<{ readonly deps: RuntimeDependencies; readonly kernel: RuntimeKernel }>;
}
