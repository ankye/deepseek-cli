import ts from "typescript";

export function createRule({ id, description, onFile, onNode, onJsonFile }) {
  return {
    id,
    description,
    onFile,
    onNode,
    onJsonFile
  };
}

export function visitWithRules(context, rules) {
  for (const rule of rules) {
    rule.onFile?.(context);
  }

  const visit = (node) => {
    for (const rule of rules) {
      rule.onNode?.(node, context, ts);
    }
    ts.forEachChild(node, visit);
  };

  visit(context.sourceFile);
}

export function visitJsonWithRules(context, json, rules) {
  for (const rule of rules) {
    rule.onJsonFile?.(context, json);
  }
}
