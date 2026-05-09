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

    const source = node.getSourceFile().text;
    const prefix = source.slice(0, node.getStart(node.getSourceFile()));
    const classStart = prefix.lastIndexOf("class InProcessRuntimeKernel");
    const classEnd = classStart >= 0 ? source.indexOf("\nexport function createRuntimeKernel", classStart) : -1;
    const insideKernel = classStart >= 0 && classEnd >= 0 && node.getStart(node.getSourceFile()) > classStart && node.getStart(node.getSourceFile()) < classEnd;
    if (insideKernel && serviceName === "bus" && methodName === "publish") return;
    const agentLoopStart = prefix.lastIndexOf("export async function* runAgentLoop");
    const agentLoopEnd = agentLoopStart >= 0 ? source.indexOf("\nexport async function* executeProjectedRuntimeTurn", agentLoopStart) : -1;
    const insideRuntimeAgentLoop = agentLoopStart >= 0 && agentLoopEnd >= 0 && node.getStart(node.getSourceFile()) > agentLoopStart && node.getStart(node.getSourceFile()) < agentLoopEnd;
    if (insideRuntimeAgentLoop && serviceName === "models" && methodName === "stream") return;

    const recorderStart = prefix.lastIndexOf("async function recordRuntimeAdapterEvent");
    const recorderEnd = recorderStart >= 0 ? source.indexOf("\nfunction runtimeTrace", recorderStart) : -1;
    const insideRuntimeAdapterRecorder = recorderStart >= 0 && recorderEnd >= 0 && node.getStart(node.getSourceFile()) > recorderStart && node.getStart(node.getSourceFile()) < recorderEnd;
    if (insideRuntimeAdapterRecorder && serviceName === "bus" && methodName === "publish") return;

    context.report(this.id, node.expression.name, `${serviceName}.${methodName} reintroduces a legacy direct runtime execution path; delegate through RuntimeKernel`);
  }
});
