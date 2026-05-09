import { createRule } from "../rule.mjs";

function rootServiceName(expression, ts) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return rootServiceName(expression.name, ts);
  if (ts.isElementAccessExpression(expression) && ts.isStringLiteral(expression.argumentExpression)) {
    return expression.argumentExpression.text;
  }
  return undefined;
}

function isAllowedLocation(context) {
  if (context.isTestFile()) return true;
  const packageName = context.packageName();
  if (!packageName) return false;
  return context.conventions.contextProjection.approvedPackages.has(packageName);
}

export const noDirectContextProjectionBypass = createRule({
  id: "context-projection/no-direct-context-assembly",
  description: "Hosts and providers must not assemble model context directly; route through runtime-owned context projection.",
  onNode(node, context, ts) {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
    const methodName = context.propertyName(node.expression.name);
    if (!methodName || !context.conventions.contextProjection.methods.has(methodName)) return;
    const serviceName = rootServiceName(node.expression.expression, ts);
    if (!serviceName || !context.conventions.contextProjection.serviceNames.has(serviceName)) return;
    if (isAllowedLocation(context)) return;

    context.report(
      this.id,
      node.expression.name,
      `${serviceName}.${methodName} assembles context outside the approved projection owners; route through runtime context projection`
    );
  }
});
