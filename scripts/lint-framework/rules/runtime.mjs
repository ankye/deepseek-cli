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
