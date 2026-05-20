## Why

Archived OpenSpec specs are the canonical requirements source, but many still carry generated `TBD - created by archiving change` Purpose text. / 已归档 OpenSpec specs 是规范需求来源，但许多仍带有生成的 `TBD - created by archiving change` Purpose 文本。

That weakens governance because readers and tools cannot quickly tell what a capability owns after archive. / 这会削弱治理，因为读者和工具无法在归档后快速判断某个 capability 的职责边界。

## What Changes

- Replace generated Purpose placeholders in canonical specs with concise bilingual ownership statements. / 将 canonical specs 中生成的 Purpose 占位文本替换为简洁的双语职责说明。
- Add a documentation hygiene requirement that archived canonical specs must not retain generated Purpose placeholders. / 增加文档卫生要求：已归档 canonical specs 不得保留生成的 Purpose 占位。
- Add deterministic regression coverage that fails when a canonical spec Purpose still contains the generated placeholder. / 增加确定性回归覆盖：canonical spec Purpose 仍含生成占位时失败。
- Keep this docs/spec/test focused; no runtime behavior changes. / 本变更聚焦 docs/spec/test，不改变 runtime 行为。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `bilingual-openspec-documentation`: Require canonical spec Purpose sections to be bilingual, meaningful, and non-placeholder after archive. / 要求 canonical spec 的 Purpose 在归档后保持双语、有意义且非占位。
- `testing-regression`: Require deterministic hygiene coverage for archived spec Purpose placeholders. / 要求对已归档 spec Purpose 占位提供确定性卫生覆盖。

## Impact

- Affected specs: `openspec/specs/**/spec.md` Purpose sections. / 影响 specs：`openspec/specs/**/spec.md` 的 Purpose 区段。
- Affected tests: new contract test for OpenSpec Purpose hygiene. / 影响测试：新增 OpenSpec Purpose hygiene contract test。
- Affected workflow: future archive cleanup must remove generated Purpose placeholders before closing governance work. / 影响流程：后续归档清理必须在关闭治理工作前移除生成的 Purpose 占位。
