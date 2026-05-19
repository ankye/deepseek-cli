import ts from "typescript";
import { normalizedPath, pathParts } from "./filesystem.mjs";
import { LintFailure } from "./failure.mjs";

export class LintBaseContext {
  constructor({ file, conventions, failures }) {
    this.file = file;
    this.conventions = conventions;
    this.failures = failures;
  }

  reportAt(ruleId, message, line = 1, column = 1) {
    this.failures.push(
      new LintFailure({
        ruleId,
        file: this.file,
        line,
        column,
        message
      })
    );
  }

  normalizedFile() {
    return normalizedPath(this.file);
  }

  isUnder(...parts) {
    return this.normalizedFile().split("/").includes(parts.join("/")) || this.normalizedFile().includes(parts.join("/"));
  }

  workspaceKind() {
    const parts = pathParts(this.file);
    if (parts.includes("packages")) return "package";
    if (parts.includes("plugins")) return "package";
    if (parts.includes("apps")) return "app";
    return undefined;
  }

  workspaceName() {
    const parts = pathParts(this.file);
    const packagesIndex = parts.indexOf("packages");
    if (packagesIndex >= 0) return parts[packagesIndex + 1];
    const pluginsIndex = parts.indexOf("plugins");
    if (pluginsIndex >= 0) return parts[pluginsIndex + 1];
    const appsIndex = parts.indexOf("apps");
    if (appsIndex >= 0) return parts[appsIndex + 1];
    return undefined;
  }

  packageName() {
    return this.workspaceName();
  }

  isPackageSource(packageName) {
    return this.isWorkspaceSource("packages", packageName);
  }

  isAppSource(appName) {
    return this.isWorkspaceSource("apps", appName);
  }

  isWorkspaceSource(workspaceRoot, workspaceName) {
    const parts = pathParts(this.file);
    const rootIndex = parts.indexOf(workspaceRoot);
    return rootIndex >= 0 && parts[rootIndex + 1] === workspaceName && parts[rootIndex + 2] === "src";
  }

  isTestFile() {
    const parts = pathParts(this.file);
    return parts.includes("test") || parts.includes("tests") || /\.test\.[cm]?[tj]sx?$/.test(this.file);
  }
}

export class LintFileContext {
  constructor({ sourceFile, conventions, failures }) {
    this.base = new LintBaseContext({ file: sourceFile.fileName, conventions, failures });
    this.sourceFile = sourceFile;
    this.conventions = conventions;
    this.failures = failures;
    this.file = sourceFile.fileName;
  }

  report(ruleId, node, message) {
    const { line, character } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart(this.sourceFile));
    this.reportAt(ruleId, message, line + 1, character + 1);
  }

  reportAt(ruleId, message, line = 1, column = 1) {
    this.base.reportAt(ruleId, message, line, column);
  }

  normalizedFile() {
    return this.base.normalizedFile();
  }

  isUnder(...parts) {
    return this.base.isUnder(...parts);
  }

  workspaceKind() {
    return this.base.workspaceKind();
  }

  workspaceName() {
    return this.base.workspaceName();
  }

  packageName() {
    return this.base.packageName();
  }

  isPackageSource(packageName) {
    return this.base.isPackageSource(packageName);
  }

  isAppSource(appName) {
    return this.base.isAppSource(appName);
  }

  isTestFile() {
    return this.base.isTestFile();
  }

  propertyName(node) {
    if (ts.isIdentifier(node)) return node.text;
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
    return undefined;
  }

  moduleSpecifier(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      return node.moduleSpecifier.text;
    }

    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments;
      if (argument && ts.isStringLiteral(argument)) return argument.text;
    }

    return undefined;
  }
}
