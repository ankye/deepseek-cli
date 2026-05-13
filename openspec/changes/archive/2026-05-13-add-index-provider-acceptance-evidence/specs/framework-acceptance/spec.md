## ADDED Requirements

### Requirement: Index Provider CLI Acceptance Evidence / Index Provider CLI 验收证据

Framework acceptance SHALL include evidence that index provider CLI status and configuration commands stay local, secret-safe, and governed by shared manifest normalization.

framework acceptance 必须包含证据，证明 index provider CLI status 与 configuration commands 保持本地、secret-safe，并受 shared manifest normalization 管控。

#### Scenario: Index provider command is covered by local readiness evidence / Index Provider 命令由本地可用性证据覆盖
- **WHEN** acceptance evidence is reviewed for CLI-first local readiness
- **THEN** evidence references an e2e or smoke test that runs `index-provider status` and `index-provider set zvec enabled`, showing requested/effective status separation without live provider execution
- **中文** 当评审 CLI-first local readiness 的 acceptance evidence 时，证据必须引用 e2e 或 smoke test，运行 `index-provider status` 与 `index-provider set zvec enabled`，并显示 requested/effective status 分离且不执行 live provider。
