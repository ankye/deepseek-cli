import { createRule } from "../rule.mjs";

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function normalized(path) {
  return path.replace(/\\/g, "/");
}

function isPlannedOversizedFile(context) {
  const planned = context.conventions.scaleGuardrails?.plannedOversizedFiles ?? new Set();
  const file = normalized(context.normalizedFile());
  return [...planned].some((entry) => file.endsWith(normalized(entry)));
}

function isPackageIndex(context) {
  return context.workspaceKind() === "package" && normalized(context.normalizedFile()).endsWith("/src/index.ts");
}

export const centralFileScaleGuardrail = createRule({
  id: "architecture/central-file-scale-guardrail",
  description: "Central source files must stay small or be explicitly tracked by a split plan.",
  onFile(context) {
    if (context.isTestFile()) return;
    const thresholds = context.conventions.scaleGuardrails;
    if (!thresholds) return;
    const lines = lineCount(context.sourceFile.text);
    const file = normalized(context.normalizedFile());
    if (lines > thresholds.maxCentralFileLines && !isPlannedOversizedFile(context)) {
      context.reportAt(this.id, `source file has ${lines} lines; split by responsibility or add an explicit split-plan baseline`);
      return;
    }
    if (isPackageIndex(context) && lines > thresholds.maxPackageIndexLines && !isPlannedOversizedFile(context)) {
      context.reportAt(this.id, `package index has ${lines} lines; keep index.ts as an export surface and move implementation into private modules`);
      return;
    }
    if (file.includes("/src/apps/cli/src/index.ts") && lines > 80) {
      context.reportAt(this.id, `CLI entry has ${lines} lines; keep src/apps/cli/src/index.ts as a thin executable/export surface`);
    }
  }
});
