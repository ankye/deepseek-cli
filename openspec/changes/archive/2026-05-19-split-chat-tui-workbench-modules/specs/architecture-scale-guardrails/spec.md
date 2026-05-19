## ADDED Requirements

### Requirement: Planned oversized baselines are temporary
Architecture scale guardrails SHALL treat planned oversized source files as tracked split-plan debt, and SHALL remove those entries when the planned responsibility has been extracted below the configured threshold.

Architecture scale guardrails 必须将 planned oversized source files 视为被跟踪的 split-plan debt，并且在计划中的责任拆分完成且文件低于配置阈值后移除这些条目。

#### Scenario: Split-plan entry is retired after extraction
- **WHEN** a central file in `plannedOversizedFiles` has its tracked responsibility extracted into smaller owner modules and the file is below the configured central-file threshold
- **THEN** the split-plan baseline entry is removed and `npm run lint` continues to pass without the exception
- **中文** 当 `plannedOversizedFiles` 中的中心文件已将被跟踪责任拆入更小的 owner modules，且文件低于 central-file threshold 时，必须移除 split-plan baseline entry，并且 `npm run lint` 在无例外情况下继续通过。

#### Scenario: Behavior-preserving split keeps tests green
- **WHEN** a TUI central file is split only by implementation responsibility
- **THEN** existing TUI, plugin execution, palette, and workbench behavior remains covered by focused regression tests
- **中文** 当 TUI central file 仅按实现责任拆分时，现有 TUI、plugin execution、palette 与 workbench 行为必须继续由聚焦回归测试覆盖。
