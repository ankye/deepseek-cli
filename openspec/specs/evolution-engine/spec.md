# evolution-engine Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Versioned Capability Bundles

The evolution engine SHALL track framework version, capability bundle version, model profile version, prompt profile version, policy profile version, and compatibility ranges for runtime execution.

evolution engine 必须跟踪 framework version、capability bundle version、model profile version、prompt profile version、policy profile version 和 runtime execution 的 compatibility ranges。

#### Scenario: Select compatible capability bundle

- **WHEN** the runtime starts with a configured capability bundle
- **THEN** the evolution engine validates compatibility before the bundle can be enabled

#### Scenario: Record versions in session metadata

- **WHEN** a session turn starts
- **THEN** the active framework, capability bundle, model profile, prompt profile, and policy profile versions are recorded in session metadata

### Requirement: Feature Gates and Experiments

The evolution engine SHALL define deterministic feature gates for experimental capabilities, prompt variants, policy variants, model profiles, and extension contribution points.

evolution engine 必须为 experimental capabilities、prompt variants、policy variants、model profiles 和 extension contribution points 定义确定性的 feature gates。

#### Scenario: Experimental feature is disabled by default

- **WHEN** an experimental capability is available but not enabled by configuration or policy
- **THEN** it is not projected to models or executed

#### Scenario: Feature gate is auditable

- **WHEN** a feature gate changes runtime behavior
- **THEN** the selected gate and reason are available to session metadata and audit records

### Requirement: Migrations, Deprecations, and Rollback

The evolution engine SHALL define migration, deprecation, compatibility check, and rollback metadata for configuration, session records, capability manifests, and extension manifests.

evolution engine 必须为 configuration、session records、capability manifests 和 extension manifests 定义 migration、deprecation、compatibility check 和 rollback metadata。

#### Scenario: Migration declares rollback metadata

- **WHEN** a migration updates stored configuration or session metadata
- **THEN** it records the source version, target version, migration id, and rollback strategy

#### Scenario: Deprecated capability is controlled by policy

- **WHEN** a deprecated capability is still available for compatibility
- **THEN** policy and feature gates decide whether it can be projected or executed

### Requirement: Feedback Loop Boundary

The evolution engine SHALL accept feedback records from audit, telemetry, tests, and user reports only through redacted and explicit interfaces.

evolution engine 必须只通过经过脱敏且显式的接口接收来自 audit、telemetry、tests 和 user reports 的 feedback records。

#### Scenario: Feedback record is redacted

- **WHEN** feedback is created from a runtime event, tool result, or model output
- **THEN** it passes through the configured redaction boundary before storage or analysis

#### Scenario: Feedback does not grant permissions

- **WHEN** feedback suggests enabling a capability or changing policy
- **THEN** it creates a recommendation or configuration candidate
- **AND** it does not directly grant permissions

### Requirement: Reproducible Runtime Behavior

The evolution engine SHALL preserve enough version, feature gate, migration, and profile metadata for a session to be replayed or audited against the same intended behavior.

evolution engine 必须保存足够的 version、feature gate、migration 和 profile metadata，让 session 可以按相同预期行为进行 replay 或 audit。

#### Scenario: Replay uses recorded evolution metadata

- **WHEN** a session is replayed for audit or testing
- **THEN** the runtime can resolve the recorded framework, capability bundle, profile, and feature gate metadata

### Requirement: No Silent Self-Modification

The evolution engine SHALL NOT silently modify executable runtime code, enable untrusted extensions, or grant new permissions without explicit configuration, policy, or user approval.

evolution engine 禁止静默修改可执行 runtime code、启用 untrusted extensions 或授予新权限，除非经过显式 configuration、policy 或 user approval。

#### Scenario: Evolution recommends an update

- **WHEN** the evolution engine determines that a newer compatible bundle or profile is available
- **THEN** it records or surfaces a recommendation
- **AND** it does not apply the update without the configured approval path

