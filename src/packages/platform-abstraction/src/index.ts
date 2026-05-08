import { readFile as fsReadFile, writeFile as fsWriteFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import type { JsonObject, PlatformRuntime, ProcessResult, SearchResult } from "@deepseek/platform-contracts";

export class NodePlatformRuntime implements PlatformRuntime {
  readonly os: PlatformRuntime["os"];

  constructor(os: PlatformRuntime["os"] = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux") {
    this.os = os;
  }

  resolvePath(...parts: readonly string[]): string {
    return resolve(...parts);
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
  constructor(os: PlatformRuntime["os"] = "fake") {
    super(os);
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
