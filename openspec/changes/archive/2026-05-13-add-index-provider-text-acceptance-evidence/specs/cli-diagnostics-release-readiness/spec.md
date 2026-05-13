## MODIFIED Requirements

### Requirement: Index Provider Safety Appears In Readiness Evidence / Index Provider 安全性进入可用性证据

CLI diagnostics and release readiness evidence SHALL include test or evidence references for index provider status/configuration safety, activation evidence gating, and text-mode evidence rendering when the index-provider command surface is present.

当 index-provider command surface 存在时，CLI diagnostics 与 release readiness evidence 必须包含 index provider status/configuration safety、activation evidence gating 与 text-mode evidence rendering 的测试或证据引用。

#### Scenario: Release evidence covers local provider intent safety / 发布证据覆盖本地 Provider Intent 安全
- **WHEN** release readiness evidence is generated or reviewed
- **THEN** it identifies the local readiness or e2e suite that proves `index-provider set` writes only provider intent and does not execute semantic providers or expose raw secrets
- **中文** 当生成或评审 release readiness evidence 时，必须标识 local readiness 或 e2e suite，证明 `index-provider set` 只写入 provider intent，不执行 semantic providers，也不暴露 raw secrets。

#### Scenario: Release evidence covers provider activation evidence gate / 发布证据覆盖 Provider Activation Evidence Gate
- **WHEN** release readiness evidence is generated or reviewed
- **THEN** it identifies the contract suite that proves semantic providers remain deferred unless required activation evidence is present
- **中文** 当生成或评审 release readiness evidence 时，必须标识 contract suite，证明 semantic providers 在缺少 required activation evidence 时保持 deferred。

#### Scenario: Release evidence covers text-mode provider evidence / 发布证据覆盖 Text Mode Provider Evidence
- **WHEN** release readiness evidence is generated or reviewed
- **THEN** it identifies the CLI or e2e suite that proves `index-provider` and `diagnostics doctor` text output render activation evidence and missing-evidence reasons without terminal controls or raw secrets
- **中文** 当生成或评审 release readiness evidence 时，必须标识 CLI 或 e2e suite，证明 `index-provider` 与 `diagnostics doctor` text output 会渲染 activation evidence 与 missing-evidence reasons，且不包含 terminal controls 或 raw secrets。
