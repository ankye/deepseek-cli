import { createRule } from "../rule.mjs";

function isDeepRelativeImport(specifier) {
  return specifier.startsWith("../../") || specifier.startsWith("../..\\");
}

export const noCrossPackageRelativeImports = createRule({
  id: "imports/no-cross-package-relative-imports",
  description: "Code under src must use package exports instead of deep relative imports across package boundaries.",
  onNode(node, context) {
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;
    if (isDeepRelativeImport(specifier) && context.isUnder("src")) {
      context.report(this.id, node, `cross-package relative import is not allowed; use a package export instead (${specifier})`);
    }
  }
});

export const noInternalPackageSrcImports = createRule({
  id: "imports/no-internal-package-src-imports",
  description: "Package imports must target public package exports, not internal src paths.",
  onNode(node, context) {
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;
    if (context.packageName() && specifier.startsWith(context.conventions.packageImportPrefix) && specifier.includes("/src/")) {
      context.report(this.id, node, `imports must target package exports, not internal src paths (${specifier})`);
    }
  }
});

export const noAppToAppImports = createRule({
  id: "imports/no-app-to-app-imports",
  description: "Application host adapters must not import one another.",
  onNode(node, context) {
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;
    const packageName = context.packageName();
    const forbidden = packageName ? context.conventions.appPackages.get(packageName) : undefined;
    if (forbidden?.has(specifier)) {
      context.report(this.id, node, `${packageName} app must not import another app package (${specifier})`);
    }
  }
});
