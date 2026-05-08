# Lint Framework

This directory contains the project-specific architecture lint framework.

## Design

- `index.mjs`: runner entrypoint used by `scripts/lint-ast.mjs`.
- `conventions.mjs`: central project boundary configuration.
- `filesystem.mjs`: source file discovery and path helpers.
- `context.mjs`: per-file rule context and reporting helpers.
- `rule.mjs`: rule factory, TypeScript AST traversal, and JSON manifest dispatch.
- `rules/*`: individual rule modules.

## Rule Shape

```js
export const myRule = createRule({
  id: "area/rule-name",
  description: "What invariant this protects.",
  onFile(context) {},
  onNode(node, context, ts) {},
  onJsonFile(context, json) {}
});
```

TypeScript rules should report through `context.report(ruleId, node, message)` so errors keep a stable file:line:column format. JSON and manifest rules should use `context.reportAt(ruleId, message)`.

## Rule Groups

- `imports.mjs`: import/export dependency boundaries.
- `contracts.mjs`: contract package purity and host-agnostic checks.
- `governed-execution.mjs`: capability invocation governance and direct primitive bypass checks.
- `runtime.mjs`: runtime kernel dependency restrictions.
- `package-json.mjs`: workspace package names, exports, publish metadata, dependency policy, and version conventions.

Shared project policy belongs in `conventions.mjs`; rule modules should consume that policy instead of hard-coding package lists.

## Boundary Philosophy

Rules should protect architecture invariants that are expensive to fix after code volume grows:

- package boundary direction
- host/runtime separation
- contract purity
- deterministic test seams
- no deep internal imports
- no app-to-app coupling
- no undeclared workspace dependency direction
- publishable package metadata stays explicit
- no direct governed execution primitive calls outside runtime, deterministic fakes, tests, or owning packages

General formatting checks stay in `scripts/lint.mjs`; AST and dependency rules live here.
