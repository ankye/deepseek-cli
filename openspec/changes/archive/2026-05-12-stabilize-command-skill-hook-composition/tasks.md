## 1. Contracts / 契约

- [x] 1.1 Add implementation-free command composition DTOs and diagnostics in `@deepseek/platform-contracts`. / 在 `@deepseek/platform-contracts` 增加无实现的命令组合 DTO 与诊断类型。
- [x] 1.2 Extend `CommandManifest` with additive owner, source, permissions, compatibility, projection, target, output schema, redaction, and pit metadata. / 为 `CommandManifest` 增加 owner、source、permissions、compatibility、projection、target、output schema、redaction 和坑位元数据等增量字段。
- [x] 1.3 Export composition contracts from the platform contract public surface without adding host or implementation dependencies. / 从平台契约公共出口导出组合契约，且不引入 host 或实现依赖。

## 2. Composition Registry / 组合注册表

- [x] 2.1 Implement focused composition registry and projection helpers under `@deepseek/command-system` while keeping `index.ts` export-only. / 在 `@deepseek/command-system` 下实现聚焦的组合注册表与投影 helpers，并保持 `index.ts` 只做导出。
- [x] 2.2 Normalize command manifests and generic contribution records into inert versioned composition records with conservative defaults. / 将 command manifests 与通用 contribution records 归一为惰性、版本化 composition records，并填充保守默认值。
- [x] 2.3 Implement deterministic user-visible, host-visible, model-visible, and result-list projection filters with typed diagnostics. / 实现确定性的 user-visible、host-visible、model-visible 和 result-list 投影过滤器，并返回类型化诊断。
- [x] 2.4 Reject duplicate names or aliases in the same projection scope unless disabled or hidden policy metadata removes one side. / 拒绝同一投影范围内重复的名称或别名，除非 disabled 或 hidden policy metadata 排除其中一方。

## 3. Existing Commands / 现有命令接入

- [x] 3.1 Register readiness and interactive control commands with composition metadata and host-only lifecycle visibility where appropriate. / 为 readiness 和 interactive control commands 注册组合元数据，并在适用处标记 host-only lifecycle visibility。
- [x] 3.2 Provide slash/help projection helpers derived from composition records without invoking command handlers. / 提供基于 composition records 的 slash/help 投影 helpers，且不调用 command handlers。

## 4. Regression Coverage / 回归覆盖

- [x] 4.1 Add contract tests for inert projection, target ids, stable ordering, collision diagnostics, disabled duplicates, and fail-closed model projection. / 增加契约测试，覆盖惰性投影、target ids、稳定排序、碰撞诊断、已禁用重复项和模型投影安全失败。
- [x] 4.2 Add contribution normalization tests for command, skill, hook, MCP, plugin, extension, workflow, renderer hint, and pit fixture metadata. / 增加 contribution normalization 测试，覆盖 command、skill、hook、MCP、plugin、extension、workflow、renderer hint 和坑位 fixture 元数据。
- [x] 4.3 Add command-system tests proving help/slash projection uses composition metadata and host controls stay out of model-visible projection. / 增加 command-system 测试，证明 help/slash 投影使用组合元数据且 host controls 不进入 model-visible 投影。

## 5. Docs And Verification / 文档与验证

- [x] 5.1 Update roadmap and CLI documentation where the R3 composition sequencing or visible help behavior changed. / 在 R3 组合层顺序或可见 help 行为变化处更新路线图与 CLI 文档。
- [x] 5.2 Run OpenSpec validation, typecheck, lint, targeted tests, npm test when feasible, boundary checks, and git hygiene checks. / 运行 OpenSpec validation、typecheck、lint、定向测试、可行时运行 npm test、边界检查和 git hygiene 检查。
