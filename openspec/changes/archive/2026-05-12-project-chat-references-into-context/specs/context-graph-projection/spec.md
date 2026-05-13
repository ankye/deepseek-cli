## ADDED Requirements

### Requirement: Selected CLI References Enter ContextGraph Projection / 选中 CLI 引用进入 ContextGraph Projection

ContextGraph projection SHALL accept selected CLI reference content as typed context candidates only after runtime-owned resolution, policy checks, and platform path normalization.

ContextGraph projection 必须只在 runtime-owned resolution、policy checks 与 platform path normalization 之后，接受 selected CLI reference content 作为 typed context candidates。

#### Scenario: Reference materialization is governed / 引用物化受治理

- **WHEN** a prompt turn contains active CLI file references
- **THEN** runtime resolves those references through platform workspace path APIs, creates typed `file` candidates, and sends them through context projection before model dispatch
- **中文** 当 prompt turn 包含 active CLI file references 时，runtime 必须通过 platform workspace path APIs 解析这些 references，创建 typed `file` candidates，并在 model dispatch 前发送给 context projection。

#### Scenario: Unsupported references are evidence-only / 不支持的引用仅作为证据

- **WHEN** a prompt turn contains directory, symbol, diagnostic, diff, message, turn, or tool-evidence references not supported by this slice
- **THEN** projection evidence records them as unresolved or excluded reference ids without reading content or failing the turn
- **中文** 当 prompt turn 包含本阶段不支持的 directory、symbol、diagnostic、diff、message、turn 或 tool-evidence references 时，projection evidence 必须将其记录为 unresolved 或 excluded reference ids，不读取内容，也不让 turn 失败。
