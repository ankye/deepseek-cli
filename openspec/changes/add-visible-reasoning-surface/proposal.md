## Why

DeepSeek TUI needs a visible reasoning experience so users can understand why the agent chose context, tools, edits, and verification steps instead of seeing a stitched stream of commands. This should become a product-grade trust surface now, before more plugins are added and each plugin invents its own explanation model.

DeepSeek TUI 需要一个可见推理体验，让用户理解 agent 为什么选择某些上下文、工具、编辑与验证步骤，而不是只看到拼接起来的命令流。这个能力应当在继续扩展插件前成为产品级信任界面，避免每个插件各自发明解释方式。

## What Changes

- Add a first-class visible reasoning surface for TUI sessions, structured around intent, assumptions, decision steps, evidence, tool actions, risks, verification, and final outcome.
- 增加一等 TUI 可见推理界面，围绕 intent、assumptions、decision steps、evidence、tool actions、risks、verification 与 final outcome 组织。
- Define a safe distinction between user-visible reasoning summaries and non-displayable raw provider/internal reasoning.
- 明确区分可展示给用户的 reasoning summaries 与不可展示的 raw provider/internal reasoning。
- Project reasoning records into interactive TUI panels, plain text, JSON, and JSONL without leaking secrets, raw provider reasoning, or unbounded private content.
- 将 reasoning records 投影到 interactive TUI panels、plain text、JSON 与 JSONL，同时不泄漏 secrets、raw provider reasoning 或无边界私有内容。
- Connect visible reasoning to execution-chain evidence so users can jump from a decision to the related context node, tool result, file diff, check output, or plugin contribution.
- 将可见推理连接到 execution-chain evidence，使用户可以从一个决策跳转到相关 context node、tool result、file diff、check output 或 plugin contribution。
- Require first-party plugins to contribute explainable reasoning records through shared contracts instead of custom ad hoc prose.
- 要求 first-party plugins 通过共享契约贡献可解释的 reasoning records，而不是自定义临时文案。

## Capabilities

### New Capabilities

- `visible-reasoning-surface`: Covers safe, user-visible reasoning records, TUI/CLI projection, evidence links, redaction, provider-neutral boundaries, and plugin contribution rules for explaining agent decisions.

### Modified Capabilities

- None.

## Impact

- `src/packages/platform-contracts`: new DTOs for visible reasoning records, step kinds, evidence links, privacy/redaction metadata, and projection state.
- `src/packages/runtime` and prompt assembly integration points: emit visible reasoning summaries at planning, context selection, tool intent, edit decision, verification, and finalization boundaries.
- `src/apps/cli`: render visible reasoning in the TUI workbench, plain output, JSON, and JSONL.
- `src/packages/first-party-dev-plugins`: expose reasoning contributions for context, repo, git review, and dev checks plugins.
- `tests/contracts`, `tests/golden`, and terminal fixtures: cover redaction, deterministic ordering, narrow terminal behavior, JSONL records, and evidence navigation.
