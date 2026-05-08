import { createRule } from "../rule.mjs";

function rootServiceName(expression, ts) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return rootServiceName(expression.name, ts);
  if (ts.isElementAccessExpression(expression) && ts.isStringLiteral(expression.argumentExpression)) {
    return expression.argumentExpression.text;
  }
  return undefined;
}

function isAllowedLocation(context, primitive) {
  if (context.isTestFile()) return true;
  const packageName = context.packageName();
  if (!packageName) return false;
  if (packageName === primitive.ownerPackage) return true;
  if (context.conventions.governedExecution.approvedPackages.has(packageName)) return true;
  if (context.conventions.governedExecution.deterministicPackages.has(packageName)) return true;
  return false;
}

function findPrimitive(context, methodName, serviceName) {
  return context.conventions.governedExecution.primitives.find((primitive) => {
    return primitive.methods.has(methodName) && primitive.serviceNames.has(serviceName);
  });
}

export const noDirectGovernedExecutionBypass = createRule({
  id: "governed-execution/no-direct-primitive-bypass",
  description: "Executable capabilities must enter the governed execution pipeline instead of being called directly from non-owner code.",
  onNode(node, context, ts) {
    if (!ts.isCallExpression(node)) return;
    if (!ts.isPropertyAccessExpression(node.expression)) return;

    const methodName = context.propertyName(node.expression.name);
    if (!methodName) return;

    const serviceName = rootServiceName(node.expression.expression, ts);
    if (!serviceName) return;

    const primitive = findPrimitive(context, methodName, serviceName);
    if (!primitive || isAllowedLocation(context, primitive)) return;

    context.report(
      this.id,
      node.expression.name,
      `${serviceName}.${methodName} is a governed execution primitive; route it through runtime/execution pipeline or the owning ${primitive.ownerPackage} package`
    );
  }
});
