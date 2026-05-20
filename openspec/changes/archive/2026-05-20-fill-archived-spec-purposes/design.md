## Context

OpenSpec archive generated many canonical specs with placeholder Purpose text. / OpenSpec 归档曾生成了大量带 placeholder Purpose 的 canonical specs。

The requirements themselves can still validate, but the top-level ownership summary is the first thing readers and governance tools see. Leaving it as `TBD` makes the canonical spec look unfinished even when requirements are real. / 这些 requirements 本身仍可校验，但顶层 ownership summary 是读者和治理工具首先看到的内容。即使 requirements 已经真实存在，保留 `TBD` 也会让 canonical spec 看起来未完成。

## Goals / Non-Goals

**Goals:**

- Replace generated Purpose placeholders with concise bilingual statements. / 用简洁双语说明替换生成的 Purpose 占位。
- Add a regression test that prevents placeholders from returning. / 增加回归测试，防止占位文本回流。
- Keep each Purpose scoped to the capability's actual requirements and avoid overstating product readiness. / 每个 Purpose 只覆盖该 capability 的真实 requirements，不夸大产品就绪状态。

**Non-Goals:**

- This does not change runtime, CLI, provider, plugin, or host behavior. / 本变更不改变 runtime、CLI、provider、plugin 或 host 行为。
- This does not rewrite requirements or scenarios beyond Purpose hygiene. / 本变更不重写 Purpose 卫生之外的 requirements 或 scenarios。
- This does not archive unrelated active changes. / 本变更不归档无关 active changes。

## Decisions

1. Purpose text is bilingual but compact. / Purpose 文本保持双语且简洁。

   Each canonical spec gets an English sentence and a Chinese sentence. This is enough for ownership discovery without bloating every spec. / 每个 canonical spec 使用一句英文和一句中文，足以支撑职责发现，同时避免膨胀每个 spec。

2. Purpose statements describe ownership, not readiness. / Purpose 描述职责，不描述就绪等级。

   A spec can cover planned, partial, deferred, or placeholder work. The Purpose must not imply product-ready status unless the requirements and evidence support it. / spec 可以覆盖 planned、partial、deferred 或 placeholder 工作。除非 requirements 和 evidence 支撑，否则 Purpose 不得暗示 product-ready。

3. Regression checks canonical specs, not archived history. / 回归检查 canonical specs，而不是归档历史。

   Archived change folders are historical evidence and may preserve old generator output. The hygiene gate targets `openspec/specs/**/spec.md`, where current canonical requirements live. / 已归档 change folders 是历史证据，可能保留旧生成输出。卫生门禁只针对 `openspec/specs/**/spec.md`，即当前 canonical requirements 所在位置。

## Risks / Trade-offs

- [Risk] Purpose text can become generic. / Purpose 文本可能变得泛化。
  Mitigation: derive each statement from capability name plus its first requirement area, and keep product-readiness claims out. / 缓解：每条说明从 capability 名称和首要 requirement 领域提炼，并避免产品就绪夸大。
- [Risk] New archive operations can reintroduce placeholders. / 新归档操作可能再次引入占位。
  Mitigation: contract test fails on the canonical spec tree whenever the generated placeholder remains. / 缓解：只要 canonical spec tree 保留生成占位，contract test 就失败。
