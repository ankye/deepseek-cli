# Future Host Landing Zones / 未来 Host 落点

The first framework reserves host-level landing zones without implementing deferred product UX.

首个框架阶段只预留 host 级落点，不直接实现延期产品 UX。

| Capability / 能力 | Landing Zone / 落点 | First Framework Position / 首框架定位 |
| --- | --- | --- |
| Voice and push-to-talk / 语音与按键说话 | Future host input adapter over the protocol. / 基于协议的未来 host 输入适配器。 | reserved / 预留 |
| Vim/keybindings/history search / Vim、快捷键与历史搜索 | CLI host input package. / CLI host 输入包。 | reserved / 预留 |
| Rich TUI, banners, tips, notifications / Rich TUI、横幅、提示与通知 | CLI renderer over runtime events. / 基于 runtime events 的 CLI renderer。 | reserved / 预留 |
| Cache-aware statusline / 缓存感知状态栏 | CLI renderer over `runtime.status.telemetry`, `context.pipeline.*`, and `model.cache.*` events. / 基于 `runtime.status.telemetry`、`context.pipeline.*` 与 `model.cache.*` events 的 CLI renderer。 | implemented and archived / 已实现并归档 |
| Browser/native host / 浏览器与原生 host | Future app adapter over remote/runtime protocol. / 基于 remote/runtime protocol 的未来 app adapter。 | reserved / 预留 |
| Plugin recommendation and onboarding / 插件推荐与引导 | Future recommendation service over plugin/catalog events. / 基于 plugin/catalog events 的未来推荐服务。 | reserved / 预留 |
| Team memory sync and managed settings / 团队记忆同步与托管设置 | Future enterprise service over memory/config contracts. / 基于 memory/config contracts 的未来企业服务。 | reserved / 预留 |
| Local daemon/server / 本地 daemon/server | Future transport app over protocol/session contracts. / 基于 protocol/session contracts 的未来 transport app。 | reserved / 预留 |
| Production sandbox matrix / 生产沙箱矩阵 | Hardened adapters behind policy/platform contracts. / policy/platform contracts 后的 hardened adapters。 | reserved / 预留 |
| Update UI / 更新 UI | Host renderer over distribution/evolution events. / 基于 distribution/evolution events 的 host renderer。 | reserved / 预留 |

These capabilities must enter through host adapters or platform services. They must not import runtime internals or bypass policy, session, protocol, or audit boundaries.

这些能力必须通过 host adapters 或 platform services 进入。它们不得导入 runtime internals，也不得绕过 policy、session、protocol 或 audit 边界。
