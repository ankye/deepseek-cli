## Context

Linux modules have metadata, load/unload lifecycle, and boundaries. DeepSeek modules need manifests, permissions, public contract paths, policy gates, and diagnostics so extensions do not become hidden kernel patches.

Linux modules 具备 metadata、load/unload lifecycle 与边界。DeepSeek modules 需要 manifests、permissions、public contract paths、policy gates 与 diagnostics，避免 extensions 变成隐形 kernel patch。

## Goals / Non-Goals

**Goals:**

- Define governed module manifest and lifecycle requirements. / 定义受治理 module manifest 与 lifecycle 要求。
- Prevent private runtime object access. / 防止访问私有 runtime object。
- Require permission and policy evidence for risky module contributions. / 要求风险 module contributions 具备 permission 与 policy evidence。

**Non-Goals:**

- Do not implement signed marketplace distribution here. / 本专项不实现签名市场分发。
- Do not design all plugin author APIs here. / 本专项不设计全部 plugin author APIs。

## Decisions

1. Modules contribute through manifests. / Modules 通过 manifests 贡献能力。

   Contributions declare commands, tools, hooks, MCP bridges, UI surfaces, permissions, and host/runtime compatibility.

   Contributions 声明 commands、tools、hooks、MCP bridges、UI surfaces、permissions 与 host/runtime compatibility。

2. Modules do not receive private runtime objects. / Modules 不接收私有 runtime objects。

   Extensions interact through public contracts, event streams, and capability APIs.

   Extensions 通过公共 contracts、event streams 与 capability APIs 交互。

3. Disable/unload is part of the contract. / Disable/unload 是契约的一部分。

   A module must have deterministic disable behavior, cleanup expectations, and diagnostics after unload.

   module 必须具备确定性 disable behavior、cleanup expectations 与 unload 后 diagnostics。

## Rollout

1. Define manifest and lifecycle records. / 定义 manifest 与 lifecycle records。
2. Add policy permission checks. / 增加 policy permission checks。
3. Add diagnostics for private access and lifecycle failures. / 增加 private access 与 lifecycle failures diagnostics。

## Open Questions

- Which first-party plugin APIs become stable first? / 哪些 first-party plugin APIs 最先稳定？
