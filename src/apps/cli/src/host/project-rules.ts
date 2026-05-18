import { createHash } from "node:crypto";
import type { AgentLoopProjectRuleEvidence, AgentLoopProjectRuleSource, PlatformRuntime, RedactedError } from "@deepseek/platform-contracts";

const maxProjectRuleBytes = 32_000;

interface ProjectRuleCandidate {
  readonly source: AgentLoopProjectRuleSource;
  readonly filename: string;
  readonly priority: number;
}

const projectRuleCandidates: readonly ProjectRuleCandidate[] = [
  { source: "agents-md", filename: "AGENTS.md", priority: 100 },
  { source: "claude-md", filename: "CLAUDE.md", priority: 80 }
];

export async function collectCliProjectRuleEvidence(platform: PlatformRuntime, workspaceRoot: string): Promise<readonly AgentLoopProjectRuleEvidence[]> {
  return Promise.all(projectRuleCandidates.map((candidate) => collectRule(platform, workspaceRoot, candidate)));
}

async function collectRule(platform: PlatformRuntime, workspaceRoot: string, candidate: ProjectRuleCandidate): Promise<AgentLoopProjectRuleEvidence> {
  const resolved = platform.resolveWorkspacePath(workspaceRoot, candidate.filename);
  const path = resolved.ok && resolved.value ? resolved.value.path : `${workspaceRoot}/${candidate.filename}`;
  if (!resolved.ok || !resolved.value) {
    return {
      schemaVersion: "1.0.0",
      source: candidate.source,
      status: "excluded",
      priority: candidate.priority,
      path,
      diagnostics: [diagnostic("CLI_PROJECT_RULES_PATH_REJECTED", resolved.error?.message ?? `${candidate.filename} could not be resolved under the workspace root.`)],
      redaction: { class: "internal", fields: ["path", "diagnostics.details"] }
    };
  }
  try {
    const content = await platform.readFile(path);
    const bounded = content.length > maxProjectRuleBytes ? content.slice(0, maxProjectRuleBytes) : content;
    const degraded = bounded.length !== content.length;
    return {
      schemaVersion: "1.0.0",
      source: candidate.source,
      status: degraded ? "degraded" : "included",
      priority: candidate.priority,
      path,
      content: bounded,
      bytes: Buffer.byteLength(content, "utf8"),
      fingerprint: `sha256:${createHash("sha256").update(content).digest("hex")}`,
      diagnostics: degraded ? [diagnostic("CLI_PROJECT_RULES_TRUNCATED", `${candidate.filename} exceeded the prompt rule byte limit and was bounded.`)] : [],
      redaction: { class: "internal", fields: ["content", "path", "diagnostics.details"] }
    };
  } catch (error) {
    return {
      schemaVersion: "1.0.0",
      source: candidate.source,
      status: "missing",
      priority: candidate.priority,
      path,
      diagnostics: [diagnostic("CLI_PROJECT_RULES_MISSING", `${candidate.filename} was not found in the workspace root.`, { code: error instanceof Error ? error.name : "unknown" })],
      redaction: { class: "internal", fields: ["path", "diagnostics.details"] }
    };
  }
}

function diagnostic(code: string, message: string, details: Record<string, string> = {}): RedactedError {
  return {
    code,
    message,
    retryable: false,
    details,
    redaction: { class: "internal", fields: ["details"] }
  };
}
