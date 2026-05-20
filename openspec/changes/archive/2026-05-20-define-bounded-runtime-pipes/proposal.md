## Why

DeepSeek needs Linux-like bounded pipes for context, tool results, agent streams, plugins, MCP, and runtime events so producers cannot flood consumers or destabilize prefix-cache behavior. / DeepSeek 需要 Linux-like bounded pipes 来承载 context、tool results、agent streams、plugins、MCP 与 runtime events，使生产者不能淹没消费者或破坏 prefix-cache 行为。

Current message and protocol flows are contract-rich, but backpressure, overflow, and replay semantics are not yet governed as a first-class runtime primitive. / 当前 message 与 protocol flow 契约较丰富，但 backpressure、overflow 与 replay semantics 尚未作为一等 runtime primitive 治理。

## What Changes

- Define bounded stream semantics for runtime-message-bus channels. / 为 runtime-message-bus channels 定义有界 stream 语义。
- Add backpressure, overflow policy, replay safety, and diagnostics requirements. / 增加 backpressure、overflow policy、replay safety 与 diagnostics 要求。
- Extend communication protocol metadata to preserve stream identity, sequence, pressure state, and loss policy. / 扩展 communication protocol metadata，保留 stream identity、sequence、pressure state 与 loss policy。

## Capabilities

### New Capabilities

### Modified Capabilities

- `runtime-message-bus`: Add bounded pipe, backpressure, overflow, and replay requirements. / 增加 bounded pipe、backpressure、overflow 与 replay 要求。
- `communication-protocol`: Add stream metadata requirements for pressure-aware host/runtime transport. / 增加 pressure-aware host/runtime transport 的 stream metadata 要求。

## Impact

- Owner packages / 责任包: `runtime-message-bus`, `communication-protocol`, `runtime`, `apps/cli`, future hosts.
- Runtime behavior / 运行时行为: implementation will add explicit limits and pressure events; proposal phase only opens governance. / 实现阶段会增加显式限制与 pressure events；提案阶段仅打开治理。
