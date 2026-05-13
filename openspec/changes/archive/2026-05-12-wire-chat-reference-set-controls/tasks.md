## 1. Contracts And Resolver / 契约与解析器

- [x] 1.1 Add `focus-reference` to CLI action contracts. / 将 `focus-reference` 加入 CLI action contracts。
- [x] 1.2 Implement reference focus action resolution over composition snapshots. / 基于 composition snapshots 实现 reference focus action resolution。
- [x] 1.3 Return typed diagnostics for missing reference targets while preserving state. / 对缺失 reference targets 返回类型化 diagnostics，并保留 state。

## 2. Chat Reference Controls / Chat 引用控制

- [x] 2.1 Add reference list summaries and item renderers for text, JSON, and JSONL. / 增加 text、JSON、JSONL 的 reference list summaries 与 item renderers。
- [x] 2.2 Wire `/palette refs list` to local palette state. / 将 `/palette refs list` 接入本地 palette state。
- [x] 2.3 Wire `/palette refs focus <ref-id|index|target-id|current>` to local focus resolution. / 将 `/palette refs focus <ref-id|index|target-id|current>` 接入本地 focus resolution。
- [x] 2.4 Update chat help for reference list and focus controls. / 更新 chat help，展示 reference list 与 focus controls。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add contract tests for successful and missing `focus-reference`. / 增加成功与缺失 `focus-reference` 的 contract tests。
- [x] 3.2 Add CLI chat JSONL tests for reference list and focus switching. / 增加 reference list 与 focus switching 的 CLI chat JSONL tests。
- [x] 3.3 Add CLI chat JSONL test for missing reference focus. / 增加 missing reference focus 的 CLI chat JSONL test。
- [x] 3.4 Add help assertions for `/palette refs list` and `/palette refs focus ...`. / 增加 `/palette refs list` 与 `/palette refs focus ...` 的 help 断言。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run targeted contract and CLI tests, typecheck, lint, boundary checks, and git hygiene checks. / 运行定向 contract 与 CLI tests、typecheck、lint、boundary checks 与 git hygiene checks。
