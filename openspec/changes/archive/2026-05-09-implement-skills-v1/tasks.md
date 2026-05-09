## 1. Contracts / 契约

- [x] 1.1 Add versioned skill DTOs for manifest validation, summaries, context segments, activation results, loading metadata, and diagnostics. / 增加 manifest validation、summaries、context segments、activation results、loading metadata 和 diagnostics 的版本化 skill DTO。
- [x] 1.2 Replace `SkillSystem` with canonical v1 validate, register, summarize, load/activate, and project context APIs. / 将 `SkillSystem` 替换为 canonical v1 validate、register、summarize、load/activate 和 project context APIs。

## 2. Skill System Implementation / Skill System 实现

- [x] 2.1 Implement deterministic manifest validation and structured rejection for incomplete or unsupported skills. / 实现确定性 manifest validation，并对 incomplete 或 unsupported skills 做 structured rejection。
- [x] 2.2 Implement summary-first progressive loading and activation metadata. / 实现 summary-first progressive loading 与 activation metadata。
- [x] 2.3 Enforce trust and enablement rules so untrusted or disabled skills remain inert. / 强制 trust 与 enablement rules，使 untrusted 或 disabled skills 保持 inert。
- [x] 2.4 Implement context-only skill segment projection with bounds, redaction, provenance, compatibility, and replay fingerprints. / 实现 context-only skill segment projection，包含 bounds、redaction、provenance、compatibility 和 replay fingerprints。

## 3. Tests / 测试

- [x] 3.1 Add package and contract tests for DTOs, manifest validation, progressive loading, activation, inertness, and redaction. / 增加 package 与 contract tests，覆盖 DTO、manifest validation、progressive loading、activation、inertness 和 redaction。
- [x] 3.2 Add integration and golden tests proving trusted skill segments flow into context projection as governed evidence. / 增加 integration 与 golden tests，证明 trusted skill segments 作为受治理 evidence 流入 context projection。
- [x] 3.3 Add compatibility and matrix tests for schema enforcement, malformed manifests, trust modes, disabled skills, and no-live-plugin behavior. / 增加 compatibility 与 matrix tests，覆盖 schema enforcement、malformed manifests、trust modes、disabled skills 和 no-live-plugin behavior。

## 4. Docs, Validation, Archive / 文档、校验与归档

- [x] 4.1 Update product/reference docs and roadmap implementation markers. / 更新 product/reference docs 与 roadmap implementation markers。
- [x] 4.2 Run typecheck, lint, tests, dependency boundaries, and OpenSpec validation. / 运行 typecheck、lint、tests、dependency boundaries 和 OpenSpec validation。
- [x] 4.3 Archive the completed OpenSpec change. / 归档完成的 OpenSpec change。
