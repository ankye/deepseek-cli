import ts from "typescript";
import { access } from "node:fs/promises";
import { lintConventions } from "./conventions.mjs";
import { LintBaseContext, LintFileContext } from "./context.mjs";
import { collectSourceFiles, readTextFile } from "./filesystem.mjs";
import { visitJsonWithRules, visitWithRules } from "./rule.mjs";
import { architectureRules } from "./rules/index.mjs";

export async function runArchitectureLint(options = {}) {
  const conventions = options.conventions ?? lintConventions;
  const rules = options.rules ?? architectureRules;
  const tsFiles = await collectSourceFiles({
    roots: conventions.sourceRoots,
    ignoredDirectoryNames: conventions.ignoredDirectoryNames,
    extensions: conventions.typescriptExtensions
  });
  const jsonFiles = await collectSourceFiles({
    roots: conventions.metadataRoots,
    ignoredDirectoryNames: conventions.ignoredDirectoryNames,
    extensions: [".json"]
  });
  const explicitJsonFiles = await existingFiles(conventions.metadataFiles ?? []);
  const allJsonFiles = [...new Set([...jsonFiles, ...explicitJsonFiles])];
  const failures = [];

  for (const file of tsFiles) {
    const content = await readTextFile(file);
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const context = new LintFileContext({ sourceFile, conventions, failures });
    visitWithRules(context, rules);
  }

  for (const file of allJsonFiles) {
    const context = new LintBaseContext({ file, conventions, failures });
    try {
      const json = JSON.parse(await readTextFile(file));
      visitJsonWithRules(context, json, rules);
    } catch (error) {
      context.reportAt("package/valid-json", `invalid JSON: ${error.message}`);
    }
  }

  return {
    failures,
    fileCount: tsFiles.length + allJsonFiles.length,
    ruleCount: rules.length
  };
}

async function existingFiles(files) {
  const existing = [];
  for (const file of files) {
    try {
      await access(file);
      existing.push(file);
    } catch {
      // Optional metadata files are ignored in fixtures and partial checkouts.
    }
  }
  return existing;
}
