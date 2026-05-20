import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRule } from "../rule.mjs";

const governedAliasStates = new Set(["retired", "merged", "placeholder", "deferred"]);
const governedSeverities = new Set(["info", "warning", "release-blocking"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 0) : [];
}

function workspaceFromTarget(target) {
  const normalized = target.replace(/\\/g, "/");
  const match = normalized.match(/^src\/(packages|plugins|apps)\/([^/]+)\//);
  if (!match) return undefined;
  return { root: match[1], name: match[2] };
}

function aliasRecord(alias, workspaceName, conventions) {
  const records = conventions.architectureDrift?.aliasGovernanceRecords;
  if (!records) return undefined;
  return records.get(alias) ?? records.get(workspaceName);
}

function isCompleteAliasRecord(record) {
  return isObject(record)
    && governedAliasStates.has(record.status)
    && typeof record.ownerPackage === "string"
    && record.ownerPackage.length > 0
    && governedSeverities.has(record.severity)
    && stringArray(record.allowedConsumers).length > 0
    && stringArray(record.blockedProductClaims).length > 0
    && typeof record.replacementTrigger === "string"
    && record.replacementTrigger.length > 0
    && stringArray(record.evidenceIds).length > 0;
}

function packageJsonPath(tsconfigFile, workspace) {
  return resolve(dirname(tsconfigFile), "src", workspace.root, workspace.name, "package.json");
}

export const noUngovernedGhostAliases = createRule({
  id: "architecture/ghost-alias-drift",
  description: "tsconfig path aliases must resolve to workspaces or explicit alias governance records.",
  onJsonFile(context, json) {
    if (!context.normalizedFile().endsWith("/tsconfig.base.json") && context.normalizedFile() !== "tsconfig.base.json") return;
    const paths = json?.compilerOptions?.paths;
    if (!isObject(paths)) return;

    for (const [alias, targets] of Object.entries(paths)) {
      if (!alias.startsWith(context.conventions.packageImportPrefix)) continue;
      const targetList = stringArray(targets);
      const target = targetList[0];
      if (!target) {
        context.reportAt(this.id, `${alias} path alias has no target; severity=release-blocking`);
        continue;
      }

      const workspace = workspaceFromTarget(target);
      const record = aliasRecord(alias, workspace?.name, context.conventions);
      const targetPath = resolve(dirname(context.file), target);
      const targetExists = existsSync(targetPath);
      const knownWorkspace = workspace ? context.conventions.workspacePackageNames.has(workspace.name) : false;

      if (targetExists && knownWorkspace) {
        const manifestPath = packageJsonPath(context.file, workspace);
        if (!existsSync(manifestPath)) {
          context.reportAt(this.id, `${alias} target exists but workspace manifest is missing at ${manifestPath}; severity=release-blocking`);
        }
        continue;
      }

      if (record && isCompleteAliasRecord(record)) continue;

      const recordState = record && isObject(record) ? String(record.status ?? "incomplete") : "missing";
      const recordExists = record ? "true" : "false";
      const reason = targetExists ? "target workspace is not registered" : "target package directory does not exist";
      context.reportAt(
        this.id,
        `${alias} ghost alias drift: ${reason}; target=${target}; expectedOwner=${workspace?.name ?? "unknown"}; severity=release-blocking; governanceRecord=${recordExists}; recordState=${recordState}`
      );
    }
  }
});
