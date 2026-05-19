import { createRule } from "../rule.mjs";
import { dirname, resolve } from "node:path";
import { normalizedPath, pathParts } from "../filesystem.mjs";

function isDeepRelativeImport(specifier) {
  return specifier.startsWith("../../") || specifier.startsWith("../..\\");
}

function containingWorkspaceName(filePath) {
  const parts = pathParts(filePath);
  const packagesIndex = parts.indexOf("packages");
  if (packagesIndex >= 0) return { kind: "packages", name: parts[packagesIndex + 1] };
  const pluginsIndex = parts.indexOf("plugins");
  if (pluginsIndex >= 0) return { kind: "plugins", name: parts[pluginsIndex + 1] };
  const appsIndex = parts.indexOf("apps");
  if (appsIndex >= 0) return { kind: "apps", name: parts[appsIndex + 1] };
  return undefined;
}

function resolvesToSameWorkspace(importerFile, specifier) {
  const importer = containingWorkspaceName(importerFile);
  if (!importer) return false;
  const absoluteImportPath = normalizedPath(resolve(dirname(importerFile), specifier));
  const target = containingWorkspaceName(absoluteImportPath);
  if (!target) return false;
  return importer.kind === target.kind && importer.name === target.name;
}

export const noCrossPackageRelativeImports = createRule({
  id: "imports/no-cross-package-relative-imports",
  description: "Code under src must use package exports instead of relative imports that cross package boundaries.",
  onNode(node, context) {
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;
    if (!isDeepRelativeImport(specifier)) return;
    if (!context.isUnder("src")) return;
    if (resolvesToSameWorkspace(context.file, specifier)) return;
    context.report(this.id, node, `cross-package relative import is not allowed; use a package export instead (${specifier})`);
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
