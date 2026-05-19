## 1. Package Structure

- [x] 1.1 Add `@deepseek/plugin-api` as a declarative package with author-facing builders and type re-exports.
- [x] 1.2 Add `src/plugins/builtin` as a workspace package and register `src/plugins/*` in the root workspace configuration.
- [x] 1.3 Add shared built-in plugin helpers for deterministic manifests, schema metadata, and contribution declarations.

## 2. Built-In Plugin Migration

- [x] 2.1 Move context compactor, dev checks, git review, and repo navigator plugin declarations into separate built-in plugin directories.
- [x] 2.2 Add a built-in plugin registry that lists manifests, validates the pack, snapshots the pack, and normalizes command/TUI/reasoning contributions.
- [x] 2.3 Convert `@deepseek/first-party-dev-plugins` into a compatibility facade over `@deepseek/builtin-plugins` while preserving public exports.

## 3. Evidence

- [x] 3.1 Add or update tests proving manifest parity, deterministic ordering, contribution counts, invalid manifest diagnostics, and inert projection behavior.
- [x] 3.2 Validate the OpenSpec change with strict validation.
- [x] 3.3 Run typecheck, lint, package boundary checks, and focused plugin tests.
