import { createRule } from "../rule.mjs";

const forbiddenDependencies = new Set([
  "@deepseek/runtime",
  "@deepseek/capability-registry",
  "@deepseek/command-system",
  "@deepseek/skill-system",
  "@deepseek/hook-system",
  "@deepseek/mcp-gateway",
  "@deepseek/plugin-system",
  "@deepseek/policy-sandbox",
  "@deepseek/concurrency-orchestration",
  "@deepseek/workflow-orchestration",
  "@deepseek/runtime-message-bus",
  "@deepseek/session-store"
]);

export const modelGatewayStaysAnAdapter = createRule({
  id: "model-gateway/no-execution-surface",
  description: "Model gateway adapters must normalize provider streams only; they must not import runtime kernel, scheduler, policy, sandbox, command, skill, hook, MCP, plugin, workflow, or session mutation packages.",
  onNode(node, context) {
    if (!context.isPackageSource("model-gateway")) return;
    const specifier = context.moduleSpecifier(node);
    if (!specifier) return;
    if (forbiddenDependencies.has(specifier)) {
      context.report(this.id, node, `model-gateway must not depend on ${specifier}; providers normalize streams only and runtime owns execution`);
    }
  }
});
