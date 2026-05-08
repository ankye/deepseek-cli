import { createRule } from "../rule.mjs";

const dependencyBlocks = ["dependencies", "peerDependencies", "optionalDependencies", "devDependencies"];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function dependenciesFrom(json) {
  return Object.fromEntries(dependencyBlocks.map((block) => [block, isObject(json[block]) ? json[block] : {}]));
}

function forEachDependency(json, callback) {
  for (const [block, dependencies] of Object.entries(dependenciesFrom(json))) {
    for (const [name, version] of Object.entries(dependencies)) {
      callback({ block, name, version: String(version) });
    }
  }
}

function requireField(context, ruleId, condition, message) {
  if (!condition) context.reportAt(ruleId, message);
}

export const packageJsonBoundaryRule = createRule({
  id: "package/package-json-boundaries",
  description: "Workspace package metadata must preserve publish, export, and dependency boundaries.",
  onJsonFile(context, json) {
    if (!context.normalizedFile().endsWith("/package.json")) return;

    const workspaceName = context.workspaceName();
    const workspaceKind = context.workspaceKind();
    if (!workspaceName || !workspaceKind) return;

    const expectedName = context.conventions.workspacePackageNames.get(workspaceName);
    requireField(context, this.id, json.name === expectedName, `${workspaceKind} ${workspaceName} package name must be ${expectedName}`);
    requireField(context, this.id, json.type === "module", `${json.name} must use ESM with "type": "module"`);

    const publishConfig = context.conventions.publishableApps.get(workspaceName);
    if (!publishConfig) {
      requireField(context, this.id, json.private === true, `${json.name} must stay private unless explicitly listed as a publishable app`);
    }

    if (workspaceKind === "package") {
      validatePackageManifest(context, json, workspaceName);
    } else {
      validateAppManifest(context, json, workspaceName, publishConfig);
    }
  }
});

function validatePackageManifest(context, json, workspaceName) {
  const publicExport = json.exports?.["."];
  requireField(context, packageJsonBoundaryRule.id, isObject(publicExport), `${json.name} must expose a public "." export`);
  requireField(context, packageJsonBoundaryRule.id, publicExport?.types === "./src/index.ts", `${json.name} "." export must expose ./src/index.ts types`);
  requireField(context, packageJsonBoundaryRule.id, publicExport?.default === "./src/index.ts", `${json.name} "." export must expose ./src/index.ts default entry`);

  const dependencies = dependenciesFrom(json);
  if (workspaceName === "platform-contracts") {
    requireField(
      context,
      packageJsonBoundaryRule.id,
      Object.keys(dependencies.dependencies).length === 0,
      "platform-contracts must not declare runtime dependencies"
    );
  }

  const allowedInternalDependencies = context.conventions.packageDependencyPolicy.get(workspaceName) ?? new Set();
  validateInternalDependencies(context, json, allowedInternalDependencies);
}

function validateAppManifest(context, json, workspaceName, publishConfig) {
  const forbiddenAppPackages = context.conventions.appPackages.get(workspaceName) ?? new Set();
  forEachDependency(json, ({ block, name }) => {
    if (forbiddenAppPackages.has(name)) {
      context.reportAt(packageJsonBoundaryRule.id, `${json.name} ${block} must not depend on app package ${name}`);
    }
  });

  const allowedInternalDependencies = context.conventions.appDependencyPolicy.get(workspaceName) ?? new Set();
  validateInternalDependencies(context, json, allowedInternalDependencies);

  if (!publishConfig) return;

  requireField(context, packageJsonBoundaryRule.id, json.private !== true, `${json.name} is publishable and must not be private`);
  requireField(context, packageJsonBoundaryRule.id, json.publishConfig?.access === "public", `${json.name} must publish with public access`);
  requireField(context, packageJsonBoundaryRule.id, json.exports?.["."] === "./dist/index.js", `${json.name} must export the built CLI entrypoint`);
  requireField(context, packageJsonBoundaryRule.id, json.bin?.[publishConfig.binName] === "./dist/index.js", `${json.name} must expose the ${publishConfig.binName} binary`);

  const files = new Set(Array.isArray(json.files) ? json.files : []);
  for (const requiredFile of publishConfig.files) {
    requireField(context, packageJsonBoundaryRule.id, files.has(requiredFile), `${json.name} npm files must include ${requiredFile}`);
  }
}

function validateInternalDependencies(context, json, allowedInternalDependencies) {
  forEachDependency(json, ({ block, name, version }) => {
    if (version.startsWith("workspace:")) {
      context.reportAt(packageJsonBoundaryRule.id, `${json.name} ${block}.${name} must use a publishable semver version, not ${version}`);
    }

    if (!name.startsWith(context.conventions.packageImportPrefix)) return;
    if (block === "devDependencies") return;

    if (!allowedInternalDependencies.has(name)) {
      context.reportAt(packageJsonBoundaryRule.id, `${json.name} ${block}.${name} is not allowed by the workspace dependency policy`);
    }

    if (version !== json.version) {
      context.reportAt(packageJsonBoundaryRule.id, `${json.name} ${block}.${name} must use the local workspace version ${json.version}`);
    }
  });
}
