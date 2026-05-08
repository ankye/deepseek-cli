## ADDED Requirements

### Requirement: Runtime Uses Governed Invocation Boundary

The runtime SHALL be the temporary first execution owner for governed capability invocation until a dedicated execution orchestrator exists, and it SHALL preserve execution envelope, policy, scheduler, bus, trace, audit, and replay boundaries when invoking executable capabilities.

runtime 必须在 dedicated execution orchestrator 出现前作为临时第一 execution owner，并在调用 executable capabilities 时保留 execution envelope、policy、scheduler、bus、trace、audit 和 replay boundaries。

#### Scenario: Runtime invokes model through governed boundary

- **WHEN** runtime needs a model stream, capability execution, command execution, skill activation, hook invocation, MCP call, sandbox job, plugin lifecycle action, or subagent turn
- **THEN** it creates or receives a governed execution envelope rather than allowing application adapters to call the primitive directly

#### Scenario: Direct host bypass is forbidden

- **WHEN** CLI, VSCode, or future server host needs executable work
- **THEN** it calls runtime or protocol endpoints and does not directly invoke model, skill, hook, command, MCP, plugin, sandbox, or capability execution primitives
