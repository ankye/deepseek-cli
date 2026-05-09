## Why

DeepSeek CLI can already apply governed file writes and exact edits, but R2 requires a reliable checkpoint and undo layer so longer coding sessions can recover from bad edits without relying on ad hoc git state. This is needed now because core tools are usable enough to mutate workspaces, and every mutation must have a deterministic recovery path before broader agent autonomy.

DeepSeek CLI 已经能够执行受治理的文件写入和精确编辑，但 R2 要求具备可靠的 checkpoint 与 undo 层，让长时间 coding session 可以从错误编辑中恢复，而不是依赖临时的 git 状态。现在推进该能力，是因为 core tools 已经可以修改 workspace，继续扩大 agent 自主性之前，每次修改都必须具备确定性的恢复路径。

## Roadmap Metadata / 路线图元数据

```text
Roadmap node / 路线图节点: R2 Context And Safety
Launch gate / 发布门禁: alpha
Owner packages / 责任包: platform-contracts, workspace-state-management, core-coding-tools, runtime, session-store, testing-regression
Dependencies / 依赖: R1 core coding tools, session resume/fork, policy sandbox rollback evidence
Required tests / 必需测试: unit, contract, integration, golden, matrix
Acceptance evidence / 验收证据: checkpoint create/restore trace, undo trace, failed-restore policy evidence, no raw secret snapshots
Risk class / 风险等级: high
Data/privacy class / 数据与隐私等级: sensitive
Host surfaces / Host 表面: cli | vscode | server | sdk
Protocol impact / 协议影响: additive
Feature flag / 功能开关: required
Migration/rollback / 迁移与回滚: not-needed for v1 in-memory contracts; future persisted checkpoint schemas require compatibility tests
```

## What Changes

- Add a platform-level checkpoint and undo contract for workspace mutations.
- Extend workspace state management so applied file edit transactions can create checkpoint records, restore checkpoint records, and undo the latest eligible transaction.
- Ensure checkpoint payloads are redaction-aware: content hashes are always recorded, while content previews and rollback payloads must not expose raw secrets.
- Add runtime/session-visible evidence for checkpoint creation, restore, undo, failure, and replay.
- Add deterministic tests for checkpoint creation, undo success, restore success, rejected restore, and secret-safe evidence.
- No breaking changes. Existing edit transaction APIs remain valid and receive additive metadata.

- 增加平台级 workspace mutation checkpoint 与 undo 契约。
- 扩展 workspace state management，使已应用的文件编辑事务可以创建 checkpoint record、恢复 checkpoint record，并撤销最近一个符合条件的 transaction。
- 确保 checkpoint payload 具备脱敏意识：始终记录 content hash，但 content preview 与 rollback payload 不得暴露 raw secret。
- 为 checkpoint create、restore、undo、failure 与 replay 增加 runtime/session 可见证据。
- 增加确定性测试，覆盖 checkpoint 创建、undo 成功、restore 成功、restore 被拒绝以及 secret-safe evidence。
- 不引入破坏性变更。现有 edit transaction API 保持有效，仅增加 additive metadata。

## Capabilities

### New Capabilities

- `checkpoint-undo`: Checkpoint creation, restoration, undo selection, evidence shape, and redaction rules for workspace mutations.

### Modified Capabilities

- `workspace-state-management`: Workspace edit transactions gain checkpoint/undo lifecycle requirements.
- `core-coding-tools`: File write/edit tools must expose checkpoint identifiers and rollback evidence suitable for undo.
- `testing-regression`: Regression fixtures must replay checkpoint and undo events without leaking raw sensitive content.

## Impact

- Contracts: `platform-contracts` gains checkpoint/undo DTOs and workspace manager methods.
- Implementation: `workspace-state-management` stores deterministic checkpoint records and applies restore/undo through injected platform file operations.
- Tools: `core-coding-tools` records checkpoint references for write/edit mutations.
- Tests: unit, contract, integration, golden, and matrix tests cover the new R2 recovery path.
- Docs: developer/product docs reference checkpoint/undo as an implemented R2 safety building block after archive.

- 契约：`platform-contracts` 增加 checkpoint/undo DTO 与 workspace manager 方法。
- 实现：`workspace-state-management` 存储确定性 checkpoint record，并通过注入的平台文件操作执行 restore/undo。
- 工具：`core-coding-tools` 为 write/edit mutation 记录 checkpoint reference。
- 测试：unit、contract、integration、golden 和 matrix tests 覆盖新的 R2 恢复路径。
- 文档：archive 后开发者与产品文档将把 checkpoint/undo 标记为已实现的 R2 安全基础能力。
