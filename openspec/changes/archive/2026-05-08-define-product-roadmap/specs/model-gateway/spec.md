## ADDED Requirements

### Requirement: Model Capability Governance Roadmap / 模型能力治理路线图

The model gateway SHALL include roadmap requirements for model capability metadata, default model policy, provider feature flags, fallback decisions, migration gates, and compatibility fixtures.

model gateway 必须包含 model capability metadata、default model policy、provider feature flags、fallback decisions、migration gates 和 compatibility fixtures 的路线图要求。

#### Scenario: Provider capability is declared before projection / provider 能力投影前必须声明

- **WHEN** a model provider or model version is used for runtime execution
- **THEN** the gateway exposes capability metadata for tools, streaming, reasoning, context window, usage accounting, unsupported feature rejection, and fallback eligibility
- **中文** 当 model provider 或 model version 用于 runtime execution 时，gateway 必须暴露 tools、streaming、reasoning、context window、usage accounting、unsupported feature rejection 和 fallback eligibility 的 capability metadata。

#### Scenario: Model migration requires fixture evidence / 模型迁移需要 fixture 证据

- **WHEN** default model policy, provider capability mapping, or model migration changes
- **THEN** compatibility fixtures cover migration, rollback, unsupported capability rejection, and provider fallback decision recording
- **中文** 当 default model policy、provider capability mapping 或 model migration 变化时，compatibility fixtures 必须覆盖 migration、rollback、unsupported capability rejection 和 provider fallback decision recording。
