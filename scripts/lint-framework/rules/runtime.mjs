import { createRule } from "../rule.mjs";

function normalized(path) {
  return path.replace(/\\/g, "/");
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function isRuntimeSource(context) {
  return context.isPackageSource("runtime") && !context.isTestFile();
}

function packageAppNames(context) {
  const configured = context.conventions.runtimeKernel?.appPackageNames;
  if (configured) return configured;
  return new Set(["deepseek-agent-cli", "@deepseek/vscode-extension"]);
}

function providerSdkModules(context) {
  return context.conventions.runtimeKernel?.providerSdkModules ?? new Set();
}

function privateImportSegments(context) {
  return context.conventions.runtimeKernel?.privateImportSegments ?? ["/src", "/dist", "/internal"];
}

function isPrivateWorkspaceImport(specifier, context) {
  if (!specifier.startsWith(context.conventions.packageImportPrefix ?? "@deepseek/")) return false;
  return privateImportSegments(context).some((segment) => specifier.includes(segment));
}

function isProviderSdkImport(specifier, context) {
  for (const moduleName of providerSdkModules(context)) {
    if (specifier === moduleName || specifier.startsWith(`${moduleName}/`)) return true;
  }
  return false;
}

function runtimeKernelImportViolation(specifier, context) {
  if (packageAppNames(context).has(specifier)) {
    return {
      kind: "app-package",
      message: `${specifier} imports an app package; runtime kernel code must stay host-neutral`,
      extractionTarget: "host adapter"
    };
  }
  if (context.conventions.hostApiModules?.has(specifier)) {
    return {
      kind: "host-api",
      message: `${specifier} imports a host/process API; route through platform-abstraction or an approved adapter`,
      extractionTarget: "platform-abstraction"
    };
  }
  if (isProviderSdkImport(specifier, context)) {
    return {
      kind: "provider-sdk",
      message: `${specifier} imports a provider SDK; route provider-specific logic through model-gateway`,
      extractionTarget: "model-gateway"
    };
  }
  if (specifier === "@deepseek/testing-regression" || specifier.startsWith("@deepseek/testing-regression/")) {
    return {
      kind: "testing-fake",
      message: `${specifier} imports testing fakes; inject fakes from tests or hosts`,
      extractionTarget: "testing-regression"
    };
  }
  if (isPrivateWorkspaceImport(specifier, context)) {
    return {
      kind: "private-package-internal",
      message: `${specifier} imports a private package path; use the package public export surface`,
      extractionTarget: "owner package public API"
    };
  }
  return undefined;
}

export const runtimeDoesNotDependOnTesting = createRule({
  id: "runtime/no-testing-regression-dependency",
  description: "Runtime kernel must not depend on testing fakes or regression helpers.",
  onNode(node, context) {
    if (!context.isPackageSource("runtime")) return;
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;
    if (context.conventions.packageRules.runtime.forbiddenImports.has(specifier)) {
      context.report(this.id, node, "runtime must not depend on testing-regression; inject fakes from tests or hosts");
    }
  }
});

export const runtimeKernelBoundaryImports = createRule({
  id: "runtime/kernel-boundary-imports",
  description: "Runtime source must not couple the kernel to apps, host APIs, provider SDKs, testing fakes, or private package internals.",
  onNode(node, context) {
    if (!isRuntimeSource(context)) return;
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;
    const violation = runtimeKernelImportViolation(specifier, context);
    if (!violation) return;
    context.report(
      this.id,
      node,
      `${violation.message}; kind=${violation.kind}; owner=runtime; suggestedExtraction=${violation.extractionTarget}`
    );
  }
});

export const runtimeKernelCentralFilePressure = createRule({
  id: "runtime/kernel-central-file-pressure",
  description: "Runtime kernel central files must stay under configured pressure thresholds or be tracked as planned shims.",
  onFile(context) {
    if (!isRuntimeSource(context)) return;
    const centralFiles = context.conventions.runtimeKernel?.centralFiles;
    if (!centralFiles) return;
    const file = normalized(context.normalizedFile());
    for (const [entry, policy] of centralFiles.entries()) {
      if (!file.endsWith(normalized(entry))) continue;
      const planned = context.conventions.scaleGuardrails?.plannedOversizedFiles ?? new Set();
      const isPlanned = [...planned].some((plannedFile) => file.endsWith(normalized(plannedFile)));
      const lines = lineCount(context.sourceFile.text);
      if (lines <= policy.maxLines || isPlanned) return;
      const targets = Array.isArray(policy.extractionTargets) ? policy.extractionTargets.join(", ") : "owner package";
      context.reportAt(
        this.id,
        `runtime kernel central file has ${lines} lines over max ${policy.maxLines}; owner=${policy.ownerPackage ?? "runtime"}; suggestedExtraction=${targets}`
      );
      return;
    }
  }
});

function rootServiceName(expression, ts) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return rootServiceName(expression.name, ts);
  if (ts.isElementAccessExpression(expression) && ts.isStringLiteral(expression.argumentExpression)) {
    return expression.argumentExpression.text;
  }
  return undefined;
}

function enclosingFunctionName(node, ts) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name) return current.name.text;
    if ((ts.isMethodDeclaration(current) || ts.isGetAccessor(current) || ts.isSetAccessor(current)) && current.name && ts.isIdentifier(current.name)) {
      const classNode = current.parent;
      if (classNode && ts.isClassDeclaration(classNode) && classNode.name) {
        return `${classNode.name.text}.${current.name.text}`;
      }
      return current.name.text;
    }
    if (ts.isVariableDeclaration(current) && current.name && ts.isIdentifier(current.name)) {
      return current.name.text;
    }
    current = current.parent;
  }
  return undefined;
}

export const noLegacyRuntimeDirectExecution = createRule({
  id: "runtime/no-legacy-direct-execution",
  description: "Runtime package ergonomic APIs must delegate to RuntimeKernel instead of owning direct model or workflow execution state machines.",
  onNode(node, context, ts) {
    if (!context.isPackageSource("runtime")) return;
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;

    const methodName = context.propertyName(node.expression.name);
    const serviceName = rootServiceName(node.expression.expression, ts);
    if (!methodName || !serviceName) return;

    const forbidden = [
      ["models", "stream"],
      ["modelGateway", "stream"],
      ["workflow", "createGraph"],
      ["workflow", "runGraph"],
      ["workflow", "createCheckpoint"],
      ["bus", "publish"]
    ];
    if (!forbidden.some(([service, method]) => serviceName === service && methodName === method)) return;

    const enclosing = enclosingFunctionName(node, ts);
    if (enclosing) {
      if (serviceName === "bus" && methodName === "publish") {
        if (enclosing.startsWith("InProcessRuntimeKernel.") || enclosing === "recordRuntimeAdapterEvent") return;
      }
      if (serviceName === "models" && methodName === "stream" && enclosing === "runAgentLoop") return;
    }

    context.report(this.id, node.expression.name, `${serviceName}.${methodName} reintroduces a legacy direct runtime execution path; delegate through RuntimeKernel`);
  }
});
