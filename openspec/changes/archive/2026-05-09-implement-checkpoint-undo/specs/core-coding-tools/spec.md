## ADDED Requirements

### Requirement: Core Tool Checkpoint Evidence / 核心工具 Checkpoint 证据

File write and edit tools SHALL include checkpoint references and redacted rollback evidence in successful mutation results.

file write 与 edit tools 必须在成功 mutation result 中包含 checkpoint references 和脱敏 rollback evidence。

#### Scenario: Write result exposes checkpoint id / 写入结果暴露 checkpoint id

- **WHEN** a file write tool successfully mutates a workspace file
- **THEN** the tool result metadata includes a checkpoint id, before/after hashes, and redaction metadata without raw rollback content
- **中文** 当 file write tool 成功修改 workspace file 时，tool result metadata 必须包含 checkpoint id、before/after hashes 和 redaction metadata，且不包含 raw rollback content。

#### Scenario: Edit result exposes checkpoint id / 编辑结果暴露 checkpoint id

- **WHEN** an exact edit tool successfully mutates a workspace file
- **THEN** the tool result metadata includes a checkpoint id and changed ranges while preserving redacted rollback evidence
- **中文** 当 exact edit tool 成功修改 workspace file 时，tool result metadata 必须包含 checkpoint id 与 changed ranges，并保留脱敏 rollback evidence。
