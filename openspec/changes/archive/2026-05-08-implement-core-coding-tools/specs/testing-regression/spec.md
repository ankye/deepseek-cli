## ADDED Requirements

### Requirement: Core Coding Tool Regression Suite / 核心 Coding Tool 回归套件

The testing framework SHALL include deterministic unit, contract, integration, golden, matrix, and e2e tests for core coding tools.

testing framework 必须为 core coding tools 提供 deterministic unit、contract、integration、golden、matrix 和 e2e tests。

#### Scenario: Minimal coding turn is covered / 最小 coding turn 被覆盖

- **WHEN** core tool regression tests run
- **THEN** they cover reading a fixture file, applying an exact edit, running a deterministic test command, and returning structured evidence through runtime events
- **中文** 当 core tool regression tests 运行时，必须覆盖读取 fixture file、应用 exact edit、运行 deterministic test command，并通过 runtime events 返回 structured evidence。

#### Scenario: Platform matrix covers core tools / 平台矩阵覆盖核心工具

- **WHEN** matrix tests run
- **THEN** read, edit, search, shell/test unavailable behavior, path rejection, provider fallback, and output bounding are covered across fake macOS, Windows, Linux, WSL, CI, and remote hosts
- **中文** 当 matrix tests 运行时，必须跨 fake macOS、Windows、Linux、WSL、CI 和 remote hosts 覆盖 read、edit、search、shell/test unavailable behavior、path rejection、provider fallback 和 output bounding。

#### Scenario: Architecture lint blocks bypass / 架构 lint 阻止绕过

- **WHEN** core tool implementation or a future package attempts direct filesystem, process, search binary, or platform primitive access outside approved owner packages
- **THEN** architecture lint fails with stable rule ids
- **中文** 当 core tool implementation 或未来 package 尝试在 approved owner packages 外直接访问 filesystem、process、search binary 或 platform primitive 时，architecture lint 必须以稳定 rule ids 失败。
