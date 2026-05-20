## Why

Plugins, MCP bridges, hooks, skills, and future extensions must behave like governed modules, not private runtime imports. / Plugins、MCP bridges、hooks、skills 与未来 extensions 必须像受治理 modules 一样运行，而不是私有 runtime imports。

Without manifest, permission, lifecycle, and audit boundaries, extension growth will weaken the stable kernel and policy model. / 如果缺少 manifest、permission、lifecycle 与 audit boundaries，扩展增长会削弱稳定内核与 policy model。

## What Changes

- Require plugin/module manifests, permissions, contributions, lifecycle states, and disable/unload semantics. / 要求 plugin/module manifests、permissions、contributions、lifecycle states 与 disable/unload semantics。
- Prevent modules from receiving private runtime objects or bypassing public contracts. / 防止 modules 获取私有 runtime objects 或绕过公共契约。
- Route risky module behavior through policy-sandbox and diagnostics. / 将有风险 module behavior 通过 policy-sandbox 与 diagnostics。

## Capabilities

### New Capabilities

### Modified Capabilities

- `plugin-system`: Add governed module boundary, manifest, lifecycle, and public contract requirements. / 增加受治理 module boundary、manifest、lifecycle 与公共契约要求。
- `policy-sandbox`: Add plugin/module permission and execution gate requirements. / 增加 plugin/module permission 与 execution gate 要求。

## Impact

- Owner packages / 责任包: `plugin-system`, `mcp-gateway`, `command-system`, `policy-sandbox`, `runtime`, future host adapters.
- Ecosystem posture / 生态姿态: plugin expansion remains gated until module governance evidence exists. / 在 module governance evidence 存在前，plugin expansion 保持 gated。
