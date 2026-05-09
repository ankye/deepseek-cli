import { createRule } from "../rule.mjs";

function isAllowedPlatformOwner(context) {
  if (context.isTestFile()) return true;
  const packageName = context.packageName();
  return packageName ? context.conventions.platformAccess.approvedPackages.has(packageName) : false;
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

function literalText(node, ts) {
  return ts.isStringLiteralLike(node) ? node.text : undefined;
}

export const noDirectPlatformPrimitiveAccess = createRule({
  id: "platform/no-direct-platform-primitive-access",
  description: "Non-owner packages must use platform contracts instead of direct OS/process/search/native primitives.",
  onNode(node, context, ts) {
    if (isAllowedPlatformOwner(context)) return;

    const specifier = context.moduleSpecifier(node);
    if (specifier && context.conventions.platformAccess.forbiddenImports.has(specifier)) {
      context.report(this.id, node, `direct platform import ${specifier} is not allowed outside platform owner packages`);
      return;
    }

    if (ts.isPropertyAccessExpression(node)) {
      const path = propertyPath(node, context, ts);
      if (path && [...context.conventions.platformAccess.forbiddenProcessProperties].some((property) => path === `process.${property}`)) {
        context.report(this.id, node, `${path} is platform detection; use @deepseek/platform-contracts descriptors instead`);
        return;
      }
      if (path && /^(keytar|keychain|clipboardy|sharp|nativeModule|secureStorageApi)(\.|$)/i.test(path)) {
        context.report(this.id, node, `${path} looks like direct native/secure-storage access; use platform capability probes`);
        return;
      }
    }

    if (!ts.isCallExpression(node)) return;
    const args = node.arguments;
    const first = args[0] ? literalText(args[0], ts) : undefined;
    if (!first || !context.conventions.platformAccess.forbiddenSearchCommands.has(first)) return;

    const expressionPath = propertyPath(node.expression, context, ts);
    if (/spawn|exec|execFile|runProcess|command/i.test(expressionPath ?? "")) {
      context.report(this.id, node, `direct search binary ${first} is not allowed; use semantic platform search providers`);
    }
  }
});
