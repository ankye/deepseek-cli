# Platform Contracts UAPI / Platform Contracts 用户态 ABI

`@deepseek/platform-contracts` is the platform UAPI. Treat it like a kernel syscall and event ABI, not like an internal TypeScript convenience package.

`@deepseek/platform-contracts` 是平台 UAPI。应把它视为 kernel syscall 与 event ABI，而不是内部 TypeScript 便利包。

## Ownership / 责任

Platform contracts own cross-package DTOs, ids, envelopes, events, errors, manifests, and service interfaces. They do not own implementations, host APIs, provider SDKs, test fakes, filesystem/process access, or package-private internals.

Platform contracts 负责跨 package DTO、id、envelope、event、error、manifest 与 service interface。它们不负责实现、host API、provider SDK、测试 fake、文件系统/进程访问或 package-private internals。

## Surface Classes / 表面分类

| Class / 分类 | Examples / 示例 | Compatibility rule / 兼容规则 |
| --- | --- | --- |
| IDs / ID | `SessionId`, `TurnId`, `TaskId`, `CapabilityId` | Format or semantic changes require migration tests or fail-closed readers. / 格式或语义变化需要迁移测试或 fail-closed reader。 |
| Envelopes / 信封 | `VersionedEnvelope`, protocol envelopes, execution envelopes | Add optional fields when possible; breaking changes require version negotiation. / 尽量添加 optional fields；breaking change 需要版本协商。 |
| Events / 事件 | `RuntimeEvent`, `SessionEvent`, observability records | Persisted or replayed changes require golden/replay evidence. / persisted 或 replayed 变化需要 golden/replay 证据。 |
| Errors / 错误 | `RedactedError`, `KernelErrorCode` | Rename/remove/retype requires stable diagnostic mapping. / 重命名、删除或重定型需要稳定 diagnostic mapping。 |
| Manifests / Manifest | capability, plugin, skill, hook, MCP manifests | Permission, trust, or schema changes require compatibility fixtures. / permission、trust 或 schema 变化需要兼容 fixture。 |
| Service interfaces / 服务接口 | model, context, prompt, policy, bus interfaces | Implementations live in owner packages; contracts remain host-agnostic. / 实现留在责任包；contracts 保持 host-agnostic。 |

## Compatibility Labels / 兼容标签

| Label / 标签 | Meaning / 含义 |
| --- | --- |
| `additive-default` | New optional metadata or new variants are preferred. / 优先新增 optional metadata 或新 variant。 |
| `migration-required` | Breaking, persisted, or replay-affecting changes need migration and replay evidence. / breaking、persisted 或 replay-affecting 变化需要迁移与 replay 证据。 |
| `fail-closed-versioned` | Readers must version-negotiate or reject old/new records with stable diagnostics. / reader 必须版本协商，或用稳定 diagnostic 拒绝旧/新记录。 |
| `internal-only` | Not persisted, not host/plugin-facing, and not replayed. / 不持久化、不面向 host/plugin、不参与 replay。 |

## Change Gate / 变更门禁

Every UAPI change is classified through `assessUapiChange`:

每个 UAPI 变更通过 `assessUapiChange` 分类：

```text
contract change
  -> surface inventory lookup
  -> compatibility label
  -> required evidence
  -> pass or stable fail-closed diagnostic
```

Breaking or persisted changes require at least one version decision:

Breaking 或 persisted 变化至少需要一个版本决策：

- versioned reader / 版本化 reader
- fail-closed rejection / fail-closed 拒绝
- migration test for breaking changes / breaking change 的迁移测试
- replay or golden evidence for replay-affecting changes / replay-affecting change 的 replay 或 golden 证据

## Guardrails / 护栏

The lint framework rejects these imports from `platform-contracts`:

lint framework 会拒绝 `platform-contracts` 中的以下导入：

- app packages such as `deepseek-agent-cli` or `@deepseek/vscode-extension` / app packages，例如 `deepseek-agent-cli` 或 `@deepseek/vscode-extension`
- host APIs such as `node:fs`, `node:process`, or `vscode` / host API，例如 `node:fs`、`node:process` 或 `vscode`
- provider SDKs such as `openai` or `@anthropic-ai/sdk` / provider SDK，例如 `openai` 或 `@anthropic-ai/sdk`
- test fakes such as `@deepseek/testing-regression` / 测试 fake，例如 `@deepseek/testing-regression`
- private package internals such as `@deepseek/runtime/src/*` / 私有 package internals，例如 `@deepseek/runtime/src/*`

## Diagnostics / 诊断

Release diagnostics include `governance.platform-contracts-uapi`. It reports inventory coverage, compatibility labels, negative breaking-change fixture detection, and positive migration fixture acceptance.

Release diagnostics 包含 `governance.platform-contracts-uapi`。它报告 inventory 覆盖、compatibility labels、negative breaking-change fixture detection，以及 positive migration fixture acceptance。
