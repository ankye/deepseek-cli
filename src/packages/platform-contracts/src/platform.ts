import type { JsonObject } from "./common.js";

export interface ProcessResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface SearchResult {
  readonly path: string;
  readonly line: number;
  readonly text: string;
  readonly engine: "rg" | "grep" | "select-string" | "js";
  readonly fallbackReason?: string;
}

export interface PlatformRuntime {
  readonly os: "macos" | "windows" | "linux" | "fake";
  resolvePath(...parts: readonly string[]): string;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  findFiles(pattern: string, root: string): Promise<readonly string[]>;
  searchText(pattern: string, root: string): Promise<readonly SearchResult[]>;
  runProcess(command: string, args: readonly string[], options?: JsonObject): Promise<ProcessResult>;
  availability(): Promise<JsonObject>;
}
