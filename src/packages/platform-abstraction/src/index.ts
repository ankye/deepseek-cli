import { mkdir, readFile as fsReadFile, rename, rm, writeFile as fsWriteFile, readdir } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, resolve } from "node:path";
import { spawn } from "node:child_process";
import type { JsonObject, PlatformPersistenceDiagnostic, PlatformPersistenceMetadata, PlatformRuntime, ProcessResult, SearchResult, SerializableResult } from "@deepseek/platform-contracts";

export class NodePlatformRuntime implements PlatformRuntime {
  readonly os: PlatformRuntime["os"];

  constructor(os: PlatformRuntime["os"] = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux") {
    this.os = os;
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
    await fsWriteFile(path, content, "utf8");
  }

  async findFiles(pattern: string, root: string): Promise<readonly string[]> {
    const files: string[] = [];
    await walk(root, files);
    return files.filter((file) => file.includes(pattern));
  }

  async searchText(pattern: string, root: string): Promise<readonly SearchResult[]> {
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
            engine: "js",
            fallbackReason: "deterministic-js-fallback"
          });
        }
      });
    }
    return results;
  }

  async runProcess(command: string, args: readonly string[], options: JsonObject = {}): Promise<ProcessResult> {
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
      child.on("close", (exitCode) => resolvePromise({ exitCode: exitCode ?? 0, stdout, stderr }));
      child.on("error", (error) => resolvePromise({ exitCode: 1, stdout, stderr: error.message }));
    });
  }

  async availability(): Promise<JsonObject> {
    return {
      os: this.os,
      searchFallbacks: ["rg", "grep", "select-string", "js"]
    };
  }
}

export class FakePlatformRuntime extends NodePlatformRuntime {
  private readonly files = new Map<string, string>();
  failNextAtomicWrite = false;

  constructor(os: PlatformRuntime["os"] = "fake", private readonly fakeRoot = "/workspace") {
    super(os);
  }

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

  override async atomicWriteFile(path: string, content: string): Promise<SerializableResult<PlatformPersistenceMetadata>> {
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
    this.files.set(normalize(path), content);
    return {
      ok: true,
      value: {
        path: normalize(path),
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
    const normalized = normalize(path);
    const value = this.files.get(normalized);
    if (value === undefined) throw new Error(`Fake file not found: ${normalized}`);
    return value;
  }

  override async writeFile(path: string, content: string): Promise<void> {
    this.files.set(normalize(path), content);
  }

  override async runProcess(command: string, args: readonly string[]): Promise<ProcessResult> {
    return {
      exitCode: 0,
      stdout: JSON.stringify({ command, args }),
      stderr: ""
    };
  }
}

export function createPlatformRuntime(os: PlatformRuntime["os"]): PlatformRuntime {
  return os === "fake" ? new FakePlatformRuntime("fake") : new NodePlatformRuntime(os);
}

function isPathInside(root: string, target: string): boolean {
  const normalizedRoot = normalize(root);
  const normalizedTarget = normalize(target);
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}\\`) || normalizedTarget.startsWith(`${normalizedRoot}/`);
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
