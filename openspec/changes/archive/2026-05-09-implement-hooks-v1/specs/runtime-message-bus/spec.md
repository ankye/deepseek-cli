## ADDED Requirements

### Requirement: Hook Invocation Event Evidence / Hook Invocation 事件证据

The runtime message bus SHALL be able to carry redacted, replayable hook invocation evidence for hook order projection, invocation start, hook output, hook failure, hook skipped, and invocation terminal status.

runtime message bus 必须能够承载脱敏、可 replay 的 hook invocation evidence，覆盖 hook order projection、invocation start、hook output、hook failure、hook skipped 和 invocation terminal status。

#### Scenario: Hook invocation records are replayable / hook invocation records 可 replay

- **WHEN** hooks v1 invokes hooks for a lifecycle point
- **THEN** emitted or captured records include schema version, point, ordered hook ids, per-hook status, terminal status, redaction metadata, diagnostics, trace metadata, and replay fingerprint without raw secret-like content
- **中文** 当 hooks v1 为某个 lifecycle point 调用 hooks 时，发出或捕获的 records 必须包含 schema version、point、ordered hook ids、per-hook status、terminal status、redaction metadata、diagnostics、trace metadata 和 replay fingerprint，且不包含 raw secret-like content。

#### Scenario: Hook output does not mutate bus state / hook output 不修改 bus 状态

- **WHEN** a hook returns observation, context, policy, workflow, capability, or host render output
- **THEN** the bus records the output as evidence only, and no runtime state mutation happens through the bus record itself
- **中文** 当 hook 返回 observation、context、policy、workflow、capability 或 host render output 时，bus 只能将 output 记录为 evidence，不能通过 bus record 本身修改 runtime state。
