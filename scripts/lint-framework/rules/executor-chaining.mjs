import { createRule } from "../rule.mjs";

function isToolFamilySource(context) {
  const normalized = context.normalizedFile();
  return context.isPackageSource("core-coding-tools")
    && normalized.includes("/src/packages/core-coding-tools/src/families/");
}

function importedNames(node, ts) {
  if (!ts.isImportDeclaration(node) || !node.importClause) return [];
  const bindings = node.importClause.namedBindings;
  if (!bindings || !ts.isNamedImports(bindings)) return [];
  return bindings.elements.map((element) => element.name.text);
}

function looksLikeToolDefinitionImport(node, context, ts) {
  return importedNames(node, ts).some((name) => /^define[A-Z].*Tool$/.test(name));
}

function looksLikeCrossFamilyRelativeImport(specifier) {
  return specifier.startsWith("../") && /\/index\.js$/.test(specifier);
}

export const noPrivateExecutorChaining = createRule({
  id: "tool-family/no-private-executor-chaining",
  description: "Tool family executors must compose through runtime pipelines or the agent loop, not by privately importing/calling other tool executors.",
  onNode(node, context, ts) {
    if (!isToolFamilySource(context)) return;

    const specifier = context.moduleSpecifier(node);
    if (specifier && looksLikeCrossFamilyRelativeImport(specifier) && looksLikeToolDefinitionImport(node, context, ts)) {
      context.report(
        this.id,
        node,
        "family executors must not import another family tool definition; compose through runtime pipelines or the agent loop"
      );
      return;
    }

    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
    const methodName = context.propertyName(node.expression.name);
    if (methodName !== "execute") return;
    context.report(
      this.id,
      node.expression.name,
      "family executors must not call another executor directly; use the governed registry/runtime pipeline path"
    );
  }
});
