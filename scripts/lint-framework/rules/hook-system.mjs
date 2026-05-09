import { createRule } from "../rule.mjs";

const LEGACY_HOOK_METHODS = new Set(["register", "run"]);
const HOOK_SYSTEM_CONTRACT_NAMES = new Set(["HookSystem"]);
const HOOK_SYSTEM_IMPLEMENTATION_NAMES = new Set(["InMemoryHookSystem"]);

function methodName(member, context, ts) {
  if (ts.isPropertySignature(member) || ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
    return context.propertyName(member.name);
  }
  return undefined;
}

export const noLegacyHookSystemApi = createRule({
  id: "hook-system/no-legacy-generic-api",
  description: "HookSystem must expose only canonical v1 APIs and must not reintroduce pre-launch generic hook APIs.",
  onNode(node, context, ts) {
    if (ts.isInterfaceDeclaration(node) && HOOK_SYSTEM_CONTRACT_NAMES.has(node.name.text)) {
      for (const member of node.members) {
        const name = methodName(member, context, ts);
        if (!name || !LEGACY_HOOK_METHODS.has(name)) continue;
        context.report(this.id, member.name, `HookSystem must not expose legacy generic ${name}(); use canonical v1 hook APIs only`);
      }
    }

    if (ts.isClassDeclaration(node) && node.name && HOOK_SYSTEM_IMPLEMENTATION_NAMES.has(node.name.text)) {
      for (const member of node.members) {
        const name = methodName(member, context, ts);
        if (!name || !LEGACY_HOOK_METHODS.has(name)) continue;
        context.report(this.id, member.name, `InMemoryHookSystem must not implement legacy generic ${name}(); use canonical v1 hook APIs only`);
      }
    }
  }
});
