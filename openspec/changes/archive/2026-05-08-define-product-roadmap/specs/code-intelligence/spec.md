## ADDED Requirements

### Requirement: Code Intelligence Roadmap Placement / 代码智能路线图落点

Code intelligence SHALL be placed in R2 Context And Safety with explicit diagnostics, symbols, references, language-aware context, pre-edit evidence, post-edit evidence, cache invalidation, and host fallback requirements.

code intelligence 必须放入 R2 Context And Safety，并明确 diagnostics、symbols、references、language-aware context、pre-edit evidence、post-edit evidence、cache invalidation 和 host fallback requirements。

#### Scenario: Code intelligence improves edit safety / 代码智能提升编辑安全

- **WHEN** a roadmap node introduces language-aware editing or review evidence
- **THEN** diagnostics and symbol evidence are attached to workspace edit, session, runtime event, and regression traces through shared code-intelligence contracts
- **中文** 当路线图节点引入 language-aware editing 或 review evidence 时，diagnostics 和 symbol evidence 必须通过共享 code-intelligence contracts 附加到 workspace edit、session、runtime event 和 regression traces。

#### Scenario: Code intelligence does not require live IDE / 代码智能不强依赖 live IDE

- **WHEN** R2 deterministic tests run
- **THEN** code intelligence providers use fakes, local analyzers, or recorded fixtures so the test path does not require a live editor or language server
- **中文** 当 R2 deterministic tests 运行时，code intelligence providers 必须使用 fakes、local analyzers 或 recorded fixtures，使测试路径不依赖 live editor 或 language server。
