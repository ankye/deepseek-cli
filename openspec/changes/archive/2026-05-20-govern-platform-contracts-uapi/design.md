## Context

Platform contracts are the equivalent of a kernel UAPI. A compile pass proves the repo agrees today, but it does not prove persisted replay records, future hosts, plugins, or protocol consumers can survive a contract change.

Platform contracts 相当于 kernel UAPI。编译通过只能证明仓库今天一致，不能证明 persisted replay records、未来 hosts、plugins 或 protocol consumers 能承受契约变更。

## Goals / Non-Goals

**Goals:**

- Classify contract changes by compatibility risk. / 按兼容性风险分类 contract changes。
- Require version and migration evidence for persisted or breaking changes. / 对 persisted 或 breaking changes 要求 version 与 migration evidence。
- Keep `platform-contracts` implementation-free and host-agnostic. / 保持 `platform-contracts` 无实现且 host-agnostic。

**Non-Goals:**

- Do not freeze all contracts permanently. / 不永久冻结所有 contracts。
- Do not implement a full external SDK in this change. / 本变更不实现完整外部 SDK。

## Decisions

1. Additive is the default path. / Additive 是默认路径。

   New optional fields, new event variants with version handling, and new diagnostics metadata are preferred over field rewrites.

   优先使用新 optional fields、带 version handling 的新 event variants 与新 diagnostics metadata，而不是重写字段。

2. Persisted and replayed contracts require extra evidence. / Persisted 与 replayed contracts 需要额外证据。

   Event records, envelopes, ids, errors, and DTOs used by golden replay or session storage need compatibility fixtures.

   golden replay 或 session storage 使用的 event records、envelopes、ids、errors 与 DTOs 需要兼容性 fixtures。

3. Contracts cannot import implementation. / Contracts 不能导入实现。

   The UAPI package must not import Node filesystem/process APIs, VSCode APIs, provider SDKs, or implementation packages.

   UAPI package 不得导入 Node filesystem/process APIs、VSCode APIs、provider SDKs 或 implementation packages。

## Rollout

1. Add compatibility labels and lint checks. / 增加兼容性标签与 lint checks。
2. Add migration evidence requirements for breaking changes. / 为 breaking changes 增加迁移证据要求。
3. Add replay and contract tests for persisted DTOs. / 为 persisted DTOs 增加 replay 与 contract tests。

## Open Questions

- Should compatibility metadata live next to contract definitions or in generated governance records? / 兼容性 metadata 应放在 contract definitions 旁边，还是生成到 governance records 中？
