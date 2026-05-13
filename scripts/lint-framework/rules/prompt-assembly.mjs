import { createRule } from "../rule.mjs";

export const promptAssemblyStaysHostNeutral = createRule({
  id: "prompt-assembly/host-neutral-boundary",
  description: "prompt-assembly must stay host-agnostic and provider-neutral.",
  onNode(node, context) {
    if (!context.isPackageSource("prompt-assembly")) return;
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;

    if (specifier.startsWith("@deepseek/") && specifier !== "@deepseek/platform-contracts") {
      context.report(this.id, node, `prompt-assembly must only import @deepseek/platform-contracts, not ${specifier}`);
      return;
    }

    if (context.conventions.hostApiModules.has(specifier) || context.conventions.platformAccess.forbiddenImports.has(specifier)) {
      context.report(this.id, node, `prompt-assembly must not import host/process API ${specifier}`);
    }
  }
});
