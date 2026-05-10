import { createRule } from "../rule.mjs";

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
