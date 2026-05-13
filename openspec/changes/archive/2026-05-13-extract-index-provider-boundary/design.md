## Context

The CLI currently owns PageIndex page DTOs, deterministic text recall, snapshot normalization, workspace freshness adjustment, and user-facing rendering in one command module. That is workable for a small prototype, but it will not hold once semantic recall, ZVec storage, code index references, and provider-specific freshness diagnostics are added.

CLI 当前在一个 command module 中同时承担 PageIndex page DTO、deterministic text recall、snapshot normalization、workspace freshness adjustment 与用户可见 rendering。小型原型阶段可以工作，但加入 semantic recall、ZVec storage、code index references 与 provider-specific freshness diagnostics 后会失控。

## Goals / Non-Goals

**Goals:**
- Create a host-agnostic index provider contract in `@deepseek/platform-contracts`.
- Move deterministic PageIndex normalization/search primitives into a shared package.
- Keep PageIndex as the deterministic truth source for semantic providers.
- Make provider configuration explicit enough for PageIndex-only, ZVec-deferred, and code-index-deferred modes.
- Keep CLI behavior and output stable.

**Non-Goals:**
- Implement ZVec storage, embeddings, ANN search, or code semantic ranking.
- Add external dependencies or network provider SDKs.
- Move terminal rendering or slash-command parsing into shared packages.
- Change existing PageIndex storage format beyond compatible metadata alignment.

## Decisions

- Add `@deepseek/index-provider` instead of expanding `context-engine` or `command-system`.
  - Rationale: indexing and recall are reusable by CLI, VSCode, runtime, and tests, but they are not context projection itself and should not be command UI logic.
  - Alternative considered: keep PageIndex in CLI until semantic recall exists. That would make later extraction riskier because CLI-specific DTOs would become de facto APIs.

- Keep DTOs in `@deepseek/platform-contracts`, implementation in `@deepseek/index-provider`.
  - Rationale: cross-package APIs stay implementation-free and host-agnostic while deterministic helpers remain reusable.

- Treat PageIndex as provider kind `pageindex` and semantic providers as `zvec` or `code-index` with `deferred` status for now.
  - Rationale: this captures product intent without pretending semantic recall is available.

- Keep CLI rendering local.
  - Rationale: terminal output is host-specific. Shared packages should return typed recall records, not text lines.

## Risks / Trade-offs

- [Risk] Early contracts can become too broad. -> Mitigation: include only fields already used by PageIndex plus provider ids/status needed to prevent architectural drift.
- [Risk] Refactor may churn a large CLI file. -> Mitigation: extract pure DTO/search helpers first and leave command parsing/rendering in place.
- [Risk] Semantic provider fields may imply a feature is ready. -> Mitigation: require explicit `deferred` status until a provider implementation supplies evidence-backed candidates.
