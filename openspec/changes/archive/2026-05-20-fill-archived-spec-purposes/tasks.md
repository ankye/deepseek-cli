## 1. Contract First / 契约先行

- [x] 1.1 Add a deterministic contract test that fails on generated canonical spec Purpose placeholders and missing bilingual Purpose text. / 增加确定性 contract test，在 canonical spec Purpose 仍为生成占位或缺少双语 Purpose 时失败。
- [x] 1.2 Validate the OpenSpec change with `openspec validate fill-archived-spec-purposes --strict`. / 使用 `openspec validate fill-archived-spec-purposes --strict` 校验本变更。

## 2. Purpose Cleanup / Purpose 清理

- [x] 2.1 Inventory canonical specs with generated Purpose placeholders. / 盘点仍含生成 Purpose 占位的 canonical specs。
- [x] 2.2 Replace each placeholder Purpose with concise bilingual ownership text without overstating readiness. / 将每个 placeholder Purpose 替换为简洁双语 ownership 文本，且不夸大 readiness。
- [x] 2.3 Confirm no canonical specs retain `TBD - created by archiving change`. / 确认 canonical specs 不再保留 `TBD - created by archiving change`。

## 3. Verification / 验证

- [x] 3.1 Run the focused OpenSpec Purpose hygiene contract test. / 运行聚焦的 OpenSpec Purpose hygiene contract test。
- [x] 3.2 Run `openspec validate --specs --strict`. / 运行 `openspec validate --specs --strict`。
- [x] 3.3 Update task status and leave evidence references for archive. / 更新任务状态并留下归档证据引用。

## Evidence / 证据

- `openspec validate fill-archived-spec-purposes --strict`
- `npx tsx --test tests/contracts/openspec-purpose-hygiene.test.ts`
- `rg -n "TBD - created by archiving change" openspec/specs`
- `openspec validate --specs --strict`
- `npm run typecheck`
- `npm run lint`
