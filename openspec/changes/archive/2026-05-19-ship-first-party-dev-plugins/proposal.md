## Why

The CLI now has a production TUI framework and declarative plugin-safe contribution intake, but the first release still lacks bundled first-party plugins that make day-to-day development faster. Shipping a small trusted plugin pack now gives users useful repo navigation, checks, review, and lossless context compaction without opening the broader third-party plugin execution surface.

CLI 现在已有 production TUI framework 与声明式 plugin-safe contribution intake，但第一版上线仍缺少能提升日常开发效率的 bundled first-party plugins。现在交付一个小型可信插件包，可以提供 repo navigation、checks、review 与无损上下文压缩，同时不提前开放更大的第三方插件执行面。

## What Changes

- Add a built-in first-party development plugin pack with trusted manifests, deterministic contribution metadata, permission declarations, and release diagnostics.
- Include four release-scope plugins:
  - `@deepseek/plugin-dev-checks` for repository verification commands such as typecheck, lint, tests, boundary checks, build, and OpenSpec validation.
  - `@deepseek/plugin-repo-navigator` for palette/search entries over files, grep results, PageIndex recall, and project index references.
  - `@deepseek/plugin-git-review` for git status/diff/review-oriented commands and result-list projections without destructive git operations.
  - `@deepseek/plugin-context-compactor` for lossless context status, grep, describe, summarize, expand, budget, and pin/reference workflows.
- Keep all first-party plugin contributions host-agnostic and declarative at registration time; execution must route through existing command, runtime, capability, context, policy, and approval contracts.
- Expose plugin entries through CLI help, palette, TUI contribution summaries, JSON/JSONL management output, and release readiness diagnostics.
- Add contract, CLI, golden, and matrix tests for plugin manifests, permission metadata, inert projection, command routing, lossless context compaction, redaction, and deterministic output.

- 增加 built-in first-party development plugin pack，包含可信 manifest、确定性 contribution metadata、permission declarations 与 release diagnostics。
- 首版包含四个插件：
  - `@deepseek/plugin-dev-checks`：提供 typecheck、lint、tests、boundary checks、build、OpenSpec validation 等仓库验证命令。
  - `@deepseek/plugin-repo-navigator`：提供 files、grep results、PageIndex recall 与 project index references 的 palette/search entries。
  - `@deepseek/plugin-git-review`：提供 git status/diff/review 相关 commands 与 result-list projections，且不执行 destructive git operations。
  - `@deepseek/plugin-context-compactor`：提供 lossless context status、grep、describe、summarize、expand、budget 与 pin/reference workflows。
- 所有一方插件注册时保持 host-agnostic 与 declarative；执行必须经过既有 command、runtime、capability、context、policy 与 approval contracts。
- 通过 CLI help、palette、TUI contribution summaries、JSON/JSONL management output 与 release readiness diagnostics 暴露插件条目。
- 增加 manifest、permission metadata、inert projection、command routing、lossless context compaction、redaction 与 deterministic output 的 contract、CLI、golden 与 matrix tests。

## Capabilities

### New Capabilities

- `first-party-dev-plugins`: Defines the bundled trusted plugin pack, release-scope plugin identities, manifest rules, contribution metadata, permissions, diagnostics, and acceptance behavior.

### Modified Capabilities

- `plugin-system`: Require built-in first-party plugin manifests to install/apply deterministically, preserve provenance, and expose permission/auth evidence without executing plugin code at projection time.
- `extension-system`: Require built-in plugin contribution summaries to feed command, palette, TUI, context, and renderer metadata through manifest boundaries.
- `command-system`: Require first-party plugin commands and chat slash aliases to route through structured command contracts with deterministic text/JSON/JSONL output.
- `command-palette-vi-actions`: Require first-party plugin palette/result-list/keymap contributions to remain inert, typed, and compatible with vi-inspired navigation and references.
- `lossless-context-memory`: Require the context compactor plugin to use lossless context DAG, grep/describe/expand/summarize, redaction, and reversible summaries rather than replacing raw nodes.
- `testing-regression`: Require deterministic regression coverage for first-party plugin projection, execution routing, context compaction, redaction, and release readiness evidence.

## Impact

- Affected code: plugin/extension manifest contracts, command composition, CLI extension management, CLI chat slash commands, palette/result-list helpers, TUI contribution registry, lossless context manager wiring, readiness diagnostics, and tests.
- Affected packages: `@deepseek/platform-contracts`, `@deepseek/command-system`, `@deepseek/runtime`, `@deepseek/memory-cache-management`, CLI host adapter, and testing fixtures.
- No third-party plugin execution, marketplace, browser automation, arbitrary shell plugin, or remote plugin registry is introduced by this change.
- The built-in plugins may execute only through existing governed local commands/capabilities; declarative projection remains side-effect free.

- 影响代码：plugin/extension manifest contracts、command composition、CLI extension management、CLI chat slash commands、palette/result-list helpers、TUI contribution registry、lossless context manager wiring、readiness diagnostics 与 tests。
- 影响包：`@deepseek/platform-contracts`、`@deepseek/command-system`、`@deepseek/runtime`、`@deepseek/memory-cache-management`、CLI host adapter 与 testing fixtures。
- 本变更不引入第三方 plugin execution、marketplace、browser automation、arbitrary shell plugin 或 remote plugin registry。
- 内置插件只能通过既有受治理 local commands/capabilities 执行；声明式 projection 保持无副作用。
