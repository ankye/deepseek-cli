## ADDED Requirements

### Requirement: Immutable Host Capability Projection

The capability registry SHALL return immutable metadata-only projections to host adapters and model-visible lists.

capability registry 必须向 host adapters 和 model-visible lists 返回 immutable metadata-only projections。

#### Scenario: Host mutation cannot alter registry

- **WHEN** a host mutates a returned capability manifest or nested schema object
- **THEN** the registry's stored manifest and future projections remain unchanged

#### Scenario: Projection excludes executor binding

- **WHEN** a host lists or reads capability metadata
- **THEN** it cannot access executor functions or kernel-only executable bindings

### Requirement: Kernel-Only Executor Resolution

Executable capability binding resolution SHALL be limited to approved kernel execution owners and primitive owner packages.

executable capability binding resolution 必须限制在 approved kernel execution owners 和 primitive owner packages 内。

#### Scenario: Host cannot resolve executable

- **WHEN** CLI, VSCode, or future server host code attempts to resolve a capability executor directly
- **THEN** architecture lint fails with a stable rule id
