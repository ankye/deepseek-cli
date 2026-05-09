import { createRule } from "../rule.mjs";

const LEGACY_SKILL_METHODS = new Set(["register", "activate", "list"]);
const SKILL_SYSTEM_CONTRACT_NAMES = new Set(["SkillSystem"]);
const SKILL_SYSTEM_IMPLEMENTATION_NAMES = new Set(["InMemorySkillSystem"]);

function methodName(member, context, ts) {
  if (ts.isPropertySignature(member) || ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
    return context.propertyName(member.name);
  }
  return undefined;
}

export const noLegacySkillSystemApi = createRule({
  id: "skill-system/no-legacy-generic-api",
  description: "SkillSystem must expose only canonical v1 APIs and must not reintroduce pre-launch generic skill APIs.",
  onNode(node, context, ts) {
    if (ts.isInterfaceDeclaration(node) && SKILL_SYSTEM_CONTRACT_NAMES.has(node.name.text)) {
      for (const member of node.members) {
        const name = methodName(member, context, ts);
        if (!name || !LEGACY_SKILL_METHODS.has(name)) continue;
        context.report(this.id, member.name, `SkillSystem must not expose legacy generic ${name}(); use canonical v1 skill APIs only`);
      }
    }

    if (ts.isClassDeclaration(node) && node.name && SKILL_SYSTEM_IMPLEMENTATION_NAMES.has(node.name.text)) {
      for (const member of node.members) {
        const name = methodName(member, context, ts);
        if (!name || !LEGACY_SKILL_METHODS.has(name)) continue;
        context.report(this.id, member.name, `InMemorySkillSystem must not implement legacy generic ${name}(); use canonical v1 skill APIs only`);
      }
    }
  }
});
