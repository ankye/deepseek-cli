## ADDED Requirements

### Requirement: Distribution and Update Boundary

The platform SHALL define distribution and update management for CLI releases, VSCode extension releases, plugin catalogs, bundled capability bundles, compatibility notices, migrations, and rollback metadata.

平台必须定义 distribution and update management，覆盖 CLI releases、VSCode extension releases、plugin catalogs、bundled capability bundles、compatibility notices、migrations 和 rollback metadata。

#### Scenario: Runtime receives compatibility notice

- **WHEN** a release, bundle, contract, or plugin catalog declares a compatibility notice
- **THEN** the evolution engine can evaluate migrations, deprecations, feature gates, and rollback options before enabling affected behavior

### Requirement: Update Checks Are Host Adapters

Update checks, notifications, and user prompts SHALL be implemented through host adapters and shared protocol events, while compatibility decisions remain in platform services.

update checks、notifications 和 user prompts 必须通过 host adapters 与共享 protocol events 实现，而 compatibility decisions 保留在 platform services 中。

#### Scenario: Headless update notice is structured

- **WHEN** a headless run detects an update or compatibility notice
- **THEN** it emits structured protocol events without requiring terminal UI interaction

### Requirement: Signed Bundle Governance

The distribution system SHALL support signed release and plugin bundle metadata, allowlists, blocklists, provenance, and audit records.

distribution system 必须支持 signed release 和 plugin bundle metadata、allowlists、blocklists、provenance 和 audit records。

#### Scenario: Blocked bundle is not enabled

- **WHEN** a release bundle, plugin bundle, or catalog entry is blocked by policy
- **THEN** the platform refuses enablement and records a structured audit event
