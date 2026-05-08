## 1. Roadmap Artifacts / 路线图工件

- [x] 1.1 Create `docs/product/product-roadmap.md` with R0-R7 roadmap nodes, reference-source evidence, DeepSeek architecture mapping, and next OpenSpec candidates. / 创建 `docs/product/product-roadmap.md`，包含 R0-R7 路线图节点、参考源码证据、DeepSeek 架构映射和后续 OpenSpec 候选。
- [x] 1.2 Document roadmap metadata required for future OpenSpec proposals: node, launch gate, owner packages, dependencies, test level, and acceptance evidence. / 记录后续 OpenSpec proposal 必需的路线图元数据：节点、发布门禁、责任包、依赖、测试等级和验收证据。
- [x] 1.3 Document that reference source informs capability gaps but must not be copied into implementation or specs. / 记录参考源码只用于识别能力缺口，不得复制到实现或 specs。
- [x] 1.4 Add explicit roadmap landings for local readiness, personal credentials, observability/privacy, code intelligence, public SDK/control API, model capability governance, and host UX refinements. / 增加 local readiness、personal credentials、observability/privacy、code intelligence、public SDK/control API、model capability governance 和 host UX refinements 的明确路线图落点。
- [x] 1.5 Expand future OpenSpec metadata with risk class, data/privacy class, host surfaces, protocol impact, feature flag, and migration/rollback policy. / 扩展后续 OpenSpec 元数据，加入 risk class、data/privacy class、host surfaces、protocol impact、feature flag 和 migration/rollback policy。

## 2. OpenSpec Requirements / OpenSpec 要求

- [x] 2.1 Add `product-roadmap` spec for canonical roadmap, reference-informed mapping, node metadata, and staged competitive parity. / 增加 `product-roadmap` spec，覆盖规范路线图、参考驱动映射、节点元数据和分阶段竞品对齐。
- [x] 2.2 Add framework acceptance requirements for roadmap launch gates. / 增加 framework acceptance 对路线图发布门禁的要求。
- [x] 2.3 Add testing regression requirements for roadmap-node regression levels. / 增加 testing regression 对路线图节点回归等级的要求。
- [x] 2.4 Add future landing zone requirements for deferred product UX capabilities. / 增加 deferred product UX capabilities 的 future landing zone 要求。
- [x] 2.5 Add extension, VSCode, remote/server, and distribution roadmap sequencing requirements. / 增加 extension、VSCode、remote/server 和 distribution 的路线图排序要求。
- [x] 2.6 Add local readiness, credential staging, model capability governance, code intelligence, SDK/control API, and observability/privacy roadmap requirements. / 增加 local readiness、credential staging、model capability governance、code intelligence、SDK/control API 和 observability/privacy 路线图要求。
- [x] 2.7 Add acceptance and regression requirements for readiness, privacy, credential, SDK/API, code intelligence, and model governance evidence. / 增加 readiness、privacy、credential、SDK/API、code intelligence 和 model governance 证据的验收与回归要求。

## 3. Validation / 校验

- [x] 3.1 Run `openspec validate define-product-roadmap --type change --strict`. / 运行 `openspec validate define-product-roadmap --type change --strict`。
- [x] 3.2 Run `openspec validate --specs --strict`. / 运行 `openspec validate --specs --strict`。
- [x] 3.3 Run `npm run lint` to ensure roadmap docs and OpenSpec artifacts satisfy repository formatting rules. / 运行 `npm run lint`，确认路线图文档和 OpenSpec 工件满足仓库格式规则。
- [x] 3.4 Review `git status` to confirm reference directory contents are not staged or copied. / 检查 `git status`，确认参考目录内容没有被 staged 或复制。
