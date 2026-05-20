import { createRule } from "../rule.mjs";

function platformContractsUapiImportViolation(specifier, conventions) {
  const config = conventions.platformContractsUapi ?? {};
  const providerSdkModules = config.providerSdkModules ?? new Set();
  const appPackageNames = config.appPackageNames ?? new Set();
  const forbiddenWorkspacePackages = config.forbiddenWorkspacePackages ?? new Set(["@deepseek/testing-regression"]);
  const privateImportSegments = config.privateImportSegments ?? ["/src", "/dist", "/internal"];

  if (conventions.hostApiModules.has(specifier)) return { kind: "host-api", suggestedOwner: "platform-abstraction or host adapter" };
  if (providerSdkModules.has(specifier)) return { kind: "provider-sdk", suggestedOwner: "model-gateway" };
  if (appPackageNames.has(specifier)) return { kind: "app-package", suggestedOwner: "host adapter" };
  if (forbiddenWorkspacePackages.has(specifier)) return { kind: "test-fake", suggestedOwner: "testing-regression" };

  if (specifier.startsWith(conventions.packageImportPrefix)) {
    const privateSegment = privateImportSegments.find((segment) => specifier.includes(segment));
    if (privateSegment) return { kind: "private-package-internal", suggestedOwner: config.suggestedOwner ?? "public package export" };
    return { kind: "implementation-package", suggestedOwner: config.suggestedOwner ?? "owner implementation package" };
  }

  return undefined;
}

export const platformContractsArePure = createRule({
  id: "contracts/platform-contracts-are-pure",
  description: "platform-contracts must stay implementation-free and host-agnostic.",
  onNode(node, context, ts) {
    if (!context.isPackageSource("platform-contracts")) return;

    const specifier = context.moduleSpecifier(node);
    if (specifier) {
      if (context.conventions.packageRules["platform-contracts"].forbidPackageImports && specifier.startsWith(context.conventions.packageImportPrefix)) {
        context.report(this.id, node, `platform-contracts must not import implementation packages (${specifier})`);
      }
      if (context.conventions.hostApiModules.has(specifier)) {
        context.report(this.id, node, `platform-contracts must not import host/process APIs (${specifier})`);
      }
      return;
    }

    if (ts.isIdentifier(node) && context.conventions.packageRules["platform-contracts"].forbiddenGlobals.has(node.text)) {
      context.report(this.id, node, `platform-contracts must not reference Node global ${node.text}`);
    }
  }
});

export const platformContractsUapiBoundary = createRule({
  id: "contracts/platform-contracts-uapi-boundary",
  description: "platform-contracts UAPI must not depend on host, provider, app, test, or implementation internals.",
  onNode(node, context, ts) {
    if (!context.isPackageSource("platform-contracts")) return;

    const specifier = context.moduleSpecifier(node);
    if (specifier) {
      const violation = platformContractsUapiImportViolation(specifier, context.conventions);
      if (violation) {
        context.report(
          this.id,
          node,
          `platform-contracts UAPI boundary violation: ${specifier} is ${violation.kind}; suggestedOwner=${violation.suggestedOwner}`
        );
      }
      return;
    }

    if (ts.isIdentifier(node) && context.conventions.packageRules["platform-contracts"].forbiddenGlobals.has(node.text)) {
      context.report(this.id, node, `platform-contracts UAPI must not reference host global ${node.text}; suggestedOwner=platform-abstraction or host adapter`);
    }
  }
});
