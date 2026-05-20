## Context

The repository already documents test-first behavior and the canonical `testing-regression` spec requires it, but the default `npm run lint` path does not inspect the current change set. / 仓库已经记录 test-first 行为，规范 `testing-regression` 也要求它，但默认 `npm run lint` 还不会检查当前变更集。

This gap matters most for governance work: a proposal, doc, or diagnostic can look complete while implementation files change without focused regression coverage. / 这个缺口对治理工作尤其危险：proposal、文档或诊断看似完整，但实现文件可能在没有聚焦回归覆盖时被修改。

## Goals / Non-Goals

**Goals:**

- Make `npm run lint` fail when a change modifies non-test implementation files under `src/**` without accompanying focused tests. / 当变更修改 `src/**` 下非测试实现文件但没有伴随聚焦测试时，让 `npm run lint` 失败。
- Keep the gate deterministic, local, and independent of live providers or CI metadata. / 门禁必须确定性、本地可运行，且不依赖 live providers 或 CI metadata。
- Allow explicit OpenSpec verification exceptions with reason and substitute verification text. / 允许带原因与替代验证说明的 OpenSpec verification 例外。
- Keep docs-only and acceptance evidence-only edits lightweight. / 对纯文档与 acceptance evidence-only 编辑保持轻量。

**Non-Goals:**

- This does not measure runtime code coverage percentages. / 本变更不测量运行时代码覆盖率百分比。
- This does not prove that a test semantically covers every changed line. / 本变更不证明某个测试语义上覆盖了每一行变更。
- This does not replace review judgment or existing typecheck/test gates. / 本变更不替代人工 review 判断，也不替代现有 typecheck/test gates。

## Decisions

1. Use a git change-set gate rather than static AST lint. / 使用 git 变更集门禁，而不是静态 AST lint。

   The rule is about workflow shape: "implementation changed with no test changed." Git already provides that evidence locally and in CI. The script will inspect `git status --short --untracked-files=all` and parse changed paths, including untracked files. / 该规则关注流程形态：“实现变了但测试没变”。Git 已经能在本地和 CI 提供此证据。脚本会检查 `git status --short --untracked-files=all` 并解析 changed paths，包括 untracked files。

2. Treat any focused test change as satisfying the gate. / 任何聚焦测试变更都满足门禁。

   Accepted coverage paths include package-local `test/` folders, `*.test.ts`, and shared `tests/contracts`, `tests/integration`, `tests/golden`, `tests/matrix`, `tests/e2e`, and versioning tests. This keeps the rule broad enough for kernel, protocol, TUI, and diagnostics work. / 可接受覆盖路径包括包内 `test/`、`*.test.ts`，以及共享 `tests/contracts`、`tests/integration`、`tests/golden`、`tests/matrix`、`tests/e2e` 与 versioning tests。这样能覆盖 kernel、protocol、TUI 与 diagnostics 工作。

3. Keep exceptions explicit and scarce. / 例外必须显式且稀少。

   If implementation cannot be tested first, an active OpenSpec change must include `Test-first exception` plus `Substitute verification` text in proposal, design, or tasks. The script accepts that as a conscious governance record instead of a silent bypass. / 如果实现确实无法先测，active OpenSpec change 必须在 proposal、design 或 tasks 中包含 `Test-first exception` 和 `Substitute verification` 文本。脚本把这视为有意识的治理记录，而不是静默绕过。

4. Wire through `scripts/lint.mjs` instead of only documenting a command. / 通过 `scripts/lint.mjs` 接入，而不是只记录一个命令。

   The existing verification guidance already tells developers to run `npm run lint`; adding the gate there turns the rule into a default local/CI blocker. / 现有验证指南已经要求运行 `npm run lint`；将门禁加入其中会把规则变成默认本地/CI 阻断器。

## Risks / Trade-offs

- [Risk] A broad "any test changed" rule can allow weak coverage. / 宽泛的“任意测试变更”可能允许弱覆盖。
  Mitigation: keep this as a minimum gate and rely on review plus focused test names for semantic quality. / 缓解：把它作为最低门禁，语义质量仍由 review 与聚焦测试命名把关。
- [Risk] Generated or mechanical implementation changes may need exceptions. / 生成式或机械实现变更可能需要例外。
  Mitigation: require OpenSpec exception text with substitute verification so the bypass is visible and reviewable. / 缓解：要求 OpenSpec 例外文本与替代验证，使绕过可见且可审查。
- [Risk] Dirty working trees with old implementation changes can trip the gate while doing docs cleanup. / 脏工作区中既有实现变更可能在做文档清理时触发门禁。
  Mitigation: this is intended; implementation changes should remain paired with tests until they are committed or reverted. / 缓解：这是预期行为；实现变更在提交或回退前都应保持与测试配对。
