import { createRule } from "../rule.mjs";

function isAllowedCredentialOwner(context) {
  if (context.isTestFile()) return true;
  const packageName = context.packageName();
  return packageName === "credential-auth-management" || packageName === "platform-abstraction" || packageName === "testing-regression";
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

function credentialLike(value) {
  return /key|token|secret|credential|auth|api/i.test(value);
}

function isFsSecretRead(node, context, ts) {
  if (!ts.isCallExpression(node)) return false;
  if (!ts.isPropertyAccessExpression(node.expression)) return false;
  const method = context.propertyName(node.expression.name);
  if (!method || !new Set(["readFile", "readFileSync"]).has(method)) return false;
  const [first] = node.arguments;
  if (!first || !ts.isStringLiteralLike(first)) return false;
  return credentialLike(first.text);
}

export const noDirectProviderCredentialAccess = createRule({
  id: "provider/no-direct-credential-access",
  description: "Provider adapters must use injected credential resolvers instead of direct host credential reads.",
  onNode(node, context, ts) {
    if (isAllowedCredentialOwner(context)) return;

    if (ts.isPropertyAccessExpression(node)) {
      const path = propertyPath(node, context, ts);
      if (path === "process.env" || path?.startsWith("process.env.")) {
        context.report(this.id, node, "provider and non-owner source must use injected credential resolution instead of process.env");
        return;
      }
      if (path && /vscode\.workspace\.getConfiguration|vscode\.authentication|getSecret|secrets\.get/i.test(path)) {
        context.report(this.id, node, "provider and non-owner source must not read host credential APIs directly");
        return;
      }
    }

    if (isFsSecretRead(node, context, ts)) {
      context.report(this.id, node, "provider and non-owner source must not read credential-like files directly");
    }
  }
});
