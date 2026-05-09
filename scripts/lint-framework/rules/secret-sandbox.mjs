import { createRule } from "../rule.mjs";

function isAllowedSecretSandboxOwner(context) {
  if (context.isTestFile()) return true;
  const packageName = context.packageName();
  return packageName ? context.conventions.secretSandbox.approvedPackages.has(packageName) : false;
}

function propertyPath(expression, context, ts) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isStringLiteral(expression) || ts.isNumericLiteral(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    const left = propertyPath(expression.expression, context, ts);
    const right = context.propertyName(expression.name);
    return left && right ? `${left}.${right}` : left ?? right;
  }
  if (ts.isElementAccessExpression(expression)) {
    const left = propertyPath(expression.expression, context, ts);
    const argument = expression.argumentExpression;
    const right = ts.isStringLiteral(argument) || ts.isNumericLiteral(argument) ? argument.text : undefined;
    return left && right ? `${left}.${right}` : left;
  }
  return undefined;
}

function propertyNameFromBinding(node, context, ts) {
  if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) return context.propertyName(node.name);
  if (ts.isBindingElement(node)) return context.propertyName(node.name);
  return undefined;
}

export const noDirectSecretSandboxBypass = createRule({
  id: "secret-sandbox/no-direct-secret-or-sandbox-bypass",
  description: "Non-owner packages must use shared secret redaction and sandbox policy instead of direct primitives.",
  onNode(node, context, ts) {
    if (isAllowedSecretSandboxOwner(context)) return;

    const specifier = context.moduleSpecifier(node);
    if (specifier && ["fs", "node:fs", "fs/promises", "node:fs/promises", "child_process", "node:child_process"].includes(specifier)) {
      context.report(this.id, node, `direct ${specifier} access must go through platform and sandbox policy owners`);
      return;
    }

    if (ts.isPropertyAccessExpression(node)) {
      const path = propertyPath(node, context, ts);
      if (path === "process.env" || path?.startsWith("process.env.")) {
        context.report(this.id, node, "raw environment access must go through credential and secret redaction owners");
        return;
      }
      const property = context.propertyName(node.name);
      if (property && context.conventions.secretSandbox.forbiddenSandboxProperties.has(property)) {
        context.report(this.id, node.name, `${property} must be produced by runtime/policy sandbox owners`);
        return;
      }
    }

    const bindingName = propertyNameFromBinding(node, context, ts);
    if (!bindingName) return;
    if (context.conventions.secretSandbox.forbiddenSandboxProperties.has(bindingName)) {
      context.report(this.id, node, `${bindingName} must not be assembled outside runtime/policy sandbox owners`);
      return;
    }
    if ([...context.conventions.secretSandbox.forbiddenSecretProperties].some((name) => name.toLowerCase() === bindingName.toLowerCase())) {
      context.report(this.id, node, `${bindingName} looks like raw secret handling; use shared redaction helpers and credential references`);
    }
  }
});
