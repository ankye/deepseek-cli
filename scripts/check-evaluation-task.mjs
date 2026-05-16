#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const [taskId, workspaceRoot] = process.argv.slice(2);
if (!taskId || !workspaceRoot) {
  console.error("usage: node scripts/check-evaluation-task.mjs <task-id> <workspace-root>");
  process.exit(2);
}

function read(relativePath) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(join(workspaceRoot, relativePath));
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: workspaceRoot, encoding: "utf8" });
  return {
    command: `node ${args.join(" ")}`,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status ?? 1,
    stdout: String(result.stdout ?? "").slice(0, 1000),
    stderr: String(result.stderr ?? "").slice(0, 1000)
  };
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

function hasChinese(value) {
  return /[\u4e00-\u9fff]/.test(value);
}

function pass(extra = {}) {
  return {
    schemaVersion: "1.0.0",
    kind: "evaluation-task.check-result",
    taskId,
    status: "pass",
    diagnostics: [],
    ...extra,
    redaction: { class: "internal", fields: ["diagnostics.details", "commands.stdout", "commands.stderr"] }
  };
}

function fail(message, extra = {}) {
  return {
    schemaVersion: "1.0.0",
    kind: "evaluation-task.check-result",
    taskId,
    status: "fail",
    diagnostics: [{ code: "EVALUATION_TASK_CHECK_FAILED", severity: "error", message }],
    ...extra,
    redaction: { class: "internal", fields: ["diagnostics.details", "commands.stdout", "commands.stderr"] }
  };
}

function finish(result) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "pass" ? 0 : 1);
}

function checkBugfix() {
  if (!exists("lib/calculator.js")) return fail("lib/calculator.js is missing.");
  const test = runNode(["--test", "test/calculator.test.mjs"]);
  return test.status === "pass" ? pass({ commands: [test] }) : fail("calculator focused test failed.", { commands: [test] });
}

function checkRefactor() {
  if (!exists("src/shared/normalize-label.js")) return fail("shared normalize-label helper is missing.");
  const alpha = read("src/alpha.js");
  const beta = read("src/beta.js");
  if (!alpha.includes("./shared/normalize-label.js") || !beta.includes("./shared/normalize-label.js")) return fail("alpha and beta must import the shared helper.");
  if (/function\s+normalizeLabel/.test(alpha) || /function\s+normalizeLabel/.test(beta)) return fail("duplicate normalizeLabel functions remain in alpha or beta.");
  const test = runNode(["--test", "test/refactor.test.mjs"]);
  return test.status === "pass" ? pass({ commands: [test] }) : fail("refactor focused test failed.", { commands: [test] });
}

function checkDocsSpec() {
  const readme = exists("README.md") ? read("README.md") : "";
  const spec = exists("openspec/changes/eval-streaming-retry/specs/runtime/spec.md")
    ? read("openspec/changes/eval-streaming-retry/specs/runtime/spec.md")
    : "";
  const combined = `${readme}\n${spec}`;
  const lower = combined.toLowerCase();
  if (!lower.includes("streaming retry budget")) return fail("English streaming retry budget guidance is missing.");
  if (!hasChinese(combined)) return fail("Chinese guidance is missing.");
  if (!/重试预算|流式/.test(combined)) return fail("Chinese streaming retry-budget wording is missing.");
  if (/TODO|TBD/.test(combined)) return fail("Docs/spec still contain placeholder markers.");
  return pass({ evidence: { files: ["README.md", "openspec/changes/eval-streaming-retry/specs/runtime/spec.md"] } });
}

function checkContextRecall() {
  if (!exists("answer.json")) return fail("answer.json is missing.");
  const answer = json("answer.json");
  if (answer.decisionId !== "decision:transport-stdio") return fail("answer.json did not cite the expected decision id.");
  if (answer.currentRetryBudget !== 2) return fail("answer.json did not verify the current retry budget.");
  if (answer.chosenTransport !== "stdio") return fail("answer.json did not recover the chosen transport.");
  if (!Array.isArray(answer.evidencePaths) || answer.evidencePaths.length < 2) return fail("answer.json must cite recall and current-state evidence paths.");
  return pass({ evidence: { answerPath: "answer.json" } });
}

function checkRevertRecovery() {
  if (!exists("app.txt")) return fail("app.txt is missing.");
  const text = read("app.txt");
  if (text.includes("BEGIN GENERATED CHANGE") || text.includes("experimental generated setting")) return fail("generated change was not removed.");
  if (!text.includes("USER CHANGE: keep this line")) return fail("unrelated user change was not preserved.");
  const preview = exists("revert-preview.json") ? json("revert-preview.json") : undefined;
  if (!preview || preview.applied !== true || preview.preservedUserChange !== true) return fail("revert-preview.json must prove scoped application and preserved user change.");
  return pass({ evidence: { files: ["app.txt", "revert-preview.json"] } });
}

function checkReleaseEvidence() {
  if (!exists("release/evidence-summary.json")) return fail("release/evidence-summary.json is missing.");
  const summary = json("release/evidence-summary.json");
  const index = exists("release/acceptance-index.md") ? read("release/acceptance-index.md") : "";
  if (summary.status !== "pass") return fail("release evidence summary status must be pass.");
  if (summary.publishDryRunReady !== false) return fail("release evidence must not claim publish dry-run readiness.");
  if (!Array.isArray(summary.commands) || !summary.commands.includes("deepseek diagnostics verify --output json")) return fail("diagnostics verify command evidence is missing.");
  if (!index.includes("diagnostics verify") || !index.includes("diagnostics refresh")) return fail("acceptance index must include refresh and verify evidence.");
  return pass({ evidence: { files: ["release/evidence-summary.json", "release/acceptance-index.md"] } });
}

function checkCodingRepair() {
  if (!exists("src/formatter.js")) return fail("src/formatter.js is missing.");
  const syntax = runNode(["--check", "src/formatter.js"]);
  const test = runNode(["--test", "test/formatter.test.mjs"]);
  return syntax.status === "pass" && test.status === "pass"
    ? pass({ commands: [syntax, test] })
    : fail("formatter syntax or focused test failed.", { commands: [syntax, test] });
}

switch (taskId) {
  case "eval.bugfix.failing-test":
    finish(checkBugfix());
    break;
  case "eval.refactor.multifile":
    finish(checkRefactor());
    break;
  case "eval.docs.spec-update":
    finish(checkDocsSpec());
    break;
  case "eval.context.recall":
    finish(checkContextRecall());
    break;
  case "eval.revert.recovery":
    finish(checkRevertRecovery());
    break;
  case "eval.release.evidence":
    finish(checkReleaseEvidence());
    break;
  case "eval.coding.failing-first-typecheck":
    finish(checkCodingRepair());
    break;
  default:
    finish(fail(`Unsupported evaluation task checker: ${taskId}.`));
}
