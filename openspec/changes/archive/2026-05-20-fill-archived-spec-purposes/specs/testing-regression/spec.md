## ADDED Requirements

### Requirement: OpenSpec Purpose Hygiene Regression / OpenSpec Purpose 卫生回归

The regression suite SHALL detect generated archive placeholder Purpose text in canonical OpenSpec specs.

回归套件必须检测 canonical OpenSpec specs 中的归档生成 Purpose 占位文本。

#### Scenario: Placeholder purpose fails contract test / 占位 Purpose 触发 Contract Test 失败

- **WHEN** a canonical spec under `openspec/specs/**/spec.md` contains `TBD - created by archiving change`
- **THEN** the contract test reports the spec path and fails
- **中文** 当 `openspec/specs/**/spec.md` 下的 canonical spec 包含 `TBD - created by archiving change` 时，contract test 必须报告 spec path 并失败。

#### Scenario: Bilingual purpose passes contract test / 双语 Purpose 通过 Contract Test

- **WHEN** every canonical spec Purpose has non-placeholder English and Chinese text
- **THEN** the contract test passes without requiring runtime or provider access
- **中文** 当每个 canonical spec Purpose 都具备非占位英文和中文文本时，contract test 必须在不需要 runtime 或 provider access 的情况下通过。
