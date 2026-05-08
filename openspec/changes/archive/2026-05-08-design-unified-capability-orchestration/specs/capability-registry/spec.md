## ADDED Requirements

### Requirement: Capability Execution Metadata

The capability registry SHALL require executable capabilities to declare execution kind, side-effect level, trust boundary, permissions, resource requirements, timeout defaults, retry safety, idempotency requirements, sandbox requirement, host support, compatibility range, and replay policy before projection or execution.

capability registry 必须要求 executable capabilities 在 projection 或 execution 前声明 execution kind、side-effect level、trust boundary、permissions、resource requirements、timeout defaults、retry safety、idempotency requirements、sandbox requirement、host support、compatibility range 和 replay policy。

#### Scenario: Missing execution metadata blocks executable projection

- **WHEN** a capability has an executor but lacks execution constraint metadata
- **THEN** the registry does not project it as model-visible or executable and returns a structured validation error

#### Scenario: Context-only capability remains lightweight

- **WHEN** a capability only contributes bounded context or schema projection without execution
- **THEN** it can be registered as projectable without scheduler metadata but still records provenance and compatibility metadata
