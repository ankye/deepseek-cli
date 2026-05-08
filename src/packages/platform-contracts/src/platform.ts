import type { JsonObject, RedactedError, RedactionMetadata, SerializableResult } from "./common.js";

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
  userConfigPath(appName: string): string;
  workspaceMetadataPath(workspaceRoot: string, appName: string): SerializableResult<string>;
  atomicWriteFile(path: string, content: string): Promise<SerializableResult<PlatformPersistenceMetadata>>;
  permissionDiagnostics(path: string): Promise<readonly PlatformPersistenceDiagnostic[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  findFiles(pattern: string, root: string): Promise<readonly string[]>;
  searchText(pattern: string, root: string): Promise<readonly SearchResult[]>;
  runProcess(command: string, args: readonly string[], options?: JsonObject): Promise<ProcessResult>;
  availability(): Promise<JsonObject>;
}

export type PlatformPathKind = "user-config" | "workspace-metadata" | "credential-storage" | "cache";

export interface PlatformPersistenceMetadata extends JsonObject {
  readonly path: string;
  readonly pathKind: PlatformPathKind;
  readonly os: PlatformRuntime["os"];
  readonly atomic: boolean;
  readonly redaction: RedactionMetadata;
}

export interface PlatformPersistenceDiagnostic extends JsonObject {
  readonly code: string;
  readonly severity: "info" | "warn" | "error";
  readonly message: string;
  readonly path?: string;
  readonly os: PlatformRuntime["os"];
  readonly suggestedActions: readonly string[];
  readonly redaction: RedactionMetadata;
}

export interface AtomicWriteFailure extends RedactedError {
  readonly details?: JsonObject;
}
