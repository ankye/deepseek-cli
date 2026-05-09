# Protocol And Events / 协议与事件

DeepSeek CLI uses protocol and runtime events as the shared contract between CLI, VSCode, future server, SDK, native hosts, tests, and replay tools.

DeepSeek CLI 使用 protocol 与 runtime events 作为 CLI、VSCode、未来 server、SDK、native host、测试和 replay 工具之间的共享契约。

## Protocol Role / 协议角色

The protocol layer is responsible for:

协议层负责：

- versioned envelopes / 版本化 envelope
- routing between host/runtime/server / host、runtime、server 之间的路由
- redaction metadata / 脱敏 metadata
- version contract metadata / 版本契约 metadata
- replayable payloads / 可 replay payload
- typed errors / typed errors

## Runtime Event Role / Runtime Event 角色

Runtime events represent execution facts.

runtime events 表示执行事实。

They are used by:

它们被以下系统使用：

- CLI renderer / CLI 渲染器
- VSCode bridge / VSCode bridge
- session store / session store
- runtime message bus / runtime message bus
- observability / observability
- golden replay tests / golden replay tests
- future local server and SDK / 未来 local server 与 SDK

## Event Consumption Rule / 事件消费规则

If a host needs to display state, it should derive that state from events. It should not query runtime internals or build a separate execution model.

如果 host 需要展示状态，应从 events 派生状态。它不应查询 runtime internals，也不应构建单独的执行模型。

## Replay Rule / Replay 规则

Events must be:

事件必须：

- serializable / 可序列化
- redacted / 已脱敏
- traceable / 可追踪
- session-linked / 关联 session
- stable enough for golden tests / 足够稳定，可用于 golden tests

## Event Stability / 事件稳定性

Changes to event shape should be treated as protocol changes.

事件形态变更应视为协议变更。

| Change / 变更 | Handling / 处理 |
| --- | --- |
| Add optional field / 增加可选字段 | Usually additive; update versioning tests when persisted. / 通常是增量；若持久化则更新 versioning 测试。 |
| Rename field / 字段重命名 | Breaking; needs OpenSpec and explicit migration or fail-closed rejection plan. / breaking；需要 OpenSpec 和显式迁移或 fail-closed 拒绝方案。 |
| Remove field / 删除字段 | Breaking; avoid until versioned protocol boundary exists. / breaking；在版本化协议边界前避免。 |
| Add event kind / 增加事件类型 | Add docs, tests, and host rendering behavior. / 增加文档、测试和 host 渲染行为。 |
| Change redaction / 改变脱敏 | Security-sensitive; update secret/sandbox tests. / 安全敏感；更新 secret/sandbox 测试。 |
