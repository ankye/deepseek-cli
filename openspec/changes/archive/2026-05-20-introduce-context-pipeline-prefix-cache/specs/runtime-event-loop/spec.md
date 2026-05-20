## ADDED Requirements

### Requirement: Runtime Builds Model Requests From Pipeline / Runtime 从管道构建模型请求

The runtime event loop SHALL build model requests from the layered context pipeline so stable upstream blocks remain ordered and volatile current-turn content stays at the tail.

Runtime event loop 必须从分层 context pipeline 构建模型请求，使稳定上游 blocks 保持有序，易变 current-turn content 保持在尾部。

#### Scenario: Turn assembly preserves prefix / 回合组装保持前缀

- **WHEN** two turns share the same kernel and project pipeline blocks
- **THEN** runtime model request assembly preserves identical upstream message/section ordering before appending new session or current-turn blocks
- **中文** 当两个 turn 共享相同 kernel 与 project pipeline blocks 时，runtime 模型请求组装必须在追加新的 session 或 current-turn blocks 前保持相同上游 message/section ordering。

#### Scenario: Pipeline evidence is emitted / 管道证据被发出

- **WHEN** runtime dispatches a model request
- **THEN** it emits replay-safe evidence containing pipeline fingerprint, per-layer prefix hashes, included block counts, excluded block counts, and cache hint summary
- **中文** 当 runtime dispatch 模型请求时，必须发出可 replay evidence，包含 pipeline fingerprint、按层 prefix hashes、included block counts、excluded block counts 与 cache hint summary。

### Requirement: Tool Result Projection Keeps Stable Prefix Clean / 工具结果投影保持稳定前缀清洁

The runtime event loop SHALL route raw tool results to current-turn feedback or artifact storage and route only bounded summaries or references into stable session pipeline blocks.

Runtime event loop 必须将 raw tool results 路由到 current-turn feedback 或 artifact storage，并且只将有界 summary 或 references 路由到稳定 session pipeline blocks。

#### Scenario: Raw output does not enter stable layer / Raw Output 不进入稳定层

- **WHEN** a tool returns large stdout, stderr, file content, or binary/artifact references
- **THEN** runtime excludes raw unbounded content from kernel, project, and stable session prefix layers and records bounded evidence instead
- **中文** 当 tool 返回大型 stdout、stderr、file content 或 binary/artifact references 时，runtime 必须将 raw unbounded content 排除在 kernel、project 与稳定 session prefix layers 之外，并记录有界 evidence。
