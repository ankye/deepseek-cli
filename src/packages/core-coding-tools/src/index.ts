import type {
  CapabilityExecutionContext,
  CapabilityManifest,
  CapabilityRegistry,
  CoreCodingToolName,
  CoreToolDiagnostic,
  CoreToolEvidence,
  CoreToolResult,
  FileEditInput,
  FileListInput,
  FileReadInput,
  FileWriteInput,
  GitEvidenceInput,
  JsonObject,
  PlatformRuntime,
  ProcessResult,
  SearchTextInput,
  SerializableResult,
  ShellProfile,
  ShellRunInput,
  TestRunInput,
  TodoPlanInput,
  WorkspaceEditTransaction,
  WorkspaceEditTransactionEvidence,
  WorkspaceTransactionResult,
  WorkspaceStateManager
} from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";
import {
  analyzeResourceScope,
  createSandboxAuditEvidence,
  createSandboxRequirement,
  createSecretRedactionDecision,
  redactJsonSecrets,
  redactSecretText
} from "@deepseek/policy-sandbox";

export const coreToolIds = {
  fileRead: asId<"capability">("core.file.read"),
  fileWrite: asId<"capability">("core.file.write"),
  fileEdit: asId<"capability">("core.file.edit"),
  fileList: asId<"capability">("core.file.list"),
  searchText: asId<"capability">("core.search.text"),
  shellRun: asId<"capability">("core.shell.run"),
  gitStatus: asId<"capability">("core.git.status"),
  gitDiff: asId<"capability">("core.git.diff"),
  testRun: asId<"capability">("core.test.run"),
  todoPlan: asId<"capability">("core.todo.plan")
} as const;

export interface CoreCodingToolsDependencies {
  readonly platform: PlatformRuntime;
  readonly workspaceState: WorkspaceStateManager;
  readonly workspaceRoot: string;
}

export async function registerCoreCodingTools(registry: CapabilityRegistry, deps: CoreCodingToolsDependencies): Promise<void> {
  for (const definition of coreToolDefinitions(deps)) {
    if (await registry.get(definition.manifest.id)) continue;
    await registry.register(definition.manifest, definition.execute);
  }
}

export async function registerCoreCodingToolsForRuntime(deps: {
  readonly capabilities: CapabilityRegistry;
  readonly platform: PlatformRuntime;
  readonly workspaceState: WorkspaceStateManager;
}, workspaceRoot: string): Promise<void> {
  await registerCoreCodingTools(deps.capabilities, {
    platform: deps.platform,
    workspaceState: deps.workspaceState,
    workspaceRoot
  });
}

export function coreToolManifests(): readonly CapabilityManifest[] {
  return coreToolDefinitions(undefined).map((definition) => definition.manifest);
}

function coreToolDefinitions(deps: CoreCodingToolsDependencies | undefined) {
  return [
    tool("file.read", coreToolIds.fileRead, "File Read", "read", ["workspace:read"], readSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => readFileTool(input, context, ready))),
    tool("file.write", coreToolIds.fileWrite, "File Write", "write", ["workspace:write"], writeSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => writeFileTool(input, context, ready))),
    tool("file.edit", coreToolIds.fileEdit, "File Edit", "write", ["workspace:write"], editSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => editFileTool(input, context, ready))),
    tool("file.list", coreToolIds.fileList, "File List", "read", ["workspace:read"], listSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => listFilesTool(input, context, ready))),
    tool("search.text", coreToolIds.searchText, "Search Text", "read", ["workspace:read"], searchSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => searchTextTool(input, context, ready))),
    tool("shell.run", coreToolIds.shellRun, "Shell Run", "process", ["process:run"], shellSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => shellRunTool(input, context, ready, "shell.run"))),
    tool("git.status", coreToolIds.gitStatus, "Git Status", "read", ["git:read"], gitSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => gitTool(input, context, ready, "status"))),
    tool("git.diff", coreToolIds.gitDiff, "Git Diff", "read", ["git:read"], gitSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => gitTool(input, context, ready, "diff"))),
    tool("test.run", coreToolIds.testRun, "Test Run", "process", ["process:test"], testSchema(), evidenceSchema(), (input, context) => requireDeps(deps).then((ready) => shellRunTool(input, context, ready, "test.run"))),
    tool("todo.plan", coreToolIds.todoPlan, "Todo Plan", "none", [], planSchema(), evidenceSchema(), (input, context) => planTool(input, context))
  ] as const;
}

function tool(
  toolName: CoreCodingToolName,
  id: CapabilityManifest["id"],
  name: string,
  sideEffect: CapabilityManifest["sideEffect"],
  permissions: readonly string[],
  inputSchema: JsonObject,
  outputSchema: JsonObject,
  execute: (input: JsonObject, context: CapabilityExecutionContext) => Promise<SerializableResult<CoreToolResult>>
) {
  const resourceScope = analyzeResourceScope({}, sideEffect);
  const sandboxRequirements = createSandboxRequirement({
    sideEffect,
    resourceScope,
    timeoutMs: sideEffect === "process" ? 30_000 : 10_000,
    permissions
  });
  return {
    toolName,
    manifest: {
      id,
      name,
      description: `Built-in governed ${toolName} coding tool.`,
      source: "builtin",
      version: "1.0.0",
      trust: "trusted" as const,
      sideEffect,
      permissions,
      inputSchema,
      outputSchema,
      enabled: true,
      timeoutMs: sideEffect === "process" ? 30_000 : 10_000,
      replayPolicy: { replayable: true, snapshot: "core-tool-evidence", deterministic: true },
      projection: {
        modelVisible: true,
        hostVisible: true,
        executorVisible: false
      },
      compatibility: {
        schemaVersion: "1.0.0",
        requiresPlatform: true
      },
      secretExposure: createSecretRedactionDecision("", { class: "public" }),
      resourceScope,
      sandboxRequirements,
      audit: createSandboxAuditEvidence({
        decision: "manifest",
        reasonCode: `manifest.${toolName}`,
        subject: "core-coding-tools",
        resource: String(id),
        sandboxProfile: sandboxRequirements.profile
      }),
      security: {
        modelVisible: true,
        hostVisible: true,
        executorVisible: false,
        outputRedaction: "secret-aware"
      }
    },
    execute
  };
}

async function requireDeps(deps: CoreCodingToolsDependencies | undefined): Promise<CoreCodingToolsDependencies> {
  if (!deps) throw new Error("CORE_TOOL_DEPENDENCIES_REQUIRED");
  return deps;
}

async function readFileTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as FileReadInput;
  const path = resolveToolPath(deps, parsed.workspaceRoot, parsed.path);
  if (!path.ok || !path.value) return failure("file.read", "PATH_REJECTED", path.error?.message ?? "Path rejected.", [String(parsed.path ?? "")]);
  const content = await deps.platform.readFile(path.value.path).catch((error: unknown) => undefinedError(error, "READ_FAILED"));
  if (isDiagnostic(content)) return failure("file.read", content.code, content.message, [path.value.path]);
  return success("file.read", [path.value.path], {
    preview: boundedText(content, parsed.limitBytes),
    metadata: { path: path.value.path, relativePath: path.value.relativePath },
    replay: replay(context)
  });
}

async function listFilesTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as FileListInput;
  const listRoot = resolveToolPath(deps, parsed.workspaceRoot, parsed.path ?? ".");
  if (!listRoot.ok || !listRoot.value) return failure("file.list", "PATH_REJECTED", listRoot.error?.message ?? "Path rejected.", [String(parsed.path ?? ".")]);
  const root = listRoot.value.path;
  const pattern = parsed.pattern ?? "";
  const files = [...await deps.platform.findFiles(pattern, root)].sort().slice(0, parsed.limit ?? 200);
  return success("file.list", files, {
    preview: boundedText(files.join("\n"), parsed.limitBytes ?? 8_000),
    metadata: { pattern, count: files.length, root, relativePath: listRoot.value.relativePath },
    replay: replay(context)
  });
}

async function searchTextTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as SearchTextInput;
  const root = parsed.workspaceRoot ?? deps.workspaceRoot;
  const results = (await deps.platform.searchText(parsed.pattern, root)).slice(0, parsed.limit ?? 50);
  return success("search.text", results.map((result) => result.path), {
    preview: boundedText(results.map((result) => `${result.path}:${result.line}: ${result.text}`).join("\n"), parsed.limitBytes),
    provider: results[0]?.metadata,
    metadata: { pattern: parsed.pattern, count: results.length },
    replay: replay(context)
  });
}

async function writeFileTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as FileWriteInput;
  const path = resolveToolPath(deps, parsed.workspaceRoot, parsed.path);
  if (!path.ok || !path.value) return failure("file.write", "PATH_REJECTED", path.error?.message ?? "Path rejected.", [String(parsed.path ?? "")]);
  const before = await deps.platform.readFile(path.value.path).catch(() => "");
  await deps.platform.writeFile(path.value.path, parsed.content);
  const transaction = editTransaction(context, path.value.path, "full-write", before, parsed.content, true, []);
  const workspaceTransaction = await deps.workspaceState.transact(toWorkspaceTransaction(transaction, before));
  return success("file.write", [path.value.path], {
    preview: boundedText(parsed.content, parsed.limitBytes),
    metadata: { transaction: publicTransactionEvidence(transaction, workspaceTransaction), checkpoint: workspaceTransaction.checkpoints[0] },
    replay: replay(context)
  });
}

async function editFileTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as FileEditInput;
  const path = resolveToolPath(deps, parsed.workspaceRoot, parsed.path);
  if (!path.ok || !path.value) return failure("file.edit", "PATH_REJECTED", path.error?.message ?? "Path rejected.", [String(parsed.path ?? "")]);
  const before = await deps.platform.readFile(path.value.path).catch((error: unknown) => undefinedError(error, "READ_FAILED"));
  if (isDiagnostic(before)) return failure("file.edit", before.code, before.message, [path.value.path]);
  const occurrences = countOccurrences(before, parsed.expected);
  if (occurrences !== 1) {
    const diagnostic = diag("EDIT_PRECONDITION_FAILED", `Expected text must appear exactly once; found ${occurrences}.`);
    const transaction = editTransaction(context, path.value.path, "exact-match", before, before, false, [diagnostic]);
    return failure("file.edit", diagnostic.code, diagnostic.message, [path.value.path], { transaction });
  }
  const after = before.replace(parsed.expected, parsed.replacement);
  await deps.platform.writeFile(path.value.path, after);
  const transaction = editTransaction(context, path.value.path, "exact-match", before, after, true, []);
  const workspaceTransaction = await deps.workspaceState.transact(toWorkspaceTransaction(transaction, before));
  return success("file.edit", [path.value.path], {
    preview: boundedText(after, parsed.limitBytes),
    metadata: { transaction: publicTransactionEvidence(transaction, workspaceTransaction), checkpoint: workspaceTransaction.checkpoints[0], changedRanges: [{ start: before.indexOf(parsed.expected), oldLength: parsed.expected.length, newLength: parsed.replacement.length }] },
    replay: replay(context)
  });
}

async function shellRunTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies, toolName: "shell.run" | "test.run"): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as ShellRunInput | TestRunInput;
  const cwdPath = resolveToolPath(deps, parsed.workspaceRoot, parsed.cwd ?? ".");
  if (!cwdPath.ok || !cwdPath.value) return failure(toolName, "PATH_REJECTED", cwdPath.error?.message ?? "Path rejected.", [String(parsed.cwd ?? ".")]);
  const cwd = cwdPath.value.path;
  const shellProfile = typeof (parsed as ShellRunInput).shellProfile === "string" ? (parsed as ShellRunInput).shellProfile as ShellProfile : undefined;
  if (shellProfile) {
    const shell = await deps.platform.resolveShell(shellProfile);
    if (!shell.ok) return failure(toolName, shell.error?.code ?? "SHELL_UNAVAILABLE", shell.error?.message ?? "Shell unavailable.", [cwd]);
  }
  const processProvider = await deps.platform.resolveProcessProvider();
  if (!processProvider.available) {
    return failure(toolName, "PROCESS_UNAVAILABLE", processProvider.diagnostics[0]?.message ?? "Process unavailable.", [cwd], { processProvider });
  }
  const result = await deps.platform.runProcess(parsed.command, parsed.args ?? [], { cwd, timeoutMs: parsed.timeoutMs ?? 30_000 });
  return processEvidence(toolName, result, cwd, context, parsed.limitBytes, toolName === "test.run" ? { intent: (parsed as TestRunInput).intent ?? "test" } : {});
}

async function gitTool(input: JsonObject, context: CapabilityExecutionContext, deps: CoreCodingToolsDependencies, mode: "status" | "diff"): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as GitEvidenceInput;
  const cwdPath = resolveToolPath(deps, parsed.workspaceRoot, ".");
  if (!cwdPath.ok || !cwdPath.value) return failure(mode === "status" ? "git.status" : "git.diff", "PATH_REJECTED", cwdPath.error?.message ?? "Path rejected.", [String(parsed.workspaceRoot ?? ".")]);
  const cwd = cwdPath.value.path;
  const result = await deps.platform.runProcess("git", mode === "status" ? ["status", "--short"] : ["diff"], { cwd });
  return processEvidence(mode === "status" ? "git.status" : "git.diff", result, cwd, context, parsed.limitBytes, { gitMode: mode });
}

async function planTool(input: JsonObject, context: CapabilityExecutionContext): Promise<SerializableResult<CoreToolResult>> {
  const parsed = input as TodoPlanInput;
  const invalid = parsed.items.filter((item) => !new Set(["pending", "in_progress", "completed", "blocked"]).has(item.status));
  if (invalid.length > 0) return failure("todo.plan", "PLAN_STATUS_INVALID", "Plan contains invalid status values.", []);
  return success("todo.plan", [], {
    preview: boundedText(parsed.items.map((item) => `${item.status}: ${item.title}`).join("\n"), 8_000),
    metadata: { items: parsed.items, count: parsed.items.length },
    replay: replay(context)
  });
}

function processEvidence(toolName: CoreCodingToolName, result: ProcessResult, cwd: string, context: CapabilityExecutionContext, limitBytes = 8_000, metadata: JsonObject = {}): SerializableResult<CoreToolResult> {
  const output = result.stdout || result.stderr;
  return success(toolName, [cwd], {
    preview: boundedText(output, limitBytes),
    provider: result.metadata,
    metadata: { ...metadata, cwd, exitCode: result.exitCode, stderrPreview: boundedText(result.stderr, limitBytes) },
    replay: replay(context),
    status: result.exitCode === 0 ? "completed" : "failed"
  });
}

function resolveToolPath(deps: CoreCodingToolsDependencies, workspaceRoot: string | undefined, path: string) {
  return deps.platform.resolveWorkspacePath(workspaceRoot ?? deps.workspaceRoot, path);
}

function success(tool: CoreCodingToolName, affectedPaths: readonly string[], options: {
  readonly preview?: ReturnType<typeof boundedText>;
  readonly provider?: CoreToolEvidence["provider"];
  readonly metadata?: JsonObject;
  readonly replay?: JsonObject;
  readonly status?: CoreToolEvidence["status"];
}): SerializableResult<CoreToolResult> {
  return {
    ok: true,
    value: {
      evidence: {
        tool,
        status: options.status ?? "completed",
        affectedPaths: affectedPaths.map(redactSecretText),
        ...(options.preview ? { preview: options.preview } : {}),
        ...(options.provider ? { provider: options.provider } : {}),
        diagnostics: [],
        metadata: redactJsonSecrets(options.metadata ?? {}) as JsonObject,
        replay: options.replay ?? {},
        redaction: { class: "internal", fields: ["preview.text", "affectedPaths"] }
      }
    }
  };
}

function failure(tool: CoreCodingToolName, code: string, message: string, affectedPaths: readonly string[], metadata: JsonObject = {}): SerializableResult<CoreToolResult> {
  const diagnostic = diag(code, redactSecretText(message));
  return {
    ok: false,
    error: diagnostic,
    value: {
      evidence: {
        tool,
        status: "rejected",
        affectedPaths: affectedPaths.map(redactSecretText),
        diagnostics: [diagnostic],
        metadata: redactJsonSecrets(metadata) as JsonObject,
        replay: {},
        redaction: { class: "internal", fields: ["affectedPaths"] }
      }
    }
  };
}

function boundedText(text: string, limitBytes = 8_000) {
  const safeText = redactSecretText(text);
  const truncated = Buffer.byteLength(safeText, "utf8") > limitBytes;
  const limited = truncated ? safeText.slice(0, limitBytes) : safeText;
  return {
    text: limited,
    byteLength: Buffer.byteLength(safeText, "utf8"),
    lineCount: safeText.length === 0 ? 0 : safeText.split(/\r?\n/).length,
    truncated,
    limitBytes,
    redaction: { class: "internal" as const }
  };
}

function diag(code: string, message: string): CoreToolDiagnostic {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal" }
  };
}

function undefinedError(error: unknown, code: string): CoreToolDiagnostic {
  return diag(code, error instanceof Error ? error.message : "Operation failed.");
}

function isDiagnostic(value: unknown): value is CoreToolDiagnostic {
  return typeof value === "object" && value !== null && "code" in value && "message" in value;
}

function countOccurrences(content: string, expected: string): number {
  if (expected.length === 0) return 0;
  let count = 0;
  let index = 0;
  while ((index = content.indexOf(expected, index)) >= 0) {
    count += 1;
    index += expected.length;
  }
  return count;
}

function replay(context: CapabilityExecutionContext): JsonObject {
  return {
    envelopeId: context.envelope.invocationId,
    traceId: context.trace.traceId,
    snapshot: "core-tool-evidence"
  };
}

function editTransaction(
  context: CapabilityExecutionContext,
  path: string,
  precondition: WorkspaceEditTransactionEvidence["precondition"],
  before: string,
  after: string,
  applied: boolean,
  diagnostics: readonly CoreToolDiagnostic[]
): WorkspaceEditTransactionEvidence {
  return {
    id: `${context.envelope.invocationId}:${path}`,
    ...(context.envelope.sessionId ? { sessionId: context.envelope.sessionId } : {}),
    capabilityId: context.envelope.capabilityId,
    path,
    precondition,
    beforeHash: hashText(before),
    afterHash: hashText(after),
    rollback: { content: redactSecretText(before), contentHash: hashText(before) },
    applied,
    diagnostics,
    redaction: { class: "internal", fields: ["path", "rollback.content"] }
  };
}

function toWorkspaceTransaction(evidence: WorkspaceEditTransactionEvidence, rollbackContent: string): WorkspaceEditTransaction {
  return {
    id: evidence.id,
    sessionId: evidence.sessionId ?? asId<"session">("session-unbound"),
    edits: [{
      path: evidence.path,
      precondition: evidence.precondition,
      applied: evidence.applied,
      beforeHash: evidence.beforeHash,
      afterHash: evidence.afterHash
    }],
    rollback: {
      content: rollbackContent,
      contentHash: evidence.rollback.contentHash,
      redaction: { class: "sensitive", fields: ["content"] }
    }
  };
}

function publicTransactionEvidence(evidence: WorkspaceEditTransactionEvidence, result: WorkspaceTransactionResult): WorkspaceEditTransactionEvidence {
  return {
    ...evidence,
    rollback: { contentHash: evidence.rollback.contentHash },
    metadata: {
      checkpointIds: result.checkpoints.map((checkpoint) => checkpoint.checkpointId)
    },
    redaction: { class: "internal", fields: ["path", "rollback.content"] }
  };
}

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function readSchema(): JsonObject {
  return objectSchema(["path"], { path: { type: "string" }, workspaceRoot: { type: "string" }, limitBytes: { type: "number" } });
}

function writeSchema(): JsonObject {
  return objectSchema(["path", "content"], { path: { type: "string" }, content: { type: "string" }, workspaceRoot: { type: "string" }, limitBytes: { type: "number" } });
}

function editSchema(): JsonObject {
  return objectSchema(["path", "expected", "replacement"], { path: { type: "string" }, expected: { type: "string" }, replacement: { type: "string" }, workspaceRoot: { type: "string" }, limitBytes: { type: "number" } });
}

function listSchema(): JsonObject {
  return objectSchema([], { pattern: { type: "string" }, path: { type: "string" }, workspaceRoot: { type: "string" }, limit: { type: "number" }, limitBytes: { type: "number" } });
}

function searchSchema(): JsonObject {
  return objectSchema(["pattern"], { pattern: { type: "string" }, workspaceRoot: { type: "string" }, limit: { type: "number" }, limitBytes: { type: "number" } });
}

function shellSchema(): JsonObject {
  return objectSchema(["command"], { command: { type: "string" }, args: { type: "array" }, cwd: { type: "string" }, workspaceRoot: { type: "string" }, timeoutMs: { type: "number" }, limitBytes: { type: "number" }, shellProfile: { type: "string" } });
}

function gitSchema(): JsonObject {
  return objectSchema([], { workspaceRoot: { type: "string" }, limitBytes: { type: "number" } });
}

function testSchema(): JsonObject {
  return objectSchema(["command"], { command: { type: "string" }, args: { type: "array" }, cwd: { type: "string" }, workspaceRoot: { type: "string" }, timeoutMs: { type: "number" }, limitBytes: { type: "number" }, intent: { type: "string" } });
}

function planSchema(): JsonObject {
  return objectSchema(["items"], { items: { type: "array" } });
}

function evidenceSchema(): JsonObject {
  return objectSchema(["evidence"], { evidence: { type: "object" } });
}

function objectSchema(required: readonly string[], properties: JsonObject): JsonObject {
  return {
    type: "object",
    additionalProperties: false,
    required,
    properties
  };
}
