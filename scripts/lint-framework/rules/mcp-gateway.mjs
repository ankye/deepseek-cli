import { createRule } from "../rule.mjs";

const MCP_GATEWAY_CONTRACT_NAMES = new Set(["McpGateway"]);
const MCP_GATEWAY_IMPLEMENTATION_NAMES = new Set(["InMemoryMcpGateway", "FakeMcpGateway"]);

function methodName(member, context, ts) {
  if (ts.isPropertySignature(member) || ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
    return context.propertyName(member.name);
  }
  return undefined;
}

function parameterCount(member) {
  return Array.isArray(member.parameters) ? member.parameters.length : 0;
}

function hasStringNamespaceParameter(member, context, ts) {
  const [parameter] = member.parameters ?? [];
  if (!parameter?.type) return false;
  return parameter.type.kind === ts.SyntaxKind.StringKeyword || context.sourceFile.text.slice(parameter.type.pos, parameter.type.end).trim() === "string";
}

function isLegacyMcpMethod(member, name, context, ts) {
  if (name === "connect") return true;
  if (name === "listTools" && hasStringNamespaceParameter(member, context, ts)) return true;
  if (name === "callTool" && parameterCount(member) >= 3) return true;
  return false;
}

export const noLegacyMcpGatewayApi = createRule({
  id: "mcp-gateway/no-legacy-generic-api",
  description: "McpGateway must expose only canonical v1 APIs and must not reintroduce pre-v1 generic MCP APIs.",
  onNode(node, context, ts) {
    if (ts.isInterfaceDeclaration(node) && MCP_GATEWAY_CONTRACT_NAMES.has(node.name.text)) {
      for (const member of node.members) {
        const name = methodName(member, context, ts);
        if (!name || !isLegacyMcpMethod(member, name, context, ts)) continue;
        context.report(this.id, member.name, `McpGateway must not expose legacy generic ${name}(); use canonical v1 MCP request APIs only`);
      }
    }

    if (ts.isClassDeclaration(node) && node.name && MCP_GATEWAY_IMPLEMENTATION_NAMES.has(node.name.text)) {
      for (const member of node.members) {
        const name = methodName(member, context, ts);
        if (!name || !isLegacyMcpMethod(member, name, context, ts)) continue;
        context.report(this.id, member.name, `${node.name.text} must not implement legacy generic ${name}(); use canonical v1 MCP request APIs only`);
      }
    }
  }
});
