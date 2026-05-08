import { createRule } from "../rule.mjs";

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
