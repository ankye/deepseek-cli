## ADDED Requirements

### Requirement: Mandatory Policy Before Scheduling

The runtime kernel SHALL evaluate policy and sandbox profile selection after strict envelope validation and before scheduler submission.

runtime kernel 必须在 strict envelope validation 之后、scheduler submission 之前执行 policy 和 sandbox profile selection。

#### Scenario: Policy denial prevents scheduling

- **WHEN** policy denies or quarantines a governed invocation
- **THEN** no scheduler task is created and the canonical event stream contains a typed rejection

#### Scenario: Invalid envelope prevents policy

- **WHEN** envelope validation fails
- **THEN** policy and sandbox are not called
