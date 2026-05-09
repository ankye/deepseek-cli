import { mkdir, readFile as fsReadFile, rename, rm, writeFile as fsWriteFile, readdir } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, resolve } from "node:path";
import { spawn } from "node:child_process";
import type {
  JsonObject,
  NativeCapabilityName,
  NativeCapabilityProbe,
  PlatformDescriptor,
  PlatformDiagnostic,
  PlatformEnvironmentKind,
  PlatformOsFamily,
  PlatformPathTranslation,
  PlatformPersistenceDiagnostic,
  PlatformPersistenceMetadata,
  PlatformProviderName,
  PlatformProviderResultMetadata,
  PlatformRuntime,
  PlatformResolvedPath,
  ProcessProviderDescriptor,
  ProcessResult,
  RedactedError,
  SandboxCapabilityMatrix,
  SearchProviderDescriptor,
  SearchResult,
  SecureStorageCapability,
  SerializableResult,
  ShellProfile,
  ShellProviderDescriptor,
  WatcherCapability
} from "@deepseek/platform-contracts";
import { SECRET_SANDBOX_SCHEMA_VERSION } from "@deepseek/platform-contracts";

export class NodePlatformRuntime implements PlatformRuntime {
  readonly os: PlatformOsFamily;
  readonly environmentKind: PlatformEnvironmentKind;
  readonly architecture: string;
  private readonly noLocalShell: boolean;
  private readonly readOnlyFilesystem: boolean;
  private readonly networkStatus: PlatformProviderResultMetadata["status"];

  constructor(
    os: PlatformOsFamily = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux",
    options: {
      readonly environmentKind?: PlatformEnvironmentKind;
      readonly architecture?: string;
      readonly noLocalShell?: boolean;
      readonly readOnlyFilesystem?: boolean;
      readonly networkStatus?: PlatformProviderResultMetadata["status"];
    } = {}
  ) {
    this.os = os;
    this.environmentKind = options.environmentKind ?? detectEnvironmentKind();
    this.architecture = options.architecture ?? process.arch;
    this.noLocalShell = options.noLocalShell ?? this.environmentKind === "remote";
    this.readOnlyFilesystem = options.readOnlyFilesystem ?? false;
    this.networkStatus = options.networkStatus ?? "available";
  }

  async descriptor(): Promise<PlatformDescriptor> {
    const shell = (await this.resolveShell()).value ?? unavailableShell("none", "SHELL_UNAVAILABLE", "No shell provider is available on this host.");
    const processProvider = await this.resolveProcessProvider();
    const search = await this.selectSearchProvider();
    const secureStorage = await this.secureStorageCapability();
    const watcher = await this.watcherCapability(process.cwd());
    const nativeCapabilities = await Promise.all(
      (["voice", "clipboard", "url-handler", "image-processing", "file-watcher", "secure-storage"] as const).map((capability) => this.probeNativeCapability(capability))
    );
    const diagnostics = [
      ...shell.diagnostics,
      ...processProvider.diagnostics,
      ...search.diagnostics,
      ...secureStorage.diagnostics,
      ...watcher.diagnostics,
      ...nativeCapabilities.flatMap((capability) => capability.diagnostics)
    ];
    const degradedReasons = diagnostics.filter((diagnostic) => diagnostic.severity !== "info").map((diagnostic) => diagnostic.code);
    const sandbox = sandboxCapabilities({
      filesystemReadOnly: this.readOnlyFilesystem,
      shell,
      processProvider,
      secureStorage,
      nativeCapabilities,
      networkStatus: this.networkStatus,
      degradedReasons
    });
    return {
      os: this.os,
      environmentKind: this.environmentKind,
      architecture: this.architecture,
      shell,
      processProvider,
      search,
      secureStorage,
      nativeCapabilities,
      watcher,
      filesystem: filesystemSemantics(this.os),
      sandbox,
      degraded: sandbox.degraded,
      degradedReasons: sandbox.degradedReasons,
      diagnostics,
      redaction: { class: "internal", fields: ["diagnostics.details"] }
    };
  }

  async resolveShell(profile: ShellProfile = defaultShellProfile(this.os)): Promise<SerializableResult<ShellProviderDescriptor>> {
    if (this.noLocalShell || profile === "none") {
      const shell = unavailableShell(profile, "SHELL_UNAVAILABLE", this.noLocalShell ? "This host does not expose a local shell." : "Shell execution was not requested.");
      return profile === "none" && !this.noLocalShell ? { ok: true, value: shell } : { ok: false, error: platformError("SHELL_UNAVAILABLE", shell.diagnostics[0]?.message ?? "Shell unavailable.", { profile }) };
    }
    if (profile === "powershell") {
      return {
        ok: true,
        value: {
          profile,
          provider: "powershell",
          available: true,
          status: "available",
          command: this.os === "windows" ? "powershell.exe" : "pwsh",
          args: ["-NoProfile", "-Command"],
          requiresShellSyntax: true,
          diagnostics: [],
          redaction: { class: "public" }
        }
      };
    }
    if (profile === "cmd") {
      return {
        ok: true,
        value: {
          profile,
          provider: "cmd",
          available: this.os === "windows",
          status: this.os === "windows" ? "available" : "unavailable",
          command: "cmd.exe",
          args: ["/d", "/s", "/c"],
          requiresShellSyntax: true,
          diagnostics: this.os === "windows" ? [] : [diagnostic("CMD_UNAVAILABLE", "warn", "cmd shell is only available on Windows.")],
          redaction: { class: "public" }
        }
      };
    }
    return {
      ok: true,
      value: {
        profile,
        provider: profile === "bash" ? "bash" : "bash",
        available: true,
        status: this.os === "windows" ? "degraded" : "available",
        command: profile === "bash" ? "bash" : "sh",
        args: ["-lc"],
        requiresShellSyntax: true,
        diagnostics: this.os === "windows" ? [diagnostic("POSIX_SHELL_ON_WINDOWS", "warn", "POSIX shell on Windows depends on user-installed tooling.")] : [],
        redaction: { class: "public" }
      }
    };
  }

  async selectSearchProvider(preferred?: PlatformProviderName): Promise<SearchProviderDescriptor> {
    const fallbackChain = searchFallbackChain(this.os);
    const selected = preferred && fallbackChain.includes(preferred) ? preferred : fallbackChain[0] ?? "js";
    const degraded = selected === "js";
    return {
      provider: selected,
      available: true,
      status: degraded ? "degraded" : "available",
      timeoutMs: this.environmentKind === "wsl" ? 20_000 : 10_000,
      fallbackChain,
      diagnostics: degraded ? [diagnostic("SEARCH_JS_FALLBACK", "warn", "Search provider is using deterministic JavaScript fallback.")] : [],
      redaction: { class: "public" }
    };
  }

  async resolveProcessProvider(): Promise<ProcessProviderDescriptor> {
    if (this.environmentKind === "remote") {
      return {
        provider: "none",
        available: false,
        status: "unavailable",
        shell: false,
        diagnostics: [diagnostic("PROCESS_UNAVAILABLE", "error", "Remote host does not expose local process execution.")],
        redaction: { class: "public" }
      };
    }
    return {
      provider: "argv",
      available: true,
      status: "available",
      shell: false,
      diagnostics: [],
      redaction: { class: "public" }
    };
  }

  resolveWorkspacePath(workspaceRoot: string, inputPath: string): SerializableResult<PlatformResolvedPath> {
    if (inputPath.startsWith("~") || hasAmbiguousDriveRelativePath(inputPath) || inputPath.includes("\0")) {
      return {
        ok: false,
        error: platformError("PLATFORM_PATH_REJECTED", "Workspace path contains unsupported home, drive-relative, or null-byte syntax.", { inputPath })
      };
    }
    const root = resolve(workspaceRoot);
    const target = isAbsolute(inputPath) ? resolve(inputPath) : resolve(root, inputPath);
    if (!isPathInside(root, target)) {
      return {
        ok: false,
        error: platformError("PLATFORM_PATH_OUTSIDE_ROOT", "Workspace path resolved outside the governed root.", { workspaceRoot: root })
      };
    }
    return {
      ok: true,
      value: {
        path: target,
        root,
        relativePath: normalize(target.slice(root.length).replace(/^[/\\]/, "")),
        safe: true,
        diagnostics: [],
        redaction: { class: "internal", fields: ["path", "root", "relativePath"] }
      }
    };
  }

  translatePath(path: string, targetEnvironment: PlatformEnvironmentKind): SerializableResult<PlatformPathTranslation> {
    if (path.startsWith("~") || hasAmbiguousDriveRelativePath(path)) {
      return { ok: false, error: platformError("PATH_TRANSLATION_REJECTED", "Path translation rejected unsafe path syntax.", { path }) };
    }
    const translatedPath = this.environmentKind === "wsl" && targetEnvironment === "local" && path.startsWith("/mnt/")
      ? wslToWindowsPath(path)
      : normalize(path);
    return {
      ok: true,
      value: {
        sourcePath: path,
        translatedPath,
        sourceEnvironment: this.environmentKind,
        targetEnvironment,
        metadata: providerMetadata("js", "available", [], undefined, []),
        redaction: { class: "internal", fields: ["sourcePath", "translatedPath"] }
      }
    };
  }

  async secureStorageCapability(): Promise<SecureStorageCapability> {
    const unavailable = this.environmentKind === "ci" || this.environmentKind === "remote";
    return {
      status: unavailable ? "unavailable" : "degraded",
      provider: unavailable ? "none" : "environment",
      scopedReferences: !unavailable,
      diagnostics: unavailable
        ? [diagnostic("SECURE_STORAGE_UNAVAILABLE", "warn", "Secure storage is unavailable in this host mode.")]
        : [diagnostic("SECURE_STORAGE_ENV_ONLY", "warn", "Secure storage is limited to environment-backed credential references.")],
      redaction: { class: "secret", fields: ["provider"] }
    };
  }

  async probeNativeCapability(capability: NativeCapabilityName): Promise<NativeCapabilityProbe> {
    if (capability === "secure-storage") {
      const secureStorage = await this.secureStorageCapability();
      return {
        capability,
        status: secureStorage.status,
        provider: secureStorage.provider,
        diagnostics: secureStorage.diagnostics,
        redaction: { class: "internal" }
      };
    }
    if (capability === "file-watcher") {
      const watcher = await this.watcherCapability(process.cwd());
      return {
        capability,
        status: watcher.status,
        provider: watcher.provider,
        diagnostics: watcher.diagnostics,
        redaction: { class: "internal" }
      };
    }
    return {
      capability,
      status: "unavailable",
      provider: "none",
      diagnostics: [diagnostic("NATIVE_CAPABILITY_UNAVAILABLE", "warn", `Native capability ${capability} is not available in the base platform adapter.`)],
      redaction: { class: "internal" }
    };
  }

  async watcherCapability(_root: string): Promise<WatcherCapability> {
    const unavailable = this.environmentKind === "remote";
    return {
      status: unavailable ? "unavailable" : "degraded",
      provider: unavailable ? "none" : "polling",
      recursive: !unavailable,
      diagnostics: unavailable ? [diagnostic("WATCHER_UNAVAILABLE", "warn", "File watching is unavailable without local filesystem access.")] : [diagnostic("WATCHER_POLLING", "info", "File watching uses deterministic polling semantics.")],
      redaction: { class: "internal" }
    };
  }

  resolvePath(...parts: readonly string[]): string {
    return resolve(...parts);
  }

  userConfigPath(appName: string): string {
    if (this.os === "windows") return resolve(process.env.APPDATA ?? join(process.cwd(), ".appdata"), appName, "config.json");
    if (this.os === "macos") return resolve(process.env.HOME ?? process.cwd(), "Library", "Application Support", appName, "config.json");
    return resolve(process.env.XDG_CONFIG_HOME ?? join(process.env.HOME ?? process.cwd(), ".config"), appName, "config.json");
  }

  workspaceMetadataPath(workspaceRoot: string, appName: string): SerializableResult<string> {
    const root = resolve(workspaceRoot);
    const metadataPath = resolve(root, `.${appName}`, "config.json");
    if (!isPathInside(root, metadataPath)) {
      return {
        ok: false,
        error: {
          code: "WORKSPACE_METADATA_PATH_OUTSIDE_ROOT",
          message: "Workspace metadata path resolved outside the workspace root.",
          retryable: false,
          redaction: { class: "public" },
          details: { workspaceRoot: root }
        }
      };
    }
    return { ok: true, value: metadataPath };
  }

  async atomicWriteFile(path: string, content: string): Promise<SerializableResult<PlatformPersistenceMetadata>> {
    if (this.readOnlyFilesystem) {
      return {
        ok: false,
        error: {
          code: "FILESYSTEM_READ_ONLY",
          message: "The active platform reports a read-only filesystem.",
          retryable: false,
          redaction: { class: "public" },
          details: { path: resolve(path), os: this.os }
        }
      };
    }
    const target = resolve(path);
    const temp = `${target}.tmp`;
    try {
      await mkdir(dirname(target), { recursive: true });
      await fsWriteFile(temp, content, "utf8");
      await rename(temp, target);
      return {
        ok: true,
        value: {
          path: target,
          pathKind: "workspace-metadata",
          os: this.os,
          atomic: true,
          redaction: { class: "internal", fields: ["path"] }
        }
      };
    } catch (error) {
      await rm(temp, { force: true }).catch(() => undefined);
      return {
        ok: false,
        error: {
          code: "ATOMIC_WRITE_FAILED",
          message: error instanceof Error ? error.message : "Atomic write failed.",
          retryable: true,
          redaction: { class: "public" },
          details: { path: target, os: this.os }
        }
      };
    }
  }

  async permissionDiagnostics(path: string): Promise<readonly PlatformPersistenceDiagnostic[]> {
    return [
      {
        code: "PERMISSION_DIAGNOSTIC_AVAILABLE",
        severity: "info",
        message: "Permission diagnostics are available for the configured platform adapter.",
        path: resolve(path),
        os: this.os,
        suggestedActions: [],
        redaction: { class: "internal", fields: ["path"] }
      }
    ];
  }

  async readFile(path: string): Promise<string> {
    return fsReadFile(path, "utf8");
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (this.readOnlyFilesystem) throw new Error("FILESYSTEM_READ_ONLY");
    await fsWriteFile(path, content, "utf8");
  }

  async findFiles(pattern: string, root: string): Promise<readonly string[]> {
    const files: string[] = [];
    await walk(root, files);
    return files.filter((file) => file.includes(pattern));
  }

  async searchText(pattern: string, root: string): Promise<readonly SearchResult[]> {
    const provider = await this.selectSearchProvider();
    const metadata = providerMetadata(provider.provider, provider.status, provider.fallbackChain, provider.diagnostics[0]?.code, provider.diagnostics);
    const files: string[] = [];
    await walk(root, files);
    const results: SearchResult[] = [];
    for (const file of files) {
      const content = await fsReadFile(file, "utf8").catch(() => "");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.includes(pattern)) {
          results.push({
            path: file,
            line: index + 1,
            text: line,
            engine: provider.provider === "rg" || provider.provider === "grep" || provider.provider === "select-string" ? provider.provider : "js",
            ...(metadata.fallbackReason ? { fallbackReason: metadata.fallbackReason } : {}),
            metadata
          });
        }
      });
    }
    return results;
  }

  async runProcess(command: string, args: readonly string[], options: JsonObject = {}): Promise<ProcessResult> {
    const processProvider = await this.resolveProcessProvider();
    if (!processProvider.available) {
      return {
        exitCode: 126,
        stdout: "",
        stderr: processProvider.diagnostics[0]?.message ?? "Process execution is unavailable.",
        metadata: providerMetadata("none", "unavailable", [], processProvider.diagnostics[0]?.code, processProvider.diagnostics)
      };
    }
    return new Promise((resolvePromise) => {
      const child = spawn(command, [...args], {
        cwd: typeof options.cwd === "string" ? options.cwd : undefined,
        shell: false
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      child.on("close", (exitCode) => resolvePromise({ exitCode: exitCode ?? 0, stdout, stderr, metadata: providerMetadata("argv", "available", [], undefined, []) }));
      child.on("error", (error) => resolvePromise({ exitCode: 1, stdout, stderr: error.message, metadata: providerMetadata("argv", "degraded", [], "PROCESS_SPAWN_FAILED", [diagnostic("PROCESS_SPAWN_FAILED", "error", error.message)]) }));
    });
  }

  async availability(): Promise<JsonObject> {
    const descriptor = await this.descriptor();
    return {
      os: this.os,
      environmentKind: this.environmentKind,
      descriptor,
      searchFallbacks: descriptor.search.fallbackChain,
      degraded: descriptor.degraded,
      degradedReasons: descriptor.degradedReasons
    };
  }
}

export class FakePlatformRuntime extends NodePlatformRuntime {
  private readonly files = new Map<string, string>();
  failNextAtomicWrite = false;

  constructor(
    os: PlatformOsFamily = "fake",
    private readonly fakeRoot = "/workspace",
    options: {
      readonly environmentKind?: PlatformEnvironmentKind;
      readonly noLocalShell?: boolean;
      readonly secureStorageStatus?: "available" | "degraded" | "unavailable";
      readonly nativeStatus?: "available" | "degraded" | "unavailable";
      readonly searchProvider?: PlatformProviderName;
      readonly readOnlyFilesystem?: boolean;
      readonly networkStatus?: PlatformProviderResultMetadata["status"];
    } = {}
  ) {
    super(os, {
      environmentKind: options.environmentKind ?? "test",
      architecture: "fake-arch",
      noLocalShell: options.noLocalShell ?? false,
      readOnlyFilesystem: options.readOnlyFilesystem ?? false,
      networkStatus: options.networkStatus ?? "available"
    });
    this.fakeOptions = options;
  }

  private readonly fakeOptions: {
    readonly environmentKind?: PlatformEnvironmentKind;
    readonly noLocalShell?: boolean;
    readonly secureStorageStatus?: "available" | "degraded" | "unavailable";
    readonly nativeStatus?: "available" | "degraded" | "unavailable";
    readonly searchProvider?: PlatformProviderName;
    readonly readOnlyFilesystem?: boolean;
    readonly networkStatus?: PlatformProviderResultMetadata["status"];
  };

  override userConfigPath(appName: string): string {
    if (this.os === "windows") return normalize(`C:/Users/fake/AppData/Roaming/${appName}/config.json`);
    if (this.os === "macos") return normalize(`/Users/fake/Library/Application Support/${appName}/config.json`);
    if (this.os === "linux") return normalize(`/home/fake/.config/${appName}/config.json`);
    return normalize(`${this.fakeRoot}/.config/${appName}/config.json`);
  }

  override workspaceMetadataPath(workspaceRoot: string, appName: string): SerializableResult<string> {
    if (workspaceRoot.includes("..") || workspaceRoot.startsWith("~")) {
      return {
        ok: false,
        error: {
          code: "WORKSPACE_METADATA_PATH_REJECTED",
          message: "Workspace metadata path contains unsafe segments.",
          retryable: false,
          redaction: { class: "public" }
        }
      };
    }
    const root = isAbsolute(workspaceRoot) ? normalize(workspaceRoot) : normalize(`${this.fakeRoot}/${workspaceRoot}`);
    return { ok: true, value: normalize(`${root}/.deepseek/config.json`) };
  }

  override resolveWorkspacePath(workspaceRoot: string, inputPath: string): SerializableResult<PlatformResolvedPath> {
    if (inputPath.startsWith("~") || hasAmbiguousDriveRelativePath(inputPath) || inputPath.includes("\0")) {
      return {
        ok: false,
        error: platformError("PLATFORM_PATH_REJECTED", "Workspace path contains unsupported home, drive-relative, or null-byte syntax.", { inputPath })
      };
    }
    const root = normalizeVirtualPath(isVirtualAbsolutePath(workspaceRoot) ? workspaceRoot : `${this.fakeRoot}/${workspaceRoot}`);
    const target = normalizeVirtualPath(isVirtualAbsolutePath(inputPath) ? inputPath : `${root}/${inputPath}`);
    if (!isVirtualPathInside(root, target)) {
      return {
        ok: false,
        error: platformError("PLATFORM_PATH_OUTSIDE_ROOT", "Workspace path resolved outside the governed root.", { workspaceRoot: root })
      };
    }
    return {
      ok: true,
      value: {
        path: target,
        root,
        relativePath: target === root ? "" : target.slice(root.length).replace(/^\//, ""),
        safe: true,
        diagnostics: [],
        redaction: { class: "internal", fields: ["path", "root", "relativePath"] }
      }
    };
  }

  override async selectSearchProvider(preferred?: PlatformProviderName): Promise<SearchProviderDescriptor> {
    const base = await super.selectSearchProvider(preferred);
    const provider = this.fakeOptions.searchProvider ?? base.provider;
    const degraded = provider === "js";
    return {
      ...base,
      provider,
      status: degraded ? "degraded" : "available",
      fallbackChain: searchFallbackChain(this.os),
      diagnostics: degraded ? [diagnostic("SEARCH_JS_FALLBACK", "warn", "Fake platform selected JavaScript search fallback.")] : []
    };
  }

  override async secureStorageCapability(): Promise<SecureStorageCapability> {
    const status = this.fakeOptions.secureStorageStatus ?? "degraded";
    return {
      status,
      provider: status === "available" ? "fake-storage" : status === "degraded" ? "environment" : "none",
      scopedReferences: status !== "unavailable",
      diagnostics: status === "unavailable" ? [diagnostic("SECURE_STORAGE_UNAVAILABLE", "warn", "Fake platform secure storage is unavailable.")] : [],
      redaction: { class: "secret", fields: ["provider"] }
    };
  }

  override async probeNativeCapability(capability: NativeCapabilityName): Promise<NativeCapabilityProbe> {
    if (capability === "secure-storage") return super.probeNativeCapability(capability);
    const status = this.fakeOptions.nativeStatus ?? (capability === "file-watcher" ? "degraded" : "unavailable");
    return {
      capability,
      status,
      provider: status === "unavailable" ? "none" : "fake-native",
      diagnostics: status === "unavailable" ? [diagnostic("NATIVE_CAPABILITY_UNAVAILABLE", "warn", `Fake native capability ${capability} is unavailable.`)] : [],
      redaction: { class: "internal" }
    };
  }

  override async atomicWriteFile(path: string, content: string): Promise<SerializableResult<PlatformPersistenceMetadata>> {
    if (this.fakeOptions.readOnlyFilesystem) {
      return {
        ok: false,
        error: {
          code: "FILESYSTEM_READ_ONLY",
          message: "Fake platform filesystem is read-only.",
          retryable: false,
          redaction: { class: "public" },
          details: { path, os: this.os }
        }
      };
    }
    if (this.failNextAtomicWrite) {
      this.failNextAtomicWrite = false;
      return {
        ok: false,
        error: {
          code: "ATOMIC_WRITE_FAILED",
          message: "Fake atomic write failure.",
          retryable: true,
          redaction: { class: "public" },
          details: { path, os: this.os }
        }
      };
    }
    this.files.set(normalizeVirtualPath(path), content);
    return {
      ok: true,
      value: {
        path: normalizeVirtualPath(path),
        pathKind: "workspace-metadata",
        os: this.os,
        atomic: true,
        redaction: { class: "internal", fields: ["path"] }
      }
    };
  }

  override async permissionDiagnostics(path: string): Promise<readonly PlatformPersistenceDiagnostic[]> {
    return [
      {
        code: "FAKE_PERMISSION_OK",
        severity: "info",
        message: "Fake platform permissions are deterministic.",
        path: normalize(path),
        os: this.os,
        suggestedActions: [],
        redaction: { class: "internal", fields: ["path"] }
      }
    ];
  }

  override async readFile(path: string): Promise<string> {
    const normalized = normalizeVirtualPath(path);
    const value = this.files.get(normalized);
    if (value === undefined) throw new Error(`Fake file not found: ${normalized}`);
    return value;
  }

  override async writeFile(path: string, content: string): Promise<void> {
    if (this.fakeOptions.readOnlyFilesystem) throw new Error("FILESYSTEM_READ_ONLY");
    this.files.set(normalizeVirtualPath(path), content);
  }

  override async findFiles(pattern: string, root: string): Promise<readonly string[]> {
    const normalizedRoot = normalizeVirtualPath(root);
    return [...this.files.keys()].filter((path) => path.startsWith(normalizedRoot) && path.includes(pattern));
  }

  override async searchText(pattern: string, root: string): Promise<readonly SearchResult[]> {
    const provider = await this.selectSearchProvider();
    const metadata = providerMetadata(provider.provider, provider.status, provider.fallbackChain, provider.diagnostics[0]?.code, provider.diagnostics);
    const normalizedRoot = normalizeVirtualPath(root);
    const results: SearchResult[] = [];
    for (const [path, content] of this.files.entries()) {
      if (!path.startsWith(normalizedRoot)) continue;
      content.split(/\r?\n/).forEach((line, index) => {
        if (!line.includes(pattern)) return;
        results.push({
          path,
          line: index + 1,
          text: line,
          engine: provider.provider === "rg" || provider.provider === "grep" || provider.provider === "select-string" ? provider.provider : "js",
          ...(metadata.fallbackReason ? { fallbackReason: metadata.fallbackReason } : {}),
          metadata
        });
      });
    }
    return results;
  }

  override async runProcess(command: string, args: readonly string[]): Promise<ProcessResult> {
    const processProvider = await this.resolveProcessProvider();
    if (!processProvider.available) {
      return {
        exitCode: 126,
        stdout: "",
        stderr: processProvider.diagnostics[0]?.message ?? "Process execution is unavailable.",
        metadata: providerMetadata("none", "unavailable", [], processProvider.diagnostics[0]?.code, processProvider.diagnostics)
      };
    }
    return {
      exitCode: 0,
      stdout: JSON.stringify({ command, args }),
      stderr: "",
      metadata: providerMetadata("argv", "available", [], undefined, [])
    };
  }
}

export function createPlatformRuntime(os: PlatformOsFamily): PlatformRuntime {
  return os === "fake" ? new FakePlatformRuntime("fake") : new NodePlatformRuntime(os);
}

function sandboxCapabilities(input: {
  readonly filesystemReadOnly: boolean;
  readonly shell: ShellProviderDescriptor;
  readonly processProvider: ProcessProviderDescriptor;
  readonly secureStorage: SecureStorageCapability;
  readonly nativeCapabilities: readonly NativeCapabilityProbe[];
  readonly networkStatus: PlatformProviderResultMetadata["status"];
  readonly degradedReasons: readonly string[];
}): SandboxCapabilityMatrix {
  const nativeStatuses = Object.fromEntries(input.nativeCapabilities.map((capability) => [capability.capability, capability.status]));
  const networkUnavailable = input.networkStatus === "unavailable";
  const degradedReasons = [
    ...input.degradedReasons,
    ...(input.filesystemReadOnly ? ["FILESYSTEM_READ_ONLY"] : []),
    ...(networkUnavailable ? ["NETWORK_UNAVAILABLE"] : []),
    ...input.nativeCapabilities.filter((capability) => capability.status === "unavailable").map((capability) => `NATIVE_${capability.capability.toUpperCase().replace(/-/g, "_")}_UNAVAILABLE`)
  ];
  return {
    schemaVersion: SECRET_SANDBOX_SCHEMA_VERSION,
    filesystem: {
      read: true,
      write: !input.filesystemReadOnly,
      readOnly: input.filesystemReadOnly,
      traversalPolicy: "workspace-root",
      rollback: !input.filesystemReadOnly
    },
    processExecution: {
      execute: input.processProvider.available,
      providerStatus: input.processProvider.status
    },
    shell: {
      execute: input.shell.available,
      profile: input.shell.profile,
      providerStatus: input.shell.status
    },
    network: {
      access: !networkUnavailable,
      providerStatus: input.networkStatus,
      hostScopes: []
    },
    environment: { access: "scoped" },
    native: {
      access: input.nativeCapabilities.some((capability) => capability.status !== "unavailable"),
      providerStatuses: nativeStatuses
    },
    secureStorage: {
      status: input.secureStorage.status,
      scopedReferences: input.secureStorage.scopedReferences
    },
    degraded: degradedReasons.length > 0 || input.networkStatus === "degraded",
    degradedReasons: [...new Set(degradedReasons)].sort(),
    redaction: { class: "internal", fields: ["native.providerStatuses", "degradedReasons"] }
  };
}

function isPathInside(root: string, target: string): boolean {
  const normalizedRoot = normalize(root);
  const normalizedTarget = normalize(target);
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}\\`) || normalizedTarget.startsWith(`${normalizedRoot}/`);
}

function isVirtualAbsolutePath(path: string): boolean {
  return path.startsWith("/") || /^[a-zA-Z]:\//.test(path.replace(/\\/g, "/"));
}

function normalizeVirtualPath(path: string): string {
  const slashPath = path.replace(/\\/g, "/");
  const driveMatch = /^([a-zA-Z]:)(\/.*)?$/.exec(slashPath);
  const prefix = driveMatch ? driveMatch[1] ?? "" : slashPath.startsWith("/") ? "/" : "";
  const body = driveMatch ? driveMatch[2] ?? "/" : prefix === "/" ? slashPath.slice(1) : slashPath;
  const segments: string[] = [];
  for (const segment of body.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  if (driveMatch) return `${prefix}/${segments.join("/")}`.replace(/\/$/, "");
  if (prefix === "/") return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
  return segments.join("/");
}

function isVirtualPathInside(root: string, target: string): boolean {
  return target === root || target.startsWith(`${root}/`);
}

async function walk(root: string, files: string[]): Promise<void> {
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await walk(path, files);
    } else {
      files.push(path);
    }
  }
}

function detectEnvironmentKind(): PlatformEnvironmentKind {
  if (process.env.DEEPSEEK_REMOTE_RUNTIME === "1") return "remote";
  if (process.env.CI === "true" || process.env.CI === "1") return "ci";
  if (process.platform === "linux" && (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP)) return "wsl";
  return "local";
}

function defaultShellProfile(os: PlatformOsFamily): ShellProfile {
  if (os === "windows") return "powershell";
  if (os === "fake") return "none";
  return "bash";
}

function unavailableShell(profile: ShellProfile, code: string, message: string): ShellProviderDescriptor {
  return {
    profile,
    provider: "none",
    available: false,
    status: "unavailable",
    args: [],
    requiresShellSyntax: profile !== "none",
    diagnostics: [diagnostic(code, "warn", message)],
    redaction: { class: "public" }
  };
}

function searchFallbackChain(os: PlatformOsFamily): readonly PlatformProviderName[] {
  if (os === "windows") return ["rg", "select-string", "js"];
  if (os === "fake") return ["js"];
  return ["rg", "grep", "js"];
}

function filesystemSemantics(os: PlatformOsFamily) {
  return {
    caseSensitive: os === "linux" || os === "fake",
    pathSeparator: os === "windows" ? "\\" as const : "/" as const,
    homeExpansionAllowed: false,
    driveLetters: os === "windows",
    symlinkAware: true
  };
}

function providerMetadata(
  selectedProvider: PlatformProviderName,
  status: PlatformProviderResultMetadata["status"],
  fallbackChain: readonly PlatformProviderName[],
  fallbackReason: string | undefined,
  diagnostics: readonly PlatformDiagnostic[]
): PlatformProviderResultMetadata {
  return {
    selectedProvider,
    status,
    fallbackChain,
    ...(fallbackReason ? { fallbackReason } : {}),
    degradedReasons: diagnostics.filter((entry) => entry.severity !== "info").map((entry) => entry.code),
    diagnostics,
    redaction: { class: "internal" }
  };
}

function diagnostic(code: string, severity: PlatformDiagnostic["severity"], message: string, details: JsonObject = {}): PlatformDiagnostic {
  return {
    code,
    severity,
    message,
    suggestedActions: [],
    redaction: { class: "internal", fields: ["details"] },
    details
  };
}

function platformError(code: string, message: string, details: JsonObject = {}): RedactedError {
  return {
    code,
    message,
    retryable: false,
    redaction: { class: "internal", fields: ["details"] },
    details
  };
}

function hasAmbiguousDriveRelativePath(path: string): boolean {
  return /^[a-zA-Z]:[^/\\]/.test(path);
}

function wslToWindowsPath(path: string): string {
  const match = /^\/mnt\/([a-zA-Z])\/(.*)$/.exec(path);
  if (!match) return normalize(path);
  return normalize(`${match[1]?.toUpperCase()}:/${match[2] ?? ""}`);
}
