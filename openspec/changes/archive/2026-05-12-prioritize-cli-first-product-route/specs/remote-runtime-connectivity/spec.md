## ADDED Requirements

### Requirement: Server And SDK Follow CLI-Proven Protocol Semantics / Server 与 SDK 跟随 CLI 已验证协议语义

Remote runtime connectivity, local daemon/server, and public SDK work SHALL be sequenced after the CLI has proven the runtime event stream, control semantics, approval behavior, session behavior, and diagnostics needed for those surfaces.

Remote runtime connectivity、local daemon/server 和 public SDK 工作必须排在 CLI 证明这些 surface 所需的 runtime event stream、control semantics、approval behavior、session behavior 和 diagnostics 之后。

#### Scenario: Server feature waits for CLI protocol proof / Server 功能等待 CLI 协议证明

- **WHEN** a local server, remote runtime, SDK, browser/native bridge, or remote session feature is proposed
- **THEN** the proposal cites CLI-proven protocol events, session artifacts, control/cancellation semantics, policy/audit traces, and replay fixtures unless the work is explicitly contract-only
- **中文** 当提出 local server、remote runtime、SDK、browser/native bridge 或 remote session 功能时，proposal 必须引用 CLI 已验证的 protocol events、session artifacts、control/cancellation semantics、policy/audit traces 和 replay fixtures，除非该工作明确仅限 contract-only。

#### Scenario: Contract-only remote work remains allowed / 仅契约远程工作仍允许

- **WHEN** a remote/server change is needed before CLI gates pass to preserve versioned schemas, compatibility tests, or transport seams
- **THEN** it does not expose a new product workflow as stable and records the CLI gate that will activate productization later
- **中文** 当 CLI 门禁通过前需要 remote/server 变更来维护 versioned schemas、compatibility tests 或 transport seams 时，它不得把新产品 workflow 暴露为 stable，并必须记录后续激活产品化所需的 CLI gate。

#### Scenario: SDK projects stable CLI behavior / SDK 投影稳定 CLI 行为

- **WHEN** a public runtime SDK/control API becomes product scope
- **THEN** it exposes versioned schemas for behavior already proven through CLI acceptance evidence, rather than defining divergent SDK-only semantics
- **中文** 当 public runtime SDK/control API 成为产品范围时，它必须暴露已通过 CLI 验收证据证明的行为的版本化 schemas，而不是定义分叉的 SDK-only semantics。
