## ADDED Requirements

### Requirement: First-Party Plugin Regression Coverage / 一方插件回归覆盖

The regression suite SHALL cover first-party plugin manifests, inert projection, permission evidence, command routing, TUI/palette integration, and release diagnostics.

regression suite 必须覆盖一方 plugin manifests、inert projection、permission evidence、command routing、TUI/palette integration 与 release diagnostics。

#### Scenario: Projection does not execute plugin owners / 投影不执行插件 Owner

- **WHEN** contract tests project first-party plugins into command composition, palette entries, TUI contributions, extension management, JSON, and JSONL outputs
- **THEN** tests assert deterministic records, provenance, permission metadata, diagnostics, and no command handler, process, git, npm, model, MCP, hook, or filesystem mutation execution
- **中文** 当 contract tests 将一方插件投影到 command composition、palette entries、TUI contributions、extension management、JSON 与 JSONL outputs 时，测试必须断言 records 确定、provenance 存在、permission metadata 存在、diagnostics 正确，且没有 command handler、process、git、npm、model、MCP、hook 或 filesystem mutation execution。

#### Scenario: Built-in manifest snapshots are stable / 内置 Manifest 快照稳定

- **WHEN** golden tests snapshot the first-party plugin pack
- **THEN** plugin ids, contribution ids, permissions, side effects, compatibility ranges, integrity values, and ordering remain deterministic across runs
- **中文** 当 golden tests 快照 first-party plugin pack 时，plugin ids、contribution ids、permissions、side effects、compatibility ranges、integrity values 与 ordering 必须在多次运行中保持确定。

### Requirement: Context Compaction Regression Coverage / 上下文压缩回归覆盖

The regression suite SHALL cover context compactor status, grep, describe, summarize, expand, budget, pin/reference, redaction, restart recovery, and summary reversibility.

regression suite 必须覆盖 context compactor status、grep、describe、summarize、expand、budget、pin/reference、redaction、restart recovery 与 summary reversibility。

#### Scenario: Summary expands to originals / Summary 展开为原文

- **WHEN** tests create lossless nodes, summarize them through the context compactor, and expand the summary
- **THEN** assertions confirm the expanded result includes the covered original redacted nodes and that raw nodes remain present in durable storage
- **中文** 当测试创建 lossless nodes、通过 context compactor 总结这些节点并 expand summary 时，断言必须确认 expanded result 包含被覆盖的原始脱敏 nodes，且 raw nodes 仍存在于 durable storage。

#### Scenario: Secret-like content stays redacted / 类 Secret 内容保持脱敏

- **WHEN** tests record context containing token, API key, password, or secret-like text and run grep, describe, summarize, expand, budget, and pin workflows
- **THEN** every text, JSON, JSONL, golden, and matrix output contains redaction markers instead of the raw secret-like values
- **中文** 当测试记录包含 token、API key、password 或 secret-like text 的 context，并运行 grep、describe、summarize、expand、budget 与 pin workflows 时，所有 text、JSON、JSONL、golden 与 matrix output 都必须包含 redaction markers，而不是 raw secret-like values。

### Requirement: Developer Workflow Plugin Coverage / 开发工作流插件覆盖

The regression suite SHALL cover the first-party developer check, repository navigation, and git review plugins with deterministic fakes and non-destructive behavior.

regression suite 必须用 deterministic fakes 与非破坏性行为覆盖 first-party developer check、repository navigation 与 git review plugins。

#### Scenario: Dev checks reject arbitrary shell / Dev Checks 拒绝任意 Shell

- **WHEN** tests invoke dev-check commands with unsupported arguments or free-form shell fragments
- **THEN** the command system returns typed diagnostics and no process execution is attempted
- **中文** 当测试使用 unsupported arguments 或 free-form shell fragments 调用 dev-check commands 时，command system 必须返回 typed diagnostics，且不得尝试 process execution。

#### Scenario: Git review is non-destructive / Git Review 非破坏性

- **WHEN** tests invoke git review projections
- **THEN** the plugin only reads deterministic git status/diff fixtures or governed read-only host outputs and never performs commit, checkout, reset, clean, merge, rebase, push, or branch deletion operations
- **中文** 当测试调用 git review projections 时，插件只能读取 deterministic git status/diff fixtures 或受治理 read-only host outputs，绝不执行 commit、checkout、reset、clean、merge、rebase、push 或 branch deletion operations。
